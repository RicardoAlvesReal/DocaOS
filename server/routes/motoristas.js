const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// LIST (por empresa)
router.get('/', async (req, res) => {
  try {
    const { empresa_id } = req.query;
    const where = empresa_id ? 'WHERE m.empresa_id = $1' : '';
    const params = empresa_id ? [empresa_id] : [];
    const { rows } = await pool.query(
      `SELECT m.*, u.nome, u.email, u.ativo
       FROM motoristas m
       JOIN usuarios u ON u.id = m.usuario_id
       ${where}
       ORDER BY u.nome ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.nome, u.email, u.ativo
       FROM motoristas m
       JOIN usuarios u ON u.id = m.usuario_id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Motorista não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE (cria usuario + perfil motorista em transação)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { nome, email, senha, empresa_id, cnh, cnh_validade, telefone } = req.body;
    if (!nome || !email || !senha || !empresa_id)
      return res.status(400).json({ error: 'nome, email, senha e empresa_id obrigatórios.' });

    await client.query('BEGIN');

    const { rows: uRows } = await client.query(
      `INSERT INTO usuarios (nome, email, senha, role, empresa_id)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), 'motorista', $4)
       RETURNING *`,
      [nome, email, senha, empresa_id]
    );
    const usuario = uRows[0];

    const { rows: mRows } = await client.query(
      `INSERT INTO motoristas (usuario_id, empresa_id, cnh, cnh_validade, telefone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario.id, empresa_id, cnh || null, cnh_validade || null, telefone || null]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...mRows[0], nome: usuario.nome, email: usuario.email });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'E-mail já cadastrado.' });
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { cnh, cnh_validade, telefone } = req.body;
    const { rows } = await pool.query(
      `UPDATE motoristas SET
         cnh          = COALESCE($1, cnh),
         cnh_validade = COALESCE($2, cnh_validade),
         telefone     = COALESCE($3, telefone)
       WHERE id = $4
       RETURNING *`,
      [cnh, cnh_validade, telefone, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Motorista não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (desativa o usuário vinculado)
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT usuario_id FROM motoristas WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Motorista não encontrado.' });
    await pool.query('UPDATE usuarios SET ativo = FALSE WHERE id = $1', [rows[0].usuario_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
