import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, Truck, UserCheck, Users, Route, FileText, CreditCard, AlertCircle } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value ?? '—'}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmpresaSummary({ session }) {
  const id = session?.empresa_id;
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.entities.Frota.filter({ empresa_id: id }),
      api.entities.Veiculo.filter({ empresa_id: id }),
      api.entities.Motorista.filter({ empresa_id: id }),
      api.entities.Passageiro.filter({ empresa_id: id }),
      api.entities.Rota.filter({ empresa_id: id }),
      api.entities.Contrato.filter({ empresa_id: id }),
      api.entities.Pagamento.filter({ empresa_id: id }),
    ]).then(([frotas, veiculos, motoristas, passageiros, rotas, contratos, pagamentos]) => {
      setStats({
        frotas:     frotas.length,
        veiculos:   veiculos.length,
        motoristas: motoristas.length,
        passageiros: passageiros.length,
        rotas:      rotas.length,
        contratos:  contratos.filter(c => c.status === 'ativo').length,
        pendentes:  pagamentos.filter(p => p.status === 'aguardando').length,
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const cards = [
    { title: 'Frotas',          key: 'frotas',      icon: Layers,      color: 'bg-primary'     },
    { title: 'Veículos',        key: 'veiculos',    icon: Truck,       color: 'bg-blue-500'    },
    { title: 'Motoristas',      key: 'motoristas',  icon: UserCheck,   color: 'bg-emerald-500' },
    { title: 'Passageiros',     key: 'passageiros', icon: Users,       color: 'bg-violet-500'  },
    { title: 'Rotas Ativas',    key: 'rotas',       icon: Route,       color: 'bg-cyan-500'    },
    { title: 'Contratos Ativos',key: 'contratos',   icon: FileText,    color: 'bg-indigo-500'  },
    { title: 'Pag. Pendentes',  key: 'pendentes',   icon: AlertCircle, color: 'bg-amber-500'   },
  ];

  // Motorista vê apenas cards de frotas, veículos, passageiros e rotas
  // Passageiro vê apenas cards de rotas, contratos e pagamentos pendentes
  const visibleCards = session?.role === 'motorista'
    ? cards.filter(c => ['frotas', 'veiculos', 'passageiros', 'rotas'].includes(c.key))
    : session?.role === 'passageiro'
    ? cards.filter(c => ['rotas', 'contratos', 'pendentes'].includes(c.key))
    : cards;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumo da Empresa</h1>
        <p className="text-muted-foreground text-sm mt-1">{session?.empresa_nome}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: visibleCards.length }).map((_, i) => (
              <Card key={i}><CardContent className="p-5 h-[76px] animate-pulse bg-muted rounded-xl" /></Card>
            ))
          : visibleCards.map(c => (
              <StatCard key={c.key} title={c.title} value={stats[c.key]} icon={c.icon} color={c.color} />
            ))
        }
      </div>
    </div>
  );
}
