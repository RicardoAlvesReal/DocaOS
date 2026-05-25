import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Building2, Users, LogOut, Camera, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'resumo',   label: 'Visão Geral', icon: LayoutDashboard },
  { key: 'empresas', label: 'Empresas',    icon: Building2 },
  { key: 'usuarios', label: 'Usuários',    icon: Users },
];

export default function SuperAdminSidebar({ activeTab, setActiveTab, onLogout, session, collapsed, onToggleCollapse }) {
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
      <motion.aside
        animate={{ width: collapsed ? 80 : 256 }}
        className="hidden lg:flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 min-h-screen fixed left-0 top-0 z-40 border-r border-white/[0.04]"
      >
        {/* Toggle */}
        <button
          onClick={() => onToggleCollapse(!collapsed)}
          className="absolute -right-3 top-5 z-50 w-6 h-6 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all shadow-lg"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex-1 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="relative px-5 py-5 flex items-center gap-3 min-h-[68px]">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/25">
            <span className="text-white font-bold text-xs">RF</span>
          </div>
          {!collapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="min-w-0"
            >
              <span className="text-white font-semibold text-sm">RotaFlow</span>
              <p className="text-white/35 text-[11px] mt-0.5 font-medium">Super Admin</p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => {
            const isActive = activeTab === item.key;
            const Icon = item.icon;
            return (
              <motion.button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                whileHover={!collapsed ? { x: 2 } : {}}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : ''
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-active-super"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 via-primary/15 to-transparent border border-primary/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full transition-all duration-200',
                  isActive ? 'bg-primary scale-100' : 'scale-0'
                )} />
                <Icon className={cn(
                  'w-4 h-4 shrink-0 relative z-10 transition-all duration-200',
                  isActive ? 'text-primary scale-110' : 'text-white/40'
                )} />
                {!collapsed && (
                  <span className={cn(
                    'relative z-10 truncate',
                    isActive ? 'text-white font-semibold' : 'text-white/50'
                  )}>
                    {item.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative p-3 space-y-1">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
          <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''} px-1 py-1.5`}>
            <label className={`relative group shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white/[0.04] flex items-center justify-center ring-1 ring-white/[0.06] ${avatarUploading ? 'opacity-50' : 'cursor-pointer'}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              {avatarSrc
                ? <img src={avatarSrc} alt={session?.nome} className="w-full h-full object-cover" />
                : <span className="text-white/60 text-xs font-bold">{session?.nome?.[0]?.toUpperCase()}</span>
              }
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </label>
            {!collapsed && (
              <motion.div
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-w-0"
              >
                <p className="text-white/70 text-xs font-medium truncate">{session?.nome}</p>
                <p className="text-white/30 text-[11px]">super_admin</p>
              </motion.div>
            )}
          </div>
          <motion.button
            onClick={onLogout}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-0' : '',
              'text-white/40 hover:text-red-400 hover:bg-red-500/10'
            )}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sair do sistema'}
          </motion.button>
          {!collapsed && (
            <div className="flex items-center justify-center gap-1.5 pt-2 pb-0.5 opacity-40">
              <span className="text-white/30 text-[10px] font-medium tracking-wider uppercase">RotaFlow</span>
            </div>
          )}
        </div>
        </div>
      </motion.aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-900 to-slate-900/95 border-t border-white/[0.06] flex justify-around px-1 py-2 backdrop-blur-xl">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all',
              activeTab === item.key ? 'text-primary' : 'text-white/40'
            )}
          >
            <item.icon className={cn('w-5 h-5 transition-all', activeTab === item.key && 'scale-110')} />
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
