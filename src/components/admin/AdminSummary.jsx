import React from 'react';
import { Users, CheckCircle, AlertTriangle, FileSearch, TrendingUp } from 'lucide-react';
import { getStudents, getComprovantes, MONTH_KEYS, MONTHS_MAP } from '@/lib/authStore';

export default function AdminSummary() {
  const students = getStudents();
  const comprovantes = getComprovantes();
  const pendingComprovantes = comprovantes.filter(c => c.status === 'aguardando');

  const now = new Date();
  // Map JS getMonth() (0=Jan) to MONTH_KEYS index
  const currentMonthKey = MONTH_KEYS[now.getMonth()] || null;

  let pagosNoMes = 0;
  let inadimplentes = 0;
  if (currentMonthKey) {
    students.forEach(s => {
      if (s.meses[currentMonthKey] === 'pago') pagosNoMes++;
      else inadimplentes++;
    });
  }

  const stats = [
    {
      label: 'Total de Alunos',
      value: students.length,
      icon: Users,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      trend: null,
    },
    {
      label: `Pagos em ${MONTHS_MAP[currentMonthKey] || '—'}`,
      value: pagosNoMes,
      icon: CheckCircle,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      trend: null,
    },
    {
      label: 'Inadimplentes',
      value: inadimplentes,
      icon: AlertTriangle,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      trend: null,
    },
    {
      label: 'Comprovantes Pendentes',
      value: pendingComprovantes.length,
      icon: FileSearch,
      iconBg: pendingComprovantes.length > 0 ? 'bg-warning/10' : 'bg-muted',
      iconColor: pendingComprovantes.length > 0 ? 'text-warning' : 'text-muted-foreground',
      highlight: pendingComprovantes.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Resumo Geral</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Visão geral do sistema</p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`bg-card rounded-2xl p-5 border transition-all ${
              stat.highlight
                ? 'border-warning/40 shadow-lg shadow-warning/8'
                : 'border-border hover:border-border/80 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              {stat.highlight && (
                <span className="text-[10px] font-bold bg-warning/10 text-warning px-2 py-0.5 rounded-full border border-warning/20">
                  ATENÇÃO
                </span>
              )}
            </div>
            <p className="text-3xl font-black text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}