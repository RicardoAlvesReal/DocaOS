import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Layers, Truck, UserCheck, Users, Route, FileText, CreditCard, AlertCircle, Upload } from 'lucide-react';

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
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const [currentLogo, setCurrentLogo] = useState(session?.empresa_logo || '');

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setLogoError('Formato inválido. Use JPG, PNG ou WebP.');
      return;
    }
    setLogoUploading(true);
    setLogoError('');
    try {
      const { file_url } = await api.uploadFile(file);
      await api.entities.Empresa.update(id, { logo_url: file_url });
      // Atualiza sessão em localStorage e recarrega para propagar a logo
      const raw = localStorage.getItem('rotaflow_session');
      if (raw) {
        const s = JSON.parse(raw);
        s.empresa_logo = file_url;
        localStorage.setItem('rotaflow_session', JSON.stringify(s));
      }
      setCurrentLogo(file_url);
      window.location.reload();
    } catch (err) {
      setLogoError(err.message || 'Erro ao guardar logo.');
    } finally {
      setLogoUploading(false);
    }
  };

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
    { title: 'Frotas',          key: 'frotas',      icon: Layers,      color: 'bg-gradient-to-br from-blue-500 to-blue-600'     },
    { title: 'Veículos',        key: 'veiculos',    icon: Truck,       color: 'bg-gradient-to-br from-blue-400 to-blue-500'    },
    { title: 'Motoristas',      key: 'motoristas',  icon: UserCheck,   color: 'bg-gradient-to-br from-emerald-400 to-emerald-500' },
    { title: 'Passageiros',     key: 'passageiros', icon: Users,       color: 'bg-gradient-to-br from-violet-400 to-violet-500' },
    { title: 'Rotas Ativas',    key: 'rotas',       icon: Route,       color: 'bg-gradient-to-br from-cyan-400 to-cyan-500'    },
    { title: 'Contratos Ativos',key: 'contratos',   icon: FileText,    color: 'bg-gradient-to-br from-indigo-400 to-indigo-500' },
    { title: 'Pag. Pendentes',  key: 'pendentes',   icon: AlertCircle, color: 'bg-gradient-to-br from-amber-400 to-amber-500'  },
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

      {/* Logo da empresa — apenas admin pode alterar */}
      {session?.role === 'admin' && (
        <Card>
          <CardContent className="p-5 flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Logo da empresa</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Visível para todos os utilizadores da empresa na barra lateral.
              </p>
              {logoError && <p className="text-red-500 text-xs mt-1">{logoError}</p>}
            </div>
            {currentLogo && (
              <img src={currentLogo} alt="Logo" className="h-12 w-auto max-w-[140px] object-contain rounded border border-border" />
            )}
            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border transition-colors shrink-0 ${logoUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={logoUploading}
              />
              <Upload className="w-4 h-4" />
              {logoUploading ? 'A guardar...' : currentLogo ? 'Alterar logo' : 'Adicionar logo'}
            </label>
          </CardContent>
        </Card>
      )}

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
