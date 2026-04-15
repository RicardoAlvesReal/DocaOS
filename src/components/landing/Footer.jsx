import React from 'react';
import { Bus } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary text-white/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Bus className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-white font-bold">VanEscolar<span className="text-primary">+</span></span>
          </div>
          <p className="text-sm">© 2026 VanEscolar+. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}