const { Router } = require('express');
const pool = require('../db');

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { matricula, senha } = req.body; // matricula = campo de email
  if (!matricula || !senha) {
    return res.status(400).json({ error: 'email e senha são obrigatórios' });
  }

  try {
    const { rows: users } = await pool.query(
      `SELECT u.id, u.nome, u.email, u.role, u.empresa_id, u.frota_id, u.primeiro_acesso,
              e.nome AS empresa_nome, e.plano AS empresa_plano
       FROM usuarios u
       LEFT JOIN empresas e ON e.id = u.empresa_id
       WHERE u.email = $1
         AND u.senha = crypt($2, u.senha)
         AND u.ativo = TRUE`,
      [matricula.trim().toLowerCase(), senha.trim()]
    );
    if (users.length) {
      const u = users[0];
      return res.json({
        type:           u.role === 'super_admin' ? 'super_admin' : 'empresa',
        id:             u.id,
        nome:           u.nome,
        email:          u.email,
        role:           u.role,
        empresa_id:     u.empresa_id,
        empresa_nome:   u.empresa_nome,
        empresa_plano:  u.empresa_plano,
        frota_id:       u.frota_id,
        primeiro_acesso: u.primeiro_acesso,
      });
    }

    return res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
