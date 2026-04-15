import React from 'react';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { MONTHS_MAP, MONTH_KEYS } from '@/lib/authStore';

const statusConfig = {
  pago: {
    label: 'Pago',
    icon: CheckCircle,
    bg: 'bg-success/8 border-success/25',
    iconColor: 'text-success',
    textColor: 'text-success',
    dot: 'bg-success',
  },
  pendente: {
    label: 'Pendente',
    icon: AlertTriangle,
    bg: 'bg-destructive/8 border-destructive/25',
    iconColor: 'text-destructive',
    textColor: 'text-destructive',
    dot: 'bg-destructive',
  },
  aguardando: {
    label: 'Aguardando',
    icon: Clock,
    bg: 'bg-warning/8 border-warning/25',
    iconColor: 'text-warning',
    textColor: 'text-warning',
    dot: 'bg-warning',
  },
  rejeitado: {
    label: 'Rejeitado',
    icon: XCircle,
    bg: 'bg-destructive/8 border-destructive/25',
    iconColor: 'text-destructive',
    textColor: 'text-destructive',
    dot: 'bg-destructive',
  },
};

export default function StudentMonthlyGrid({ student }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">📅 Painel de Mensalidades</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {MONTH_KEYS.map(key => {
          const status = student.meses[key] || 'pendente';
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          return (
            <div key={key} className={`rounded-2xl border-2 p-4 text-center transition-all hover:scale-105 ${cfg.bg}`}>
              <Icon className={`w-7 h-7 mx-auto mb-2 ${cfg.iconColor}`} />
              <p className="font-bold text-foreground text-sm">{MONTHS_MAP[key]}</p>
              <p className={`text-[11px] mt-1 font-semibold ${cfg.textColor} leading-tight`}>{cfg.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}