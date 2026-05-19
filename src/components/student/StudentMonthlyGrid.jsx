import React from 'react';
import { CheckCircle, AlertTriangle, Clock, XCircle } from 'lucide-react';
import { MONTHS_MAP, MONTH_KEYS } from '@/lib/authStore';

const statusConfig = {
  pago: {
    label: 'Pago',
    icon: CheckCircle,
    style: { background: '#0d2318', border: '1px solid #166534', color: '#4ade80' },
    iconColor: '#4ade80',
  },
  pendente: {
    label: 'Pendente',
    icon: AlertTriangle,
    style: { background: '#2a0d0d', border: '1px solid #7f1d1d', color: '#f87171' },
    iconColor: '#f87171',
  },
  aguardando: {
    label: 'Aguardando',
    icon: Clock,
    style: { background: '#1a1400', border: '1px solid #713f12', color: '#facc15' },
    iconColor: '#facc15',
  },
  rejeitado: {
    label: 'Rejeitado',
    icon: XCircle,
    style: { background: '#2a0d0d', border: '1px solid #7f1d1d', color: '#f87171' },
    iconColor: '#f87171',
  },
};

export default function StudentMonthlyGrid({ student }) {
  return (
    <div>
      <h2 className="text-base font-bold text-white mb-5">Situação das Mensalidades</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {MONTH_KEYS.map(key => {
          const status = (student.meses || {})[key] || 'pendente';
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          return (
            <div
              key={key}
              className="rounded-2xl p-4 text-center transition-all hover:scale-105"
              style={cfg.style}
            >
              <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: cfg.iconColor }} />
              <p className="font-bold text-white text-xs">{MONTHS_MAP[key]}</p>
              <p className="text-[10px] mt-1 font-semibold leading-tight" style={{ color: cfg.iconColor }}>
                {cfg.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}