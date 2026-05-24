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
      where = 'WHERE r.frota_id = $1';
      params.push(frota_id);
    } else if (empresa_id) {
      where = 'WHERE f.empresa_id = $1';
      params.push(empresa_id);
    }
    const { rows } = await pool.query(
      `SELECT r.*,
              f.nome AS frota_nome,
              u.nome AS motorista_nome,
              v.placa, v.modelo,
              COUNT(c.id)::int AS total_passageiros
       FROM rotas r
       JOIN frotas f ON f.id = r.frota_id
       LEFT JOIN motoristas m ON m.id = r.motorista_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       LEFT JOIN veiculos v ON v.id = r.veiculo_id
       LEFT JOIN contratos c ON c.rota_id = r.id AND c.status = 'ativo'
       ${where}
       GROUP BY r.id, f.nome, u.nome, v.placa, v.modelo
       ORDER BY r.nome ASC`,
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
      `SELECT r.*,
              f.nome AS frota_nome,
              u.nome AS motorista_nome,
              v.placa, v.modelo
       FROM rotas r
       JOIN frotas f ON f.id = r.frota_id
       LEFT JOIN motoristas m ON m.id = r.motorista_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       LEFT JOIN veiculos v ON v.id = r.veiculo_id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rota não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { nome, descricao, frota_id, motorista_id, veiculo_id, horario_ida, horario_volta } = req.body;
    if (!nome || !frota_id)
      return res.status(400).json({ error: 'nome e frota_id obrigatórios.' });
    const { rows } = await pool.query(
      `INSERT INTO rotas (nome, descricao, frota_id, motorista_id, veiculo_id, horario_ida, horario_volta)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nome, descricao || null, frota_id, motorista_id || null, veiculo_id || null,
       horario_ida || null, horario_volta || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    const { nome, descricao, frota_id, motorista_id, veiculo_id, horario_ida, horario_volta, ativo } = req.body;
    const { rows } = await pool.query(
      `UPDATE rotas SET
         nome          = COALESCE($1, nome),
         descricao     = COALESCE($2, descricao),
         frota_id      = COALESCE($3, frota_id),
         motorista_id  = $4,
         veiculo_id    = $5,
         horario_ida   = COALESCE($6, horario_ida),
         horario_volta = COALESCE($7, horario_volta),
         ativo         = COALESCE($8, ativo)
       WHERE id = $9
       RETURNING *`,
      [nome, descricao, frota_id, motorista_id ?? null, veiculo_id ?? null, horario_ida, horario_volta, ativo, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Rota não encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE rotas SET ativo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
