require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');

const authRouter         = require('./routes/auth');
const uploadRouter       = require('./routes/upload');

// ── Rotas v2 (multi-tenant) ──────────────────────────────────────────────────
const empresasRouter     = require('./routes/empresas');
const frotasRouter       = require('./routes/frotas');
const veiculosRouter     = require('./routes/veiculos');
const motoristasRouter   = require('./routes/motoristas');
const passageirosRouter  = require('./routes/passageiros');
const rotasRouter        = require('./routes/rotas');
const contratosRouter    = require('./routes/contratos');
const pagamentosRouter   = require('./routes/pagamentos');
const usuariosRouter     = require('./routes/usuarios');

const app  = express();
const PORT = parseInt(process.env.PORT || '3001');

// ── Middlewares ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://25.41.113.185:5173'],
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));

// Serve arquivos de comprovante enviados localmente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',   authRouter);
app.use('/api/upload', uploadRouter);

// ── Rotas v2 (multi-tenant) ──────────────────────────────────────────────────
app.use('/api/empresas',    empresasRouter);
app.use('/api/frotas',      frotasRouter);
app.use('/api/veiculos',    veiculosRouter);
app.use('/api/motoristas',  motoristasRouter);
app.use('/api/passageiros', passageirosRouter);
app.use('/api/rotas',       rotasRouter);
app.use('/api/contratos',   contratosRouter);
app.use('/api/pagamentos',  pagamentosRouter);
app.use('/api/usuarios',    usuariosRouter);

// ── Função: enviarComprovante (replica a cloud function do base44) ────────────
app.post('/api/functions/enviarComprovante', async (req, res) => {
  try {
    const pool = require('./db');
    const { v4: uuidv4 } = require('uuid');
    const { matricula, mesKey, fileUrl, fileName } = req.body;

    if (!matricula || !mesKey || !fileUrl) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // Cria comprovante
    await pool.query(
      `INSERT INTO comprovantes (id, matricula, mes_key, file_url, file_name, status)
       VALUES ($1,$2,$3,$4,$5,'aguardando')`,
      [uuidv4(), matricula, mesKey, fileUrl, fileName || '']
    );

    // Atualiza meses do aluno
    const { rows } = await pool.query('SELECT meses FROM alunos WHERE matricula = $1', [matricula]);
    if (rows.length > 0) {
      const meses = { ...(rows[0].meses || {}), [mesKey]: 'aguardando' };
      await pool.query('UPDATE alunos SET meses = $1 WHERE matricula = $2', [JSON.stringify(meses), matricula]);
    }

    res.json({ data: { success: true } });
  } catch (err) {
    console.error('[enviarComprovante]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Start ─────────────────────────────────────────────────────────────────────
const pool = require('./db');
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[RotaFlow Server] rodando em http://localhost:${PORT}`);
  // Migração automática: adiciona logo_url à tabela empresas se não existir
  try {
    await pool.query(`ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_perfil VARCHAR(500)`);
  } catch (e) {
    console.warn('[migrate] logo_url:', e.message);
  }
});
