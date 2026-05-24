const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// LIST (por passageiro ou rota)
router.get('/', async (req, res) => {
  try {
    const { passageiro_id, rota_id, empresa_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (passageiro_id) { params.push(passageiro_id); where += ` AND c.passageiro_id = $${params.length}`; }
    if (rota_id)        { params.push(rota_id);        where += ` AND c.rota_id = $${params.length}`; }
    if (empresa_id)     { params.push(empresa_id);     where += ` AND p_empresa.id = $${params.length}`; }

    const { rows } = await pool.query(
      `SELECT c.*,
              u.nome AS passageiro_nome,
              r.nome AS rota_nome
       FROM contratos c
       JOIN passageiros p ON p.id = c.passageiro_id
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN rotas r ON r.id = c.rota_id
       JOIN empresas p_empresa ON p_empresa.id = p.empresa_id
       ${where}
       ORDER BY c.created_date DESC`,
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
      `SELECT c.*,
              u.nome AS passageiro_nome,
              r.nome AS rota_nome
       FROM contratos c
       JOIN passageiros p ON p.id = c.passageiro_id
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN rotas r ON r.id = c.rota_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contrato não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { passageiro_id, rota_id, valor_mensal, data_inicio, data_fim } = req.body;
    if (!passageiro_id || !rota_id || !valor_mensal || !data_inicio)
      return res.status(400).json({ error: 'passageiro_id, rota_id, valor_mensal e data_inicio obrigatórios.' });
    const { rows } = await pool.query(
      `INSERT INTO contratos (passageiro_id, rota_id, valor_mensal, data_inicio, data_fim)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [passageiro_id, rota_id, valor_mensal, data_inicio, data_fim || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (status, valor, datas)
router.put('/:id', async (req, res) => {
  try {
    const { valor_mensal, data_inicio, data_fim, status } = req.body;
    const { rows } = await pool.query(
      `UPDATE contratos SET
         valor_mensal = COALESCE($1, valor_mensal),
         data_inicio  = COALESCE($2, data_inicio),
         data_fim     = COALESCE($3, data_fim),
         status       = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [valor_mensal, data_inicio, data_fim, status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Contrato não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (cancela)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE contratos SET status = 'cancelado' WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
