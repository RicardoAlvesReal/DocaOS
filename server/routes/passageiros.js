const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// LIST (por empresa)
router.get('/', async (req, res) => {
  try {
    const { empresa_id } = req.query;
    const where = empresa_id ? 'WHERE p.empresa_id = $1' : '';
    const params = empresa_id ? [empresa_id] : [];
    const { rows } = await pool.query(
      `SELECT p.*, u.nome, u.email, u.ativo,
              COUNT(a.id)::int AS total_alunos
       FROM passageiros p
       JOIN usuarios u ON u.id = p.usuario_id
       LEFT JOIN alunos_v2 a ON a.passageiro_id = p.id
       ${where}
       GROUP BY p.id, u.nome, u.email, u.ativo
       ORDER BY u.nome ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ONE (com alunos dependentes)
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, u.nome, u.email, u.ativo
       FROM passageiros p
       JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Passageiro não encontrado.' });

    const { rows: alunos } = await pool.query(
      'SELECT * FROM alunos_v2 WHERE passageiro_id = $1 ORDER BY nome',
      [req.params.id]
    );

    res.json({ ...rows[0], alunos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE (cria usuario + perfil passageiro em transação)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { nome, email, senha, empresa_id, cpf, telefone, endereco } = req.body;
    if (!nome || !email || !senha || !empresa_id)
      return res.status(400).json({ error: 'nome, email, senha e empresa_id obrigatórios.' });

    await client.query('BEGIN');

    const { rows: uRows } = await client.query(
      `INSERT INTO usuarios (nome, email, senha, role, empresa_id)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), 'passageiro', $4)
       RETURNING *`,
      [nome, email, senha, empresa_id]
    );
    const usuario = uRows[0];

    const { rows: pRows } = await client.query(
      `INSERT INTO passageiros (usuario_id, empresa_id, cpf, telefone, endereco)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario.id, empresa_id, cpf || null, telefone || null, endereco || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...pRows[0], nome: usuario.nome, email: usuario.email });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'E-mail ou CPF já cadastrado.' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { cpf, telefone, endereco } = req.body;
    const { rows } = await pool.query(
      `UPDATE passageiros SET
         cpf      = COALESCE($1, cpf),
         telefone = COALESCE($2, telefone),
         endereco = COALESCE($3, endereco)
       WHERE id = $4
       RETURNING *`,
      [cpf, telefone, endereco, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Passageiro não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (desativa o usuário vinculado)
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT usuario_id FROM passageiros WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Passageiro não encontrado.' });
    await pool.query('UPDATE usuarios SET ativo = FALSE WHERE id = $1', [rows[0].usuario_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Alunos dependentes ──────────────────────────────────────────────────────

// ADD aluno
router.post('/:id/alunos', async (req, res) => {
  try {
    const { nome, data_nascimento, escola, turno } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome do aluno obrigatório.' });
    const { rows } = await pool.query(
      `INSERT INTO alunos_v2 (passageiro_id, nome, data_nascimento, escola, turno)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.params.id, nome, data_nascimento || null, escola || null, turno || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE aluno
router.delete('/:id/alunos/:alunoId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM alunos_v2 WHERE id = $1 AND passageiro_id = $2',
      [req.params.alunoId, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
