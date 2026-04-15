import React from 'react';
import { Bus } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-white/5 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Bus className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold">VanEscolar<span className="text-primary">+</span></span>
          </div>
          <p className="text-white/30 text-sm">© 2026 VanEscolar+. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}