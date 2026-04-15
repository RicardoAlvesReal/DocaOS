import React from 'react';
import { Bus, User, CreditCard } from 'lucide-react';

export default function StudentWelcome({ student }) {
  return (
    <div className="bg-secondary rounded-2xl p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-primary/5 rounded-full translate-y-1/2" />
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/30">
          <Bus className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-white/40 text-sm">Bem-vindo(a) de volta 👋</p>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">{student.nome}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="flex items-center gap-1.5 bg-white/8 text-white/70 text-xs px-3 py-1.5 rounded-full font-mono">
              <User className="w-3.5 h-3.5" /> {student.matricula}
            </span>
            <span className="flex items-center gap-1.5 bg-primary/20 text-primary text-xs px-3 py-1.5 rounded-full font-semibold">
              <CreditCard className="w-3.5 h-3.5" /> R$ {student.mensalidade.toFixed(2).replace('.', ',')}/mês
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}