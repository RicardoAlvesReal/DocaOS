import React from 'react';
import { Card } from '@/components/ui/card';
import { Bus, User, CreditCard } from 'lucide-react';

export default function StudentWelcome({ student }) {
  return (
    <Card className="bg-gradient-to-br from-secondary to-secondary/90 text-white p-6 sm:p-8 rounded-2xl border-0">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center flex-shrink-0">
          <Bus className="w-7 h-7 text-primary-foreground" />
        </div>
        <div>
          <p className="text-white/60 text-sm">Bem-vindo(a) de volta 👋</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">{student.nome}</h1>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono">{student.matricula}</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/20 rounded-lg px-3 py-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold">R$ {student.mensalidade.toFixed(2).replace('.', ',')}/mês</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}