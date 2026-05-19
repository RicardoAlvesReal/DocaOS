import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, AlertTriangle, FileSearch, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { getStudents, getComprovantes, MONTH_KEYS, MONTHS_MAP } from '@/lib/authStore';

export default function AdminSummary() {
  const [students, setStudents] = useState([]);
  const [comprovantes, setComprovantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    Promise.all([getStudents(), getComprovantes()]).then(([s, c]) => {
      setStudents(s);
      setComprovantes(c);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const pendingComprovantes = comprovantes.filter(c => c.status === 'aguardando');

  const now = new Date();
  const currentMonthKey = MONTH_KEYS[now.getMonth()] || null;
  const currentMonthLabel = MONTHS_MAP[currentMonthKey] || '—';

  let pagosNoMes = 0;
  let inadimplentes = 0;
  let totalEntradasMes = 0;
  let totalSaidasMes = 0;
  let totalEntradasAno = 0;
  let totalPendenteAno = 0;

  students.forEach(s => {
    if (currentMonthKey) {
      if ((s.meses || {})[currentMonthKey] === 'pago') {
        pagosNoMes++;
        totalEntradasMes += s.mensalidade;
      } else {
        inadimplentes++;
        totalSaidasMes += s.mensalidade;
      }
    }
    MONTH_KEYS.forEach(mk => {
      if ((s.meses || {})[mk] === 'pago') {
        totalEntradasAno += s.mensalidade;
      } else {
        totalPendenteAno += s.mensalidade;
      }
    });
  });

  const totalPotencialMes = totalEntradasMes + totalSaidasMes;
  const taxaRecebimento = totalPotencialMes > 0 ? Math.round((totalEntradasMes / totalPotencialMes) * 100) : 0;
  const fmt = (v) => showValues ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••';
  const fmtYear = (v) => showValues ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••••';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Resumo Geral</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Visão financeira e operacional</p>
        </div>
        <button
          onClick={() => setShowValues(v => !v)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
        >
          {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showValues ? 'Ocultar' : 'Exibir'}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entradas — {currentMonthLabel}</p>
              <p className="text-3xl font-black text-foreground mt-1">{fmt(totalEntradasMes)}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-muted-foreground">{showValues ? `${pagosNoMes} aluno${pagosNoMes !== 1 ? 's' : ''} pagou` : '•• alunos pagou'}</span>
            <span className="ml-auto font-bold text-emerald-600">{showValues ? `${taxaRecebimento}% recebido` : '••% recebido'}</span>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: showValues ? `${taxaRecebimento}%` : '0%' }} />
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Em Aberto — {currentMonthLabel}</p>
              <p className="text-3xl font-black text-foreground mt-1">{fmt(totalSaidasMes)}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-muted-foreground">{showValues ? `${inadimplentes} inadimplente${inadimplentes !== 1 ? 's' : ''}` : '•• inadimplentes'}</span>
            <span className="ml-auto font-bold text-rose-600">{showValues ? `${100 - taxaRecebimento}% pendente` : '••% pendente'}</span>
          </div>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: showValues ? `${100 - taxaRecebimento}%` : '0%' }} />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-bold text-foreground">Balanço do Ano</p>
            <p className="text-xs text-muted-foreground mt-0.5">Todos os meses · {now.getFullYear()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900">
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wide mb-1">Recebido</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 break-all">{fmtYear(totalEntradasAno)}</p>
          </div>
          <div className="text-center p-4 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-100 dark:border-rose-900">
            <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold uppercase tracking-wide mb-1">Pendente</p>
            <p className="text-lg font-black text-rose-700 dark:text-rose-400 break-all">{fmtYear(totalPendenteAno)}</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-xl border border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-1">Total Esperado</p>
            <p className="text-lg font-black text-foreground break-all">{fmtYear(totalEntradasAno + totalPendenteAno)}</p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total de Alunos', value: students.length, icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
          { label: `Pagos em ${currentMonthLabel}`, value: pagosNoMes, icon: CheckCircle, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-600' },
          { label: 'Inadimplentes', value: inadimplentes, icon: AlertTriangle, iconBg: 'bg-rose-500/10', iconColor: 'text-rose-600' },
          {
            label: 'Comprovantes Pendentes', value: pendingComprovantes.length, icon: FileSearch,
            iconBg: pendingComprovantes.length > 0 ? 'bg-amber-500/10' : 'bg-muted',
            iconColor: pendingComprovantes.length > 0 ? 'text-amber-600' : 'text-muted-foreground',
            highlight: pendingComprovantes.length > 0,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className={`bg-card rounded-2xl p-5 border transition-all ${
              stat.highlight ? 'border-amber-400/40 shadow-lg shadow-amber-400/10' : 'border-border hover:border-border/80 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              {stat.highlight && (
                <span className="text-[10px] font-bold bg-amber-400/10 text-amber-600 px-2 py-0.5 rounded-full border border-amber-400/20">ATENÇÃO</span>
              )}
            </div>
            <p className="text-3xl font-black text-foreground">{showValues ? stat.value : '•'}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}