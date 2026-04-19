import { base44 } from '@/api/base44Client';

const ADMIN_USER = {
  type: 'admin',
  matricula: 'ADMINwerley81',
  senha: 'pd200326',
  nome: 'Administrador',
};

export const MONTHS_MAP = {
  janeiro: 'Janeiro', fevereiro: 'Fevereiro',
  marco: 'Março', abril: 'Abril', maio: 'Maio', junho: 'Junho',
  julho: 'Julho', agosto: 'Agosto', setembro: 'Setembro',
  outubro: 'Outubro', novembro: 'Novembro', dezembro: 'Dezembro',
};

export const MONTH_KEYS = [
  'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const DEFAULT_MESES = () => ({
  janeiro: 'pendente', fevereiro: 'pendente', marco: 'pendente',
  abril: 'pendente', maio: 'pendente', junho: 'pendente',
  julho: 'pendente', agosto: 'pendente', setembro: 'pendente',
  outubro: 'pendente', novembro: 'pendente', dezembro: 'pendente',
});

// ── Session (ainda usa localStorage, mas só guarda sessão local) ──
export function getSession() {
  const data = localStorage.getItem('vanescolar_session');
  return data ? JSON.parse(data) : null;
}

export function logout() {
  localStorage.removeItem('vanescolar_session');
}

// ── Auth ──
export async function login(matricula, senha) {
  if (matricula === ADMIN_USER.matricula && senha === ADMIN_USER.senha) {
    const session = { type: 'admin', matricula: ADMIN_USER.matricula, nome: ADMIN_USER.nome };
    localStorage.setItem('vanescolar_session', JSON.stringify(session));
    return session;
  }
  // Busca no banco
  const alunos = await base44.entities.Aluno.filter({ matricula: matricula.trim().toUpperCase() });
  const aluno = alunos.find(a => a.senha === senha.trim());
  if (aluno) {
    // Pre-populate cache so StudentDashboard doesn't need to fetch again
    studentCache.set(aluno.matricula, aluno);
    const session = { type: 'aluno', matricula: aluno.matricula, nome: aluno.nome };
    localStorage.setItem('vanescolar_session', JSON.stringify(session));
    return session;
  }
  return null;
}

// ── Alunos ──
export async function getStudents() {
  return await base44.entities.Aluno.list('-created_date', 200);
}

// In-memory cache and in-flight promise deduplication
const studentCache = new Map();
const studentInflight = new Map();

export async function getStudentByMatricula(matricula, bustCache = false) {
  if (!bustCache && studentCache.has(matricula)) {
    return studentCache.get(matricula);
  }

  // If there's already a request in-flight for this matricula, reuse it
  if (studentInflight.has(matricula)) {
    return studentInflight.get(matricula);
  }

  const promise = base44.entities.Aluno.filter({ matricula })
    .then(alunos => {
      const aluno = alunos[0] || null;
      if (aluno) studentCache.set(matricula, aluno);
      studentInflight.delete(matricula);
      return aluno;
    })
    .catch(err => {
      studentInflight.delete(matricula);
      throw err;
    });

  studentInflight.set(matricula, promise);
  return promise;
}

export function invalidateStudentCache(matricula) {
  if (matricula) {
    studentCache.delete(matricula);
    studentInflight.delete(matricula);
  } else {
    studentCache.clear();
    studentInflight.clear();
  }
}

export async function addStudent(nome, responsavel, mensalidade, matriculaCustom, senhaCustom) {
  const students = await getStudents();
  
  let matricula = matriculaCustom ? matriculaCustom.trim().toUpperCase() : null;
  if (!matricula) {
    // Gera próxima matrícula automaticamente
    const nums = students
      .map(s => parseInt(s.matricula.replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    matricula = 'ALU' + String(nextNum).padStart(4, '0');
  } else {
    if (students.find(s => s.matricula === matricula)) {
      return { error: 'Matrícula já existe.' };
    }
  }

  const senha = (senhaCustom && senhaCustom.trim()) 
    ? senhaCustom.trim() 
    : String(Math.floor(100000 + Math.random() * 900000));

  const newStudent = await base44.entities.Aluno.create({
    nome: nome.trim(),
    responsavel: responsavel.trim(),
    matricula,
    senha,
    mensalidade: parseFloat(mensalidade),
    meses: DEFAULT_MESES(),
  });

  return newStudent;
}

export async function removeStudent(matriculaOrId) {
  // Tenta encontrar pelo campo matricula
  const students = await base44.entities.Aluno.filter({ matricula: matriculaOrId });
  if (students.length > 0) {
    await base44.entities.Aluno.delete(students[0].id);
  }
  // Remove comprovantes
  const comps = await base44.entities.Comprovante.filter({ matricula: matriculaOrId });
  for (const c of comps) {
    await base44.entities.Comprovante.delete(c.id);
  }
}

// ── Comprovantes ──
export async function getComprovantes() {
  return await base44.entities.Comprovante.list('-created_date', 200);
}

export async function addComprovante(matricula, mesKey, fileUrl, fileName) {
  await base44.entities.Comprovante.create({
    matricula,
    mesKey,
    fileUrl,
    fileName,
    status: 'aguardando',
  });

  // Atualiza o status do mês no aluno
  const alunos = await base44.entities.Aluno.filter({ matricula });
  if (alunos.length > 0) {
    const aluno = alunos[0];
    const meses = { ...aluno.meses, [mesKey]: 'aguardando' };
    await base44.entities.Aluno.update(aluno.id, { meses });
    invalidateStudentCache(matricula);
  }
}

export async function confirmarComprovante(comprovanteId) {
  const comp = (await base44.entities.Comprovante.filter({ id: comprovanteId }))[0];
  if (!comp) return;

  const alunos = await base44.entities.Aluno.filter({ matricula: comp.matricula });
  if (alunos.length > 0) {
    const aluno = alunos[0];
    const meses = { ...aluno.meses, [comp.mesKey]: 'pago' };
    await base44.entities.Aluno.update(aluno.id, { meses });
  }

  await base44.entities.Comprovante.delete(comp.id);
}

export async function rejeitarComprovante(comprovanteId) {
  const comps = await base44.entities.Comprovante.list();
  const comp = comps.find(c => c.id === comprovanteId);
  if (!comp) return;

  const alunos = await base44.entities.Aluno.filter({ matricula: comp.matricula });
  if (alunos.length > 0) {
    const aluno = alunos[0];
    const meses = { ...aluno.meses, [comp.mesKey]: 'rejeitado' };
    await base44.entities.Aluno.update(aluno.id, { meses });
  }

  await base44.entities.Comprovante.delete(comp.id);
}

export async function updateStudentMes(matricula, mesKey, status) {
  const alunos = await base44.entities.Aluno.filter({ matricula });
  if (alunos.length > 0) {
    const aluno = alunos[0];
    const meses = { ...aluno.meses, [mesKey]: status };
    await base44.entities.Aluno.update(aluno.id, { meses });
  }
}

// Legacy: manter compatibilidade
export function initData() {}
export function saveStudents() {}
export function saveComprovantes() {}