const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// LIST
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.*, u.nome AS admin_nome, u.email AS admin_email
       FROM empresas e
       LEFT JOIN usuarios u ON u.id = e.admin_id
       ORDER BY e.created_date DESC`
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
      `SELECT e.*, u.nome AS admin_nome, u.email AS admin_email
       FROM empresas e
       LEFT JOIN usuarios u ON u.id = e.admin_id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Empresa não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { nome, cnpj, email, telefone, plano } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome obrigatório.' });
    const { rows } = await pool.query(
      `INSERT INTO empresas (nome, cnpj, email, telefone, plano)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [nome, cnpj || null, email || null, telefone || null, plano || 'starter']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { nome, cnpj, email, telefone, plano, ativo, admin_id } = req.body;
    const { rows } = await pool.query(
      `UPDATE empresas SET
         nome      = COALESCE($1, nome),
         cnpj      = COALESCE($2, cnpj),
         email     = COALESCE($3, email),
         telefone  = COALESCE($4, telefone),
         plano     = COALESCE($5, plano),
         ativo     = COALESCE($6, ativo),
         admin_id  = COALESCE($7, admin_id)
       WHERE id = $8
       RETURNING *`,
      [nome, cnpj, email, telefone, plano, ativo, admin_id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Empresa não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE empresas SET ativo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
