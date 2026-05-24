const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// LIST (por empresa)
router.get('/', async (req, res) => {
  try {
    const { empresa_id } = req.query;
    const where = empresa_id ? 'WHERE f.empresa_id = $1' : '';
    const params = empresa_id ? [empresa_id] : [];
    const { rows } = await pool.query(
      `SELECT f.*, u.nome AS sub_admin_nome,
              COUNT(v.id)::int AS total_veiculos
       FROM frotas f
       LEFT JOIN usuarios u ON u.id = f.sub_admin_id
       LEFT JOIN veiculos v ON v.frota_id = f.id
       ${where}
       GROUP BY f.id, u.nome
       ORDER BY f.created_date DESC`,
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
      `SELECT f.*, u.nome AS sub_admin_nome
       FROM frotas f
       LEFT JOIN usuarios u ON u.id = f.sub_admin_id
       WHERE f.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Frota não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { nome, empresa_id, sub_admin_id } = req.body;
    if (!nome || !empresa_id) return res.status(400).json({ error: 'Nome e empresa_id obrigatórios.' });
    const { rows } = await pool.query(
      `INSERT INTO frotas (nome, empresa_id, sub_admin_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nome, empresa_id, sub_admin_id || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { nome, sub_admin_id, ativo } = req.body;
    const { rows } = await pool.query(
      `UPDATE frotas SET
         nome         = COALESCE($1, nome),
         sub_admin_id = COALESCE($2, sub_admin_id),
         ativo        = COALESCE($3, ativo)
       WHERE id = $4
       RETURNING *`,
      [nome, sub_admin_id, ativo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Frota não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE frotas SET ativo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
