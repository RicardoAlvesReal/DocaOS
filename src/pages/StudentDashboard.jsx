import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, logout, getStudentByMatricula } from '@/lib/authStore';
import { Button } from '@/components/ui/button';
import { Bus, LogOut } from 'lucide-react';
import StudentWelcome from '@/components/student/StudentWelcome';
import StudentMonthlyGrid from '@/components/student/StudentMonthlyGrid';
import StudentUpload from '@/components/student/StudentUpload';
import StudentPixInfo from '@/components/student/StudentPixInfo';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const session = getSession();

  useEffect(() => {
    if (!session || session.type !== 'aluno') {
      navigate('/');
    }
  }, [session, navigate]);

  if (!session || session.type !== 'aluno') return null;

  const student = getStudentByMatricula(session.matricula);
  if (!student) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background" key={refreshKey}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-secondary text-white border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bus className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sm">VanEscolar<span className="text-primary">+</span></span>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8 pb-20">
        <StudentWelcome student={student} />
        <StudentMonthlyGrid student={student} />
        <StudentUpload student={student} onUpdate={() => setRefreshKey(k => k + 1)} />
        <StudentPixInfo student={student} />
      </main>
    </div>
  );
}