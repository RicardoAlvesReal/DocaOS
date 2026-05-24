import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp, Star, Zap, Rocket } from 'lucide-react';

const PLANO_PRECO = { starter: 99, profissional: 249, enterprise: 599 };

function StatCard({ title, value, sub, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminSummary() {
  const [empresas, setEmpresas] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [passageiros, setPassageiros] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.entities.Empresa.filter({}),
      api.entities.Motorista.filter({}),
      api.entities.Passageiro.filter({}),
      api.entities.Contrato.filter({}),
    ]).then(([e, m, p, c]) => {
      setEmpresas(e);
      setMotoristas(m);
      setPassageiros(p);
      setContratos(c);
    }).finally(() => setLoading(false));
  }, []);

  const ativas   = empresas.filter(e => e.ativo);
  const byPlano  = { starter: 0, profissional: 0, enterprise: 0 };
  ativas.forEach(e => { if (byPlano[e.plano] !== undefined) byPlano[e.plano]++; });
  const mrr = ativas.reduce((acc, e) => acc + (PLANO_PRECO[e.plano] || 0), 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted rounded-xl" /></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão Geral da Plataforma</h1>
        <p className="text-muted-foreground text-sm mt-1">Métricas globais de todas as empresas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Empresas Ativas"
          value={ativas.length}
          sub={`${empresas.length - ativas.length} inativas`}
          icon={Building2}
          color="bg-primary"
        />
        <StatCard
          title="Total Motoristas"
          value={motoristas.length}
          sub="cadastrados na plataforma"
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Passageiros"
          value={passageiros.length}
          sub="cadastrados na plataforma"
          icon={Users}
          color="bg-emerald-500"
        />
        <StatCard
          title="MRR Estimado"
          value={`R$ ${mrr.toLocaleString('pt-BR')}`}
          sub={`${contratos.filter(c => c.status === 'ativo').length} contratos ativos`}
          icon={TrendingUp}
          color="bg-amber-500"
        />
      </div>

      {/* Distribuição por plano */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'starter',      label: 'Starter',      icon: Star,   color: 'text-slate-500',  bg: 'bg-slate-100',    price: 99  },
              { key: 'profissional', label: 'Profissional', icon: Zap,    color: 'text-primary',    bg: 'bg-primary/10',   price: 249 },
              { key: 'enterprise',   label: 'Enterprise',   icon: Rocket, color: 'text-amber-600',  bg: 'bg-amber-50',     price: 599 },
            ].map(p => (
              <div key={p.key} className={`rounded-xl p-4 ${p.bg} flex items-center gap-4`}>
                <p.icon className={`w-7 h-7 ${p.color}`} />
                <div>
                  <p className="font-bold text-lg">{byPlano[p.key]}</p>
                  <p className={`text-sm font-medium ${p.color}`}>{p.label}</p>
                  <p className="text-xs text-muted-foreground">R$ {p.price}/mês cada</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
