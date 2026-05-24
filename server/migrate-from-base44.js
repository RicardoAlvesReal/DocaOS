/**
 * migrate-from-base44.js
 * Exporta todos os dados do base44 (cloud) e insere no PostgreSQL local.
 *
 * Pré-requisitos:
 *   1. server/.env preenchido com DB_PASSWORD correto.
 *   2. VITE_BASE44_APP_ID e VITE_BASE44_ACCESS_TOKEN definidos abaixo
 *      (ou via variáveis de ambiente BASE44_APP_ID / BASE44_ACCESS_TOKEN).
 *   3. Execute:  node migrate-from-base44.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// ── Configuração base44 ───────────────────────────────────────────────────────
const BASE44_APP_ID      = process.env.BASE44_APP_ID      || 'SEU_APP_ID_AQUI';
const BASE44_ACCESS_TOKEN = process.env.BASE44_ACCESS_TOKEN || 'SEU_TOKEN_AQUI';

const BASE44_API = `https://app.base44.com/api/apps/${BASE44_APP_ID}/entities`;

// ── Pool local ────────────────────────────────────────────────────────────────
const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'rotaflow',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function fetchAll(entity) {
  const headers = {
    'Authorization': `Bearer ${BASE44_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };
  const url = `${BASE44_API}/${entity}?limit=500`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Erro ao buscar ${entity}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function migrateAlunos(alunos) {
  let inserted = 0, skipped = 0;
  for (const a of alunos) {
    try {
      await pool.query(
        `INSERT INTO alunos (id, nome, responsavel, matricula, senha, primeiro_acesso, mensalidade, meses, created_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (matricula) DO NOTHING`,
        [
          a.id || uuidv4(),
          a.nome,
          a.responsavel || null,
          a.matricula,
          a.senha,
          a.primeiro_acesso !== false,
          parseFloat(a.mensalidade) || 0,
          JSON.stringify(a.meses || {}),
          a.created_date ? new Date(a.created_date) : new Date(),
        ]
      );
      inserted++;
    } catch (err) {
      console.warn(`  [aluno skip] ${a.matricula}: ${err.message}`);
      skipped++;
    }
  }
  return { inserted, skipped };
}

async function migrateComprovantes(comprovantes) {
  let inserted = 0, skipped = 0;
  for (const c of comprovantes) {
    try {
      await pool.query(
        `INSERT INTO comprovantes (id, matricula, mes_key, file_url, file_name, status, created_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [
          c.id || uuidv4(),
          c.matricula,
          c.mesKey,
          c.fileUrl  || null,
          c.fileName || null,
          c.status   || 'aguardando',
          c.created_date ? new Date(c.created_date) : new Date(),
        ]
      );
      inserted++;
    } catch (err) {
      console.warn(`  [comprovante skip] ${c.id}: ${err.message}`);
      skipped++;
    }
  }
  return { inserted, skipped };
}

async function main() {
  console.log('=== Migração base44 → PostgreSQL ===\n');

  if (BASE44_APP_ID === 'SEU_APP_ID_AQUI' || BASE44_ACCESS_TOKEN === 'SEU_TOKEN_AQUI') {
    console.error(
      'ERRO: Configure BASE44_APP_ID e BASE44_ACCESS_TOKEN no arquivo server/.env\n' +
      '      ou como variáveis de ambiente antes de executar este script.\n\n' +
      '      O APP_ID pode ser obtido na URL do painel base44.\n' +
      '      O ACCESS_TOKEN pode ser obtido na aba de configurações da aplicação.'
    );
    process.exit(1);
  }

  console.log('Buscando alunos do base44...');
  const alunos = await fetchAll('Aluno');
  console.log(`  ${alunos.length} alunos encontrados.`);

  console.log('Buscando comprovantes do base44...');
  const comprovantes = await fetchAll('Comprovante');
  console.log(`  ${comprovantes.length} comprovantes encontrados.\n`);

  console.log('Inserindo alunos no PostgreSQL...');
  const ra = await migrateAlunos(alunos);
  console.log(`  Inseridos: ${ra.inserted} | Ignorados (duplicados): ${ra.skipped}`);

  console.log('Inserindo comprovantes no PostgreSQL...');
  const rc = await migrateComprovantes(comprovantes);
  console.log(`  Inseridos: ${rc.inserted} | Ignorados (duplicados): ${rc.skipped}`);

  await pool.end();
  console.log('\nMigração concluída!');
}

main().catch(err => {
  console.error('ERRO na migração:', err.message);
  process.exit(1);
});
