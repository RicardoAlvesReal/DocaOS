import React from 'react';
import { Bus, LayoutDashboard, UserPlus, Users, FileSearch, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { key: 'resumo', label: 'Resumo Geral', icon: LayoutDashboard },
  { key: 'cadastro', label: 'Novo Aluno', icon: UserPlus },
  { key: 'lista', label: 'Lista de Alunos', icon: Users },
  { key: 'comprovantes', label: 'Comprovantes', icon: FileSearch },
];

export default function AdminSidebar({ activeTab, setActiveTab, onLogout, pendingCount }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-secondary min-h-screen fixed left-0 top-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">VanEscolar<span className="text-primary">+</span></span>
              <p className="text-white/40 text-xs">Painel Administrativo</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                activeTab === item.key
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
              {item.key === 'comprovantes' && pendingCount > 0 && (
                <span className="ml-auto bg-warning text-warning-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/5"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-white/10 px-2 py-2 flex justify-around">
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setActiveTab(item.key)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all relative',
              activeTab === item.key ? 'text-primary' : 'text-white/50'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="truncate max-w-[60px]">{item.label.split(' ')[0]}</span>
            {item.key === 'comprovantes' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-warning text-warning-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-white/50"
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </button>
      </nav>
    </>
  );
}