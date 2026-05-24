const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// LIST (por contrato ou passageiro)
router.get('/', async (req, res) => {
  try {
    const { contrato_id, passageiro_id, mes_referencia, empresa_id } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (contrato_id)    { params.push(contrato_id);    where += ` AND pg.contrato_id = $${params.length}`; }
    if (passageiro_id)  { params.push(passageiro_id);  where += ` AND c.passageiro_id = $${params.length}`; }
    if (mes_referencia) { params.push(mes_referencia); where += ` AND pg.mes_referencia = $${params.length}`; }
    if (empresa_id) {
      params.push(empresa_id);
      where += ` AND c.rota_id IN (SELECT ro.id FROM rotas ro JOIN frotas fo ON fo.id = ro.frota_id WHERE fo.empresa_id = $${params.length})`;
    }

    const { rows } = await pool.query(
      `SELECT pg.*,
              u.nome AS passageiro_nome,
              r.nome AS rota_nome,
              cv.id AS comprovante_id,
              cv.file_url, cv.file_name, cv.status AS comprovante_status
       FROM pagamentos pg
       JOIN contratos c ON c.id = pg.contrato_id
       JOIN passageiros p ON p.id = c.passageiro_id
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN rotas r ON r.id = c.rota_id
       LEFT JOIN comprovantes_v2 cv ON cv.pagamento_id = pg.id
       ${where}
       ORDER BY pg.vencimento DESC`,
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
      `SELECT pg.*,
              u.nome AS passageiro_nome,
              r.nome AS rota_nome,
              cv.id AS comprovante_id,
              cv.file_url, cv.file_name, cv.status AS comprovante_status
       FROM pagamentos pg
       JOIN contratos c ON c.id = pg.contrato_id
       JOIN passageiros p ON p.id = c.passageiro_id
       JOIN usuarios u ON u.id = p.usuario_id
       JOIN rotas r ON r.id = c.rota_id
       LEFT JOIN comprovantes_v2 cv ON cv.pagamento_id = pg.id
       WHERE pg.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pagamento não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { contrato_id, mes_referencia, valor, vencimento } = req.body;
    if (!contrato_id || !mes_referencia || !valor || !vencimento)
      return res.status(400).json({ error: 'contrato_id, mes_referencia, valor e vencimento obrigatórios.' });
    const { rows } = await pool.query(
      `INSERT INTO pagamentos (contrato_id, mes_referencia, valor, vencimento)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [contrato_id, mes_referencia, valor, vencimento]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Pagamento deste mês já existe.' });
    res.status(500).json({ error: err.message });
  }
});

// UPDATE status
router.put('/:id', async (req, res) => {
  try {
    const { status, valor, vencimento } = req.body;
    const { rows } = await pool.query(
      `UPDATE pagamentos SET
         status     = COALESCE($1, status),
         valor      = COALESCE($2, valor),
         vencimento = COALESCE($3, vencimento)
       WHERE id = $4
       RETURNING *`,
      [status, valor, vencimento, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pagamento não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirmar pagamento
router.post('/:id/confirmar', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE pagamentos SET status = 'confirmado' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pagamento não encontrado.' });
    await pool.query(
      `UPDATE comprovantes_v2 SET status = 'confirmado' WHERE pagamento_id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rejeitar pagamento
router.post('/:id/rejeitar', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE pagamentos SET status = 'rejeitado' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Pagamento não encontrado.' });
    await pool.query(
      `UPDATE comprovantes_v2 SET status = 'rejeitado' WHERE pagamento_id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
