import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout, getStudentByMatricula } from '@/lib/authStore';
import { Bus, LogOut, User, CreditCard, Upload, Info, Loader2 } from 'lucide-react';
import StudentMonthlyGrid from '@/components/student/StudentMonthlyGrid';
import StudentUpload from '@/components/student/StudentUpload';
import StudentPixInfo from '@/components/student/StudentPixInfo';

const TABS = [
  { key: 'pagamentos', label: 'Meus Pagamentos', icon: CreditCard },
  { key: 'pix', label: 'Como Pagar', icon: Info },
  { key: 'enviar', label: 'Enviar Comprovante', icon: Upload },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('pagamentos');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const session = getSession();
    if (!session || session.type !== 'aluno') {
      navigate('/');
      return;
    }

    let cancelled = false;
    setLoading(true);

    getStudentByMatricula(session.matricula, refreshKey > 0)
      .then(s => {
        if (cancelled) return;
        if (!s) { navigate('/'); return; }
        setStudent(s);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0c12' }}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const pagoCount = Object.values(student.meses || {}).filter(v => v === 'pago').length;
  const pendCount = Object.values(student.meses || {}).filter(v => v === 'pendente' || v === 'rejeitado').length;

  return (
    <div className="min-h-screen" style={{ background: '#0a0c12' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-md" style={{ background: 'rgba(10,12,18,0.95)' }}>
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-white">VanEscolar<span className="text-blue-500">+</span></span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-6">
        {/* Welcome card */}
        <div
          className="rounded-2xl p-6 border border-white/8 relative overflow-hidden"
          style={{ background: '#161b27' }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                <User className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-white/40 mb-0.5">Bem-vindo(a),</p>
                <p className="text-xl font-black text-white">{student.nome}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md text-blue-400" style={{ background: '#1e2d4a' }}>
                    {student.matricula}
                  </span>
                  <span className="text-xs text-white/40">
                    Mensalidade:{' '}
                    <span className="text-white font-semibold">
                      {(student.mensalidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="text-center px-4 py-2 rounded-xl border border-emerald-600/20" style={{ background: '#0d2318' }}>
                <p className="text-xl font-black text-emerald-400">{pagoCount}</p>
                <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Pagos</p>
              </div>
              <div className="text-center px-4 py-2 rounded-xl border border-rose-600/20" style={{ background: '#2a0d0d' }}>
                <p className="text-xl font-black text-rose-400">{pendCount}</p>
                <p className="text-[10px] text-rose-600 uppercase tracking-wide">Pendentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#161b27' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab.key ? '#3b82f6' : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#8b92a5',
              }}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: '#161b27' }}>
          <div className="p-6">
            {activeTab === 'pagamentos' && <StudentMonthlyGrid student={student} />}
            {activeTab === 'pix' && <StudentPixInfo student={student} />}
            {activeTab === 'enviar' && <StudentUpload student={student} onUpdate={() => setRefreshKey(k => k + 1)} />}
          </div>
        </div>
      </main>
    </div>
  );
}