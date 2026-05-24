import { api } from '@/api/apiClient';

export const MONTHS_MAP = {
  janeiro: 'Janeiro', fevereiro: 'Fevereiro',
  marco: 'Marco', abril: 'Abril', maio: 'Maio', junho: 'Junho',
  julho: 'Julho', agosto: 'Agosto', setembro: 'Setembro',
  outubro: 'Outubro', novembro: 'Novembro', dezembro: 'Dezembro',
};

export const MONTH_KEYS = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

export function getSession() {
  const data = localStorage.getItem('rotaflow_session');
  return data ? JSON.parse(data) : null;
}

export function logout() {
  localStorage.removeItem('rotaflow_session');
}

export async function login(email, senha) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matricula: email.trim(), senha: senha.trim() }),
  });
  if (!res.ok) return null;
  const user = await res.json();
  if (user.type === 'super_admin') {
    const session = { type: 'super_admin', id: user.id, nome: user.nome, email: user.email, role: 'super_admin' };
    localStorage.setItem('rotaflow_session', JSON.stringify(session));
    return session;
  }
  if (user.type === 'empresa') {
    const session = {
      type: 'empresa',
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      empresa_id: user.empresa_id,
      empresa_nome: user.empresa_nome,
      frota_id: user.frota_id,
    };
    localStorage.setItem('rotaflow_session', JSON.stringify(session));
    return session;
  }
  return null;
}

export function initData() {}
