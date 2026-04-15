const ADMIN_USER = {
  type: 'admin',
  matricula: 'ADMIN2025',
  senha: 'Escola@Master99',
  nome: 'Administrador',
};

const DEFAULT_STUDENTS = [
  {
    nome: 'Carlos Eduardo Silva',
    responsavel: 'Maria Silva',
    matricula: 'ALU0001',
    senha: '123456',
    mensalidade: 250,
    meses: {
      janeiro: 'pendente', fevereiro: 'pendente',
      marco: 'pago', abril: 'pago', maio: 'pago',
      junho: 'pendente', julho: 'pendente', agosto: 'pendente',
      setembro: 'pendente', outubro: 'pendente', novembro: 'pendente', dezembro: 'pendente',
    },
  },
  {
    nome: 'Ana Beatriz Santos',
    responsavel: 'João Santos',
    matricula: 'ALU0002',
    senha: '654321',
    mensalidade: 280,
    meses: {
      janeiro: 'pendente', fevereiro: 'pendente',
      marco: 'pago', abril: 'pago',
      maio: 'pendente', junho: 'pendente', julho: 'pendente', agosto: 'pendente',
      setembro: 'pendente', outubro: 'pendente', novembro: 'pendente', dezembro: 'pendente',
    },
  },
  {
    nome: 'Pedro Henrique Costa',
    responsavel: 'Fernanda Costa',
    matricula: 'ALU0003',
    senha: '111222',
    mensalidade: 300,
    meses: {
      janeiro: 'pendente', fevereiro: 'pendente',
      marco: 'pago', abril: 'pago', maio: 'pago', junho: 'pago',
      julho: 'pendente', agosto: 'pendente',
      setembro: 'pendente', outubro: 'pendente', novembro: 'pendente', dezembro: 'pendente',
    },
  },
];

const MONTHS_MAP = {
  janeiro: 'Janeiro', fevereiro: 'Fevereiro',
  marco: 'Março', abril: 'Abril', maio: 'Maio', junho: 'Junho',
  julho: 'Julho', agosto: 'Agosto', setembro: 'Setembro',
  outubro: 'Outubro', novembro: 'Novembro', dezembro: 'Dezembro',
};

const MONTH_KEYS = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function initData() {
  const schemaVersion = '3';
  if (localStorage.getItem('vanescolar_schema') !== schemaVersion) {
    localStorage.removeItem('vanescolar_students');
    localStorage.removeItem('vanescolar_comprovantes');
    localStorage.removeItem('vanescolar_next_id');
    localStorage.setItem('vanescolar_schema', schemaVersion);
  }
  if (!localStorage.getItem('vanescolar_students')) {
    localStorage.setItem('vanescolar_students', JSON.stringify(DEFAULT_STUDENTS));
  }
  if (!localStorage.getItem('vanescolar_comprovantes')) {
    localStorage.setItem('vanescolar_comprovantes', JSON.stringify([]));
  }
  if (!localStorage.getItem('vanescolar_next_id')) {
    localStorage.setItem('vanescolar_next_id', '4');
  }
}

function getStudents() {
  initData();
  return JSON.parse(localStorage.getItem('vanescolar_students') || '[]');
}

function saveStudents(students) {
  localStorage.setItem('vanescolar_students', JSON.stringify(students));
}

function getComprovantes() {
  initData();
  return JSON.parse(localStorage.getItem('vanescolar_comprovantes') || '[]');
}

function saveComprovantes(comprovantes) {
  localStorage.setItem('vanescolar_comprovantes', JSON.stringify(comprovantes));
}

function getNextId() {
  initData();
  return parseInt(localStorage.getItem('vanescolar_next_id') || '4');
}

function incrementId() {
  const id = getNextId();
  localStorage.setItem('vanescolar_next_id', String(id + 1));
  return id;
}

function login(matricula, senha) {
  if (matricula === ADMIN_USER.matricula && senha === ADMIN_USER.senha) {
    const session = { type: 'admin', matricula: ADMIN_USER.matricula, nome: ADMIN_USER.nome };
    localStorage.setItem('vanescolar_session', JSON.stringify(session));
    return session;
  }
  const students = getStudents();
  const student = students.find(s => s.matricula === matricula && s.senha === senha);
  if (student) {
    const session = { type: 'aluno', matricula: student.matricula, nome: student.nome };
    localStorage.setItem('vanescolar_session', JSON.stringify(session));
    return session;
  }
  return null;
}

