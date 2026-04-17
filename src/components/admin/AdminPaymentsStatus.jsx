import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Clock, XCircle, ChevronDown, Loader2 } from 'lucide-react';
import { getStudents, MONTHS_MAP, MONTH_KEYS } from '@/lib/authStore';

const statusConfig = {
  pago: { label: 'Pago', icon: CheckCircle, pill: 'bg-success/10 text-success border-success/20' },
  pendente: { label: 'Pendente', icon: AlertTriangle, pill: 'bg-destructive/10 text-destructive border-destructive/20' },
  aguardando: { label: 'Aguardando', icon: Clock, pill: 'bg-warning/10 text-warning border-warning/20' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, pill: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function AdminPaymentsStatus() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');

  useEffect(() => {
    getStudents().then(data => {
      setStudents(data);
      setLoading(false);
    });
  }, []);

  const rows = [];
  students.forEach(s => {
    MONTH_KEYS.forEach(key => {
      rows.push({ student: s, mesKey: key, status: (s.meses || {})[key] || 'pendente' });
    });
  });

  const filtered = rows.filter(r =>
    (filterMonth === 'todos' || r.mesKey === filterMonth) &&
    (filterStatus === 'todos' || r.status === filterStatus)
  );

  const countByStatus = (status) => rows.filter(r => r.status === status).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Painel de Pagamentos</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Situação de todos os alunos por mês</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? 'todos' : key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                filterStatus === key ? cfg.pill + ' scale-105' : 'bg-card border-border text-muted-foreground hover:border-foreground/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}: {countByStatus(key)}
            </button>
          );
        })}
        {filterStatus !== 'todos' && (
          <button onClick={() => setFilterStatus('todos')} className="text-xs text-muted-foreground underline px-2">
            limpar
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="h-9 pl-3 pr-8 rounded-xl border border-border bg-card text-sm font-medium text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
          >
            <option value="todos">Todos os meses</option>
            {MONTH_KEYS.map(k => (
              <option key={k} value={k}>{MONTHS_MAP[k]}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          <span>Aluno</span>
          <span>Matrícula</span>
          <span>Mês</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
          {filtered.map((r, i) => {
            const cfg = statusConfig[r.status];
            const Icon = cfg.icon;
            return (
              <div key={i} className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <p className="font-medium text-sm text-foreground">{r.student.nome}</p>
                <span className="font-mono text-xs text-muted-foreground">{r.student.matricula}</span>
                <span className="text-sm font-medium">{MONTHS_MAP[r.mesKey]}</span>
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold w-fit ${cfg.pill}`}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center text-muted-foreground text-sm">Nenhum resultado encontrado.</div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} registros exibidos</p>
    </div>
  );
}