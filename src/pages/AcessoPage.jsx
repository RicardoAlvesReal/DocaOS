import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bus, Eye, EyeOff, ArrowLeft, AlertCircle, Loader2, User, Lock } from 'lucide-react';
import { login, getSession } from '@/lib/authStore';
import { base44 } from '@/api/base44Client';

const CPF_KEY = 'vanescolar_cpf';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias

function formatCPF(val) {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export default function AcessoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRegister = searchParams.get('cadastro') !== null;

  const [mode, setMode] = useState(isRegister ? 'register' : 'login');

  // login state
  const [cpfLogin, setCpfLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [showPassLogin, setShowPassLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // register state
  const [cpfReg, setCpfReg] = useState('');
  const [nomeReg, setNomeReg] = useState('');
  const [codigoReg, setCodigoReg] = useState('');
  const [senhaReg, setSenhaReg] = useState('');
  const [confirmSenhaReg, setConfirmSenhaReg] = useState('');
  const [showPassReg, setShowPassReg] = useState(false);
  const [errorReg, setErrorReg] = useState('');
  const [loadingReg, setLoadingReg] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate(session.type === 'admin' ? '/admin' : '/aluno');
      return;
    }
    // Pré-preencher CPF salvo
    const saved = localStorage.getItem(CPF_KEY);
    if (saved) setCpfLogin(saved);
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    setLoadingLogin(true);

    // Usa matrícula como campo de login (campo cpfLogin na verdade serve como matrícula aqui)
    const session = await login(cpfLogin.trim(), senhaLogin.trim());
    setLoadingLogin(false);

    if (!session) {
      setErrorLogin('Matrícula ou senha incorreta.');
      return;
    }

    // Salva CPF/matrícula para pré-preencher na próxima vez
    localStorage.setItem(CPF_KEY, cpfLogin.trim());

    navigate(session.type === 'admin' ? '/admin' : '/aluno');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorReg('');

    if (senhaReg.length < 4) {
      setErrorReg('A senha deve ter pelo menos 4 dígitos.');
      return;
    }
    if (senhaReg !== confirmSenhaReg) {
      setErrorReg('As senhas não coincidem.');
      return;
    }
    if (!codigoReg.trim()) {
      setErrorReg('Informe o código do aluno.');
      return;
    }

    setLoadingReg(true);

    // Busca aluno pelo código (matrícula) fornecido pela empresa
    const alunos = await base44.entities.Aluno.filter({ matricula: codigoReg.trim().toUpperCase() });
    if (alunos.length === 0) {
      setErrorReg('Código do aluno não encontrado. Verifique com a empresa de transporte.');
      setLoadingReg(false);
      return;
    }

    const aluno = alunos[0];

    // Salva CPF do responsável e senha nova, marca primeiro_acesso = false
    await base44.entities.Aluno.update(aluno.id, {
      responsavel: nomeReg.trim() || aluno.responsavel,
      senha: senhaReg.trim(),
      primeiro_acesso: false,
    });

    // Salva matrícula no localStorage para pré-preencher
    localStorage.setItem(CPF_KEY, codigoReg.trim().toUpperCase());

    // Faz login direto
    const session = await login(codigoReg.trim().toUpperCase(), senhaReg.trim());
    setLoadingReg(false);

    if (session) {
      navigate('/aluno');
    } else {
      setErrorReg('Erro ao acessar após cadastro. Tente fazer login manualmente.');
      setMode('login');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: 'linear-gradient(160deg, #0d1b3e 0%, #0a1628 50%, #060d1f 100%)' }}
    >
      {/* Voltar */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-5 left-5 flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o início
      </button>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <Bus className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          VanEscolar<span style={{ color: '#3b82f6' }}>+</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">
          {mode === 'login' ? 'Acesso exclusivo aos responsáveis' : 'Crie seu acesso'}
        </p>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-3xl p-7 shadow-2xl"
        style={{ background: '#ffffff', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {mode === 'login' ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Entrar na sua conta</h2>
            <p className="text-gray-400 text-sm mb-6">Use sua matrícula e senha cadastrada</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Matrícula</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: ALU0001"
                    value={cpfLogin}
                    onChange={e => setCpfLogin(e.target.value)}
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha / PIN</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassLogin ? 'text' : 'password'}
                    placeholder="Sua senha"
                    value={senhaLogin}
                    onChange={e => setSenhaLogin(e.target.value)}
                    required
                    className="w-full h-12 pl-10 pr-11 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassLogin(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassLogin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {errorLogin && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorLogin}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingLogin}
                className="w-full h-12 rounded-xl font-bold text-white text-sm transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] disabled:opacity-60"
                style={{ background: loadingLogin ? '#6b9fff' : '#3b82f6' }}
              >
                {loadingLogin ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                  </span>
                ) : 'Acessar Minha Área'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-xs">Primeiro acesso?</p>
              <button
                onClick={() => { setMode('register'); setErrorReg(''); }}
                className="mt-1 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
              >
                Criar meu acesso
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Cadastro Inicial</h2>
            <p className="text-gray-400 text-sm mb-6">Preencha seus dados para criar o acesso</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF do responsável</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpfReg}
                  onChange={e => setCpfReg(formatCPF(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo</label>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={nomeReg}
                  onChange={e => setNomeReg(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Código do aluno</label>
                <input
                  type="text"
                  placeholder="Fornecido pela empresa (ex: ALU0001)"
                  value={codigoReg}
                  onChange={e => setCodigoReg(e.target.value.toUpperCase())}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Criar senha / PIN (mín. 4 dígitos)</label>
                <div className="relative">
                  <input
                    type={showPassReg ? 'text' : 'password'}
                    placeholder="Mínimo 4 caracteres"
                    value={senhaReg}
                    onChange={e => setSenhaReg(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-11 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassReg(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassReg ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirmar senha / PIN</label>
                <input
                  type={showPassReg ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={confirmSenhaReg}
                  onChange={e => setConfirmSenhaReg(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {errorReg && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorReg}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingReg}
                className="w-full h-12 rounded-xl font-bold text-white text-sm transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-[0.98] disabled:opacity-60"
                style={{ background: loadingReg ? '#6b9fff' : '#3b82f6' }}
              >
                {loadingReg ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Criando acesso...
                  </span>
                ) : 'Criar meu acesso'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-100 text-center">
              <button
                onClick={() => { setMode('login'); setErrorLogin(''); }}
                className="text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors"
              >
                ← Já tenho acesso
              </button>
            </div>
          </>
        )}
      </div>

      <p className="text-white/20 text-xs mt-8 text-center">
        Use as credenciais fornecidas pela empresa de transporte
      </p>
    </div>
  );
}