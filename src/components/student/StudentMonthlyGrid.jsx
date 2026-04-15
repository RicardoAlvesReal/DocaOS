import React from 'react';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { MONTHS_MAP, MONTH_KEYS } from '@/lib/authStore';

const statusConfig = {
  pago: {
    label: 'Pago',
    icon: CheckCircle,
    bg: 'bg-success/10 border-success/30',
    iconColor: 'text-success',
    textColor: 'text-success',
  },
  pendente: {
    label: 'Pendente',
    icon: AlertTriangle,
    bg: 'bg-destructive/10 border-destructive/30',
    iconColor: 'text-destructive',
    textColor: 'text-destructive',
  },
  aguardando: {
    label: 'Aguardando Confirmação',
    icon: Clock,
    bg: 'bg-warning/10 border-warning/30',
    iconColor: 'text-warning',
    textColor: 'text-warning',
  },
  rejeitado: {
    label: 'Comprovante Rejeitado — Envie novamente',
    icon: XCircle,
    bg: 'bg-destructive/10 border-destructive/30',
    iconColor: 'text-destructive',
    textColor: 'text-destructive',
  },
};

export default function StudentMonthlyGrid({ student }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">📅 Painel de Mensalidades</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {MONTH_KEYS.map(key => {
          const status = student.meses[key] || 'pendente';
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <div key={key} className={`rounded-xl border-2 p-4 text-center transition-all ${config.bg}`}>
              <Icon className={`w-8 h-8 mx-auto mb-2 ${config.iconColor}`} />
              <p className="font-bold text-foreground text-sm">{MONTHS_MAP[key]}</p>
              <p className={`text-xs mt-1 font-semibold ${config.textColor} leading-tight`}>{config.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}