import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout } from '@/lib/authStore';
import SuperAdminSidebar from '@/components/super-admin/SuperAdminSidebar';
import SuperAdminSummary from '@/components/super-admin/SuperAdminSummary';
import SuperAdminEmpresas from '@/components/super-admin/SuperAdminEmpresas';
import SuperAdminUsuarios from '@/components/super-admin/SuperAdminUsuarios';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function SuperAdminDashboard() {
  const navigate   = useNavigate();
  const [activeTab, setActiveTab] = useState('resumo');
  const session    = getSession();

  useEffect(() => {
    if (!session || session.type !== 'super_admin') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <SuperAdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        session={session}
      />
      <main className="lg:ml-64 p-5 lg:p-8 pb-28 lg:pb-8">
        <ErrorBoundary>
          {activeTab === 'resumo'   && <SuperAdminSummary />}
          {activeTab === 'empresas' && <SuperAdminEmpresas />}
          {activeTab === 'usuarios' && <SuperAdminUsuarios />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
