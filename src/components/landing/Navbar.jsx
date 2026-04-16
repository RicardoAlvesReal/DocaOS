import React from 'react';
import { Button } from '@/components/ui/button';
import { Bus } from 'lucide-react';

export default function Navbar({ onOpenLogin }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-white/5" style={{ background: 'rgba(10,12,18,0.92)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              VanEscolar<span className="text-blue-500">+</span>
            </span>
          </div>
          <Button
            onClick={onOpenLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/25 px-5 h-9 text-sm"
          >
            Área de Acesso
          </Button>
        </div>
      </div>
    </nav>
  );
}