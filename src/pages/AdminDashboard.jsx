import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout, getComprovantes } from '@/lib/authStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSummary from '@/components/admin/AdminSummary';
import AdminRegisterStudent from '@/components/admin/AdminRegisterStudent';
import AdminStudentList from '@/components/admin/AdminStudentList';
import AdminComprovantes from '@/components/admin/AdminComprovantes';
import AdminPaymentsStatus from '@/components/admin/AdminPaymentsStatus';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resumo');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const session = getSession();
    if (!session || session.type !== 'admin') {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    getComprovantes().then(comps => {
      setPendingCount(comps.filter(c => c.status === 'aguardando').length);
    });
  }, [refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        pendingCount={pendingCount}
      />
      <main className="lg:ml-64 p-5 lg:p-8 pb-28 lg:pb-8" key={refreshKey}>
        {activeTab === 'resumo'       && <AdminSummary />}
        {activeTab === 'cadastro'     && <AdminRegisterStudent onStudentAdded={refresh} />}
        {activeTab === 'lista'        && <AdminStudentList />}
        {activeTab === 'pagamentos'   && <AdminPaymentsStatus />}
        {activeTab === 'comprovantes' && <AdminComprovantes onUpdate={refresh} />}
      </main>
    </div>
  );
}