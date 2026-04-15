import React from 'react';
import { Users, CheckCircle, AlertTriangle, FileSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getStudents, getComprovantes, MONTH_KEYS } from '@/lib/authStore';

export default function AdminSummary() {
  const students = getStudents();
  const comprovantes = getComprovantes();
  const pendingComprovantes = comprovantes.filter(c => c.status === 'aguardando');

  const now = new Date();
  const currentMonthIndex = now.getMonth() - 2; // March=0
  const currentMonthKey = currentMonthIndex >= 0 && currentMonthIndex < MONTH_KEYS.length
    ? MONTH_KEYS[currentMonthIndex] : null;

  let pagosNoMes = 0;
  let inadimplentes = 0;
  if (currentMonthKey) {
    students.forEach(s => {
      if (s.meses[currentMonthKey] === 'pago') pagosNoMes++;
      else inadimplentes++;
    });
  }

  const stats = [
    { label: 'Total de Alunos', value: students.length, icon: Users, color: 'bg-secondary text-secondary-foreground' },
    { label: 'Pagamentos Confirmados', value: pagosNoMes, icon: CheckCircle, color: 'bg-success/10 text-success' },
    { label: 'Inadimplentes', value: inadimplentes, icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
    { label: 'Comprovantes Pendentes', value: pendingComprovantes.length, icon: FileSearch, color: 'bg-warning/10 text-warning', highlight: pendingComprovantes.length > 0 },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Resumo Geral</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className={`p-6 border ${stat.highlight ? 'border-warning bg-warning/5 ring-2 ring-warning/20' : 'border-border'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}