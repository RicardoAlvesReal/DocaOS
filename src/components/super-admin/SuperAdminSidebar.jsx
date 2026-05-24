import React, { useState } from 'react';
import { LayoutDashboard, Building2, Users, LogOut, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'resumo',   label: 'Visão Geral', icon: LayoutDashboard },
  { key: 'empresas', label: 'Empresas',    icon: Building2 },
  { key: 'usuarios', label: 'Usuários',    icon: Users },
];

export default function SuperAdminSidebar({ activeTab, setActiveTab, onLogout, session }) {
  const [avatarSrc, setAvatarSrc] = useState(session?.foto_perfil || '');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { file_url } = await uploadRes.json();
      await fetch(`/api/usuarios/${session.id}/foto-perfil`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_perfil: file_url }),
      });
      const raw = localStorage.getItem('rotaflow_session');
      if (raw) {
        const s = JSON.parse(raw);
        s.foto_perfil = file_url;
        localStorage.setItem('rotaflow_session', JSON.stringify(s));
      }
      setAvatarSrc(file_url);
    } catch (err) {
      console.error('Erro ao atualizar foto:', err);
    } finally {
      setAvatarUploading(false);
    }
  };
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-secondary min-h-screen fixed left-0 top-0 z-40">
        {/* Admin info */}
        <div className="px-5 py-4 border-b border-white/6">
          <span className="text-white font-bold text-sm">RotaFlow</span>
          <p className="text-white/30 text-[11px] mt-0.5">Super Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === item.key
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/6 space-y-1">
          <div className="px-3.5 py-2 flex items-center gap-2.5">
            <label className={`relative group shrink-0 w-8 h-8 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center ${avatarUploading ? 'opacity-50' : 'cursor-pointer'}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              {avatarSrc
                ? <img src={avatarSrc} alt={session?.nome} className="w-full h-full object-cover" />
                : <span className="text-white/70 text-xs font-bold">{session?.nome?.[0]?.toUpperCase()}</span>
              }
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </label>
            <div className="min-w-0">
              <p className="text-white/60 text-xs font-medium truncate">{session?.nome}</p>
              <p className="text-white/25 text-[11px]">super_admin</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair do sistema
          </button>
          {/* RotaFlow branding */}
          <div className="flex items-center justify-center gap-1.5 pt-2 pb-1 opacity-60">
            <img src="/logo-icon.png" alt="RotaFlow" className="w-5 h-5 object-contain" />
            <span className="text-white text-[11px] font-medium">RotaFlow</span>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-white/6 px-1 py-2 flex justify-around">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all',
              activeTab === item.key ? 'text-primary' : 'text-white/40'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium text-white/40"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </nav>
    </>
  );
}
