import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Navbar({ onOpenLogin }) {
  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img src="/logo-full.png" alt="RotaFlow" className="h-[150px] w-auto" />
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
          <a href="#servicos" className="hover:text-blue-600 transition-colors">Serviços</a>
          <a href="#planos" className="hover:text-blue-600 transition-colors">Planos</a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenLogin}
            className="hidden sm:block text-slate-600 hover:text-slate-900 font-medium transition-colors text-sm"
          >
            Login
          </button>
          <button
            onClick={onOpenLogin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 group text-sm"
          >
            Acessar Sistema
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </nav>
  );
}