const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

const ENTITY_PATHS = {
  // v2 (multi-tenant)
  Empresa:     '/empresas',
  Frota:       '/frotas',
  Veiculo:     '/veiculos',
  Motorista:   '/motoristas',
  Passageiro:  '/passageiros',
  Rota:        '/rotas',
  Contrato:    '/contratos',
  Pagamento:   '/pagamentos',
};

function createEntityClient(entityName) {
  const base = ENTITY_PATHS[entityName];

  return {
    list: (sort = '-created_date', limit = 200) =>
      apiFetch(`${base}?sort=${encodeURIComponent(sort)}&limit=${limit}`),

    filter: (where = {}) => {
      const qs = Object.entries(where)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      return apiFetch(`${base}${qs ? `?${qs}` : ''}`);
    },

    create: (data) =>
      apiFetch(base, { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
      apiFetch(`${base}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id) =>
      apiFetch(`${base}/${id}`, { method: 'DELETE' }),
  };
}

export const api = {
  entities: {
    // v2 (multi-tenant)
    Empresa:     createEntityClient('Empresa'),
    Frota:       createEntityClient('Frota'),
    Veiculo:     createEntityClient('Veiculo'),
    Motorista:   createEntityClient('Motorista'),
    Passageiro:  createEntityClient('Passageiro'),
    Rota:        createEntityClient('Rota'),
    Contrato:    createEntityClient('Contrato'),
    Pagamento:   createEntityClient('Pagamento'),
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    return res.json(); // { file_url: '/uploads/...' }
  },

  invokeFunction: async (name, params) => {
    const result = await apiFetch(`/functions/${name}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return { data: result };
  },
};