function getSession() {
  const data = localStorage.getItem('vanescolar_session');
  return data ? JSON.parse(data) : null;
}

function logout() {
  localStorage.removeItem('vanescolar_session');
}

// Agora aceita matrícula e senha definidos pelo admin
function addStudent(nome, responsavel, mensalidade, matriculaCustom, senhaCustom) {
  const students = getStudents();

  // Se matrícula custom não foi fornecida, gera automaticamente
  let matricula = matriculaCustom ? matriculaCustom.trim().toUpperCase() : null;
  if (!matricula) {
    const id = incrementId();
    matricula = 'ALU' + String(id).padStart(4, '0');
  } else {
    // Verificar duplicata
    if (students.find(s => s.matricula === matricula)) {
      return { error: 'Matrícula já existe.' };
    }
  }

  const senha = senhaCustom ? senhaCustom.trim() : String(Math.floor(100000 + Math.random() * 900000));

  const newStudent = {
    nome, responsavel, matricula, senha,
    mensalidade: parseFloat(mensalidade),
    meses: {
      janeiro: 'pago', fevereiro: 'pago',
      marco: 'pago', abril: 'pendente', maio: 'pendente', junho: 'pendente',
      julho: 'pendente', agosto: 'pendente', setembro: 'pendente',
      outubro: 'pendente', novembro: 'pendente', dezembro: 'pendente',
    },
  };
  students.push(newStudent);
  saveStudents(students);
  return newStudent;
}

function addComprovante(matricula, mesKey, fileBase64, fileName) {
  const comprovantes = getComprovantes();
  comprovantes.push({
    id: Date.now().toString(),
    matricula,
    mesKey,
    fileBase64,
    fileName,
    dataEnvio: new Date().toISOString(),
    status: 'aguardando',
  });
  saveComprovantes(comprovantes);

  const students = getStudents();
  const idx = students.findIndex(s => s.matricula === matricula);
  if (idx !== -1) {
    students[idx].meses[mesKey] = 'aguardando';
    saveStudents(students);
  }
}

function confirmarComprovante(comprovanteId) {
  const comprovantes = getComprovantes();
  const idx = comprovantes.findIndex(c => c.id === comprovanteId);
  if (idx === -1) return;
  const comp = comprovantes[idx];

  const students = getStudents();
  const sIdx = students.findIndex(s => s.matricula === comp.matricula);
  if (sIdx !== -1) {
    students[sIdx].meses[comp.mesKey] = 'pago';
    saveStudents(students);
  }

  comprovantes.splice(idx, 1);
  saveComprovantes(comprovantes);
}

function rejeitarComprovante(comprovanteId) {
  const comprovantes = getComprovantes();
  const idx = comprovantes.findIndex(c => c.id === comprovanteId);
  if (idx === -1) return;
  const comp = comprovantes[idx];

  const students = getStudents();
  const sIdx = students.findIndex(s => s.matricula === comp.matricula);
  if (sIdx !== -1) {
    students[sIdx].meses[comp.mesKey] = 'rejeitado';
    saveStudents(students);
  }

  comprovantes.splice(idx, 1);
  saveComprovantes(comprovantes);
}

function getStudentByMatricula(matricula) {
  const students = getStudents();
  return students.find(s => s.matricula === matricula) || null;
}

function removeStudent(matricula) {
  const students = getStudents().filter(s => s.matricula !== matricula);
  saveStudents(students);
  // Remove comprovantes desse aluno também
  const comprovantes = getComprovantes().filter(c => c.matricula !== matricula);
  saveComprovantes(comprovantes);
}

export {
  MONTHS_MAP, MONTH_KEYS,
  initData, getStudents, saveStudents, getComprovantes, saveComprovantes,
  login, getSession, logout,
  addStudent, addComprovante, confirmarComprovante, rejeitarComprovante,
  getStudentByMatricula, removeStudent,
};