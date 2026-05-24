const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// LIST (por frota ou empresa)
router.get('/', async (req, res) => {
  try {
    const { frota_id, empresa_id } = req.query;
    let where = '';
    const params = [];
    if (frota_id) {
      where = 'WHERE v.frota_id = $1';
      params.push(frota_id);
    } else if (empresa_id) {
      where = 'WHERE f.empresa_id = $1';
      params.push(empresa_id);
    }
    const { rows } = await pool.query(
      `SELECT v.*, f.nome AS frota_nome
       FROM veiculos v
       JOIN frotas f ON f.id = v.frota_id
       ${where}
       ORDER BY v.created_date DESC`,
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
      `SELECT v.*, f.nome AS frota_nome
       FROM veiculos v JOIN frotas f ON f.id = v.frota_id
       WHERE v.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Veículo não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { placa, modelo, ano, capacidade, frota_id } = req.body;
    if (!placa || !modelo || !frota_id)
      return res.status(400).json({ error: 'placa, modelo e frota_id obrigatórios.' });
    const { rows } = await pool.query(
      `INSERT INTO veiculos (placa, modelo, ano, capacidade, frota_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [placa.toUpperCase(), modelo, ano || null, capacidade || null, frota_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Placa já cadastrada.' });
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { placa, modelo, ano, capacidade, frota_id, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE veiculos SET
         placa      = COALESCE($1, placa),
         modelo     = COALESCE($2, modelo),
         ano        = COALESCE($3, ano),
         capacidade = COALESCE($4, capacidade),
         frota_id   = COALESCE($5, frota_id),
         status     = COALESCE($6, status)
       WHERE id = $7
       RETURNING *`,
      [placa ? placa.toUpperCase() : null, modelo, ano, capacidade, frota_id, status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Veículo não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE veiculos SET status = $1 WHERE id = $2', ['inativo', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
