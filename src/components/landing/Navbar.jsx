import React from 'react';
import { Button } from '@/components/ui/button';
import { Bus } from 'lucide-react';

export default function Navbar({ onOpenLogin }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-secondary/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              VanEscolar<span className="text-primary">+</span>
            </span>
          </div>
          <Button
            onClick={onOpenLogin}
            className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 px-5"
          >
            Área de Acesso
          </Button>
        </div>
      </div>
    </nav>
  );
}