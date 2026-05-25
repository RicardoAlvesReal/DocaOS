const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// GET /api/usuarios
// Query params: empresa_id, role
router.get('/', async (req, res) => {
  try {
    const conditions = ['u.role != $1'];
    const params     = ['super_admin'];
    let   idx        = 2;

    if (req.query.empresa_id) {
      conditions.push(`u.empresa_id = $${idx++}`);
      params.push(req.query.empresa_id);
    }
    if (req.query.role) {
      conditions.push(`u.role = $${idx++}`);
      params.push(req.query.role);
    }

    const sql = `
      SELECT
        u.id,
        u.nome,
        u.email,
        u.role,
        u.ativo,
        u.empresa_id,
        e.nome AS empresa_nome,
        u.created_date
      FROM usuarios u
      LEFT JOIN empresas e ON e.id = u.empresa_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY u.created_date DESC
    `;

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/usuarios error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/usuarios — criar usuário
router.post('/', async (req, res) => {
  try {
    const { nome, email, senha, role, empresa_id, ativo = true } = req.body;
    if (!nome || !email || !senha || !role) {
      return res.status(400).json({ error: 'nome, email, senha e role são obrigatórios.' });
    }
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nome, email, senha, role, empresa_id, ativo)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5, $6)
       RETURNING id, nome, email, role, ativo, empresa_id, created_date`,
      [nome, email, senha, role, empresa_id || null, ativo]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/usuarios error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'E-mail já cadastrado.' });
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/usuarios/:id/reset-senha — redefinir senha
router.patch('/:id/reset-senha', async (req, res) => {
  try {
    const { nova_senha } = req.body;
    if (!nova_senha || nova_senha.length < 4) {
      return res.status(400).json({ error: 'A nova senha precisa ter ao menos 4 caracteres.' });
    }
    const { rowCount } = await pool.query(
      `UPDATE usuarios SET senha = crypt($1, gen_salt('bf')) WHERE id = $2`,
      [nova_senha, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /api/usuarios/:id/reset-senha error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/usuarios/:id/toggle-ativo
router.patch('/:id/toggle-ativo', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT role, ativo FROM usuarios WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'Não é possível desativar o super admin.' });
    }
    const novoAtivo = !rows[0].ativo;
    await pool.query('UPDATE usuarios SET ativo = $1 WHERE id = $2', [novoAtivo, req.params.id]);
    res.json({ ok: true, ativo: novoAtivo });
  } catch (err) {
    console.error('PATCH /api/usuarios/:id/toggle-ativo error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/usuarios/:id — atualizar dados do usuário
router.put('/:id', async (req, res) => {
  try {
    const { nome, email, role, empresa_id } = req.body;

    const { rows: existing } = await pool.query('SELECT role FROM usuarios WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (existing[0].role === 'super_admin') {
      return res.status(403).json({ error: 'Não é possível alterar o super admin por este endpoint.' });
    }

    const { rows } = await pool.query(
      `UPDATE usuarios
       SET nome = COALESCE($1, nome),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           empresa_id = $4
       WHERE id = $5
       RETURNING id, nome, email, role, ativo, empresa_id, created_date`,
      [nome || null, email || null, role || null, empresa_id !== undefined ? empresa_id : null, req.params.id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error('PUT /api/usuarios/:id error:', err);
    if (err.code === '23505') return res.status(409).json({ error: 'E-mail já cadastrado.' });
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT role FROM usuarios WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Usuário não encontrado.' });
    if (rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'Não é possível excluir o super admin.' });
    }
    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/usuarios/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/usuarios/:id/foto-perfil
router.patch('/:id/foto-perfil', async (req, res) => {
  try {
    const { foto_perfil } = req.body;
    if (!foto_perfil) return res.status(400).json({ error: 'URL da foto obrigatória.' });
    const { rowCount } = await pool.query(
      `UPDATE usuarios SET foto_perfil = $1 WHERE id = $2`,
      [foto_perfil, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Usuário não encontrado.' });
    res.json({ ok: true, foto_perfil });
  } catch (err) {
    console.error('PATCH /api/usuarios/:id/foto-perfil error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
