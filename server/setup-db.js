/**
 * setup-db.js
 * Cria o banco rotaflow e aplica o schema.
 * Execute com:  node setup-db.js
 */
require('dotenv').config();
const { Client } = require('pg');
const fs  = require('fs');
const path = require('path');

async function main() {
  const baseConfig = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD,
  };

  // 1. Conecta ao banco padrão "postgres" para criar o banco da aplicação
  const adminClient = new Client({ ...baseConfig, database: 'postgres' });
  await adminClient.connect();

  const dbName = process.env.DB_NAME || 'rotaflow';

  const { rows } = await adminClient.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
  );

  if (rows.length === 0) {
    await adminClient.query(`CREATE DATABASE "${dbName}"`);
    console.log(`[setup] Banco "${dbName}" criado.`);
  } else {
    console.log(`[setup] Banco "${dbName}" já existe — pulando criação.`);
  }
  await adminClient.end();

  // 2. Conecta ao banco da aplicação e aplica o schema
  const appClient = new Client({ ...baseConfig, database: dbName });
  await appClient.connect();

  const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  // Remove as linhas de CREATE DATABASE e \c (não executáveis via pg driver)
  const filteredSQL = schemaSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('CREATE DATABASE') && !line.trim().startsWith('\\c'))
    .join('\n');

  await appClient.query(filteredSQL);
  console.log('[setup] Schema aplicado com sucesso.');

  await appClient.end();
  console.log('[setup] Pronto! Banco configurado.');
}

main().catch(err => {
  console.error('[setup] ERRO:', err.message);
  process.exit(1);
});
