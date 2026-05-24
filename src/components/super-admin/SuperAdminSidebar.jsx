import React from 'react';
import { Bus, LayoutDashboard, Building2, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'resumo',   label: 'Visão Geral', icon: LayoutDashboard },
  { key: 'empresas', label: 'Empresas',    icon: Building2 },
  { key: 'usuarios', label: 'Usuários',    icon: Users },
];

export default function SuperAdminSidebar({ activeTab, setActiveTab, onLogout, session }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-secondary min-h-screen fixed left-0 top-0 z-40">
        <div className="p-5 border-b border-white/6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">RotaFlow</span>
              <p className="text-white/30 text-[11px] mt-0.5">Super Admin</p>
            </div>
          </div>
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
          <div className="px-3.5 py-2">
            <p className="text-white/60 text-xs font-medium truncate">{session?.nome}</p>
            <p className="text-white/25 text-[11px]">super_admin</p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair do sistema
          </button>
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
