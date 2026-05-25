import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmpresaSidebar    from '@/components/empresa/EmpresaSidebar';
import EmpresaSummary    from '@/components/empresa/EmpresaSummary';
import EmpresaFrotas     from '@/components/empresa/EmpresaFrotas';
import EmpresaVeiculos   from '@/components/empresa/EmpresaVeiculos';
import EmpresaMotoristas from '@/components/empresa/EmpresaMotoristas';
import EmpresaPassageiros from '@/components/empresa/EmpresaPassageiros';
import EmpresaRotas      from '@/components/empresa/EmpresaRotas';
import EmpresaContratos  from '@/components/empresa/EmpresaContratos';
import EmpresaPagamentos from '@/components/empresa/EmpresaPagamentos';

export default function EmpresaDashboard() {
  const navigate  = useNavigate();
  const raw = localStorage.getItem('rotaflow_session');
  const session = raw ? JSON.parse(raw) : null;

  if (!session || session.type !== 'empresa') {
    navigate('/');
    return null;
  }

  const [activeTab, setActiveTab] = useState('resumo');
  const [pendingCount, setPendingCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('rotaflow_session');
    navigate('/');
  };

  return (
    <div className="bg-background min-h-screen">
      <EmpresaSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        session={session}
        pendingCount={pendingCount}
        collapsed={collapsed}
        onToggleCollapse={setCollapsed}
      />

      {/* Content area */}
      <main className={`pb-24 lg:pb-0 transition-all duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <div className="max-w-6xl mx-auto p-6">
          {activeTab === 'resumo'      && <EmpresaSummary    session={session} />}
          {activeTab === 'frotas'      && ['admin', 'sub_admin', 'motorista'].includes(session.role) && <EmpresaFrotas      session={session} />}
          {activeTab === 'veiculos'    && ['admin', 'sub_admin', 'motorista', 'passageiro'].includes(session.role) && <EmpresaVeiculos    session={session} />}
          {activeTab === 'motoristas'  && ['admin', 'sub_admin', 'passageiro'].includes(session.role) && <EmpresaMotoristas  session={session} />}
          {activeTab === 'passageiros' && ['admin', 'sub_admin', 'motorista'].includes(session.role) && <EmpresaPassageiros session={session} />}
          {activeTab === 'rotas'       && <EmpresaRotas       session={session} />}
          {activeTab === 'contratos'   && ['admin', 'sub_admin', 'passageiro'].includes(session.role) && <EmpresaContratos   session={session} />}
          {activeTab === 'pagamentos'  && ['admin', 'sub_admin', 'passageiro'].includes(session.role) && (
            <EmpresaPagamentos
              session={session}
              onPendingChange={setPendingCount}
            />
          )}
        </div>
      </main>
    </div>
  );
}
