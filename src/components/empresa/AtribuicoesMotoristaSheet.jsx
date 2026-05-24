import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/api/apiClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Car, MapPin, Users, Trash2, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

const CONTRATO_VAZIO = { passageiro_id: '', rota_id: '', valor_mensal: '', data_inicio: '' };

export default function AtribuicoesMotoristaSheet({ motorista, empresaId, open, onClose }) {
  const [loading, setLoading]         = useState(false);
  const [todasRotas, setTodasRotas]   = useState([]);
  const [todosVeiculos, setTodosVeiculos] = useState([]);
  const [todosPassageiros, setTodosPassageiros] = useState([]);
  const [contratos, setContratos]     = useState([]);

  // aba Rotas: conjunto de IDs marcados
  const [rotasSelecionadas, setRotasSelecionadas] = useState(new Set());
  const [salvandoRotas, setSalvandoRotas]         = useState(false);

  // aba Veículos: mapa rotaId → veiculo_id
  const [veiculosPorRota, setVeiculosPorRota]     = useState({});
  const [salvandoVeiculos, setSalvandoVeiculos]   = useState(false);

  // aba Passageiros: formulário de novo contrato
  const [novoContrato, setNovoContrato]           = useState(CONTRATO_VAZIO);
  const [adicionandoContrato, setAdicionandoContrato] = useState(false);
  const [salvandoContrato, setSalvandoContrato]   = useState(false);

  const load = useCallback(async () => {
    if (!open || !motorista || !empresaId) return;
    setLoading(true);
    try {
      const [rotas, veiculos, passageiros, ctrs] = await Promise.all([
        api.entities.Rota.filter({ empresa_id: empresaId }),
        api.entities.Veiculo.filter({ empresa_id: empresaId }),
        api.entities.Passageiro.filter({ empresa_id: empresaId }),
        api.entities.Contrato.filter({ empresa_id: empresaId }),
      ]);

      setTodasRotas(rotas);
      setTodosVeiculos(veiculos);
      setTodosPassageiros(passageiros);
      setContratos(ctrs);

      // inicializa estado de rotas atribuídas
      const atribuidas = new Set(
        rotas.filter(r => r.motorista_id === motorista.id).map(r => r.id)
      );
      setRotasSelecionadas(atribuidas);

      // inicializa mapa de veículos por rota
      const mapa = {};
      rotas
        .filter(r => r.motorista_id === motorista.id)
        .forEach(r => { mapa[r.id] = r.veiculo_id || ''; });
      setVeiculosPorRota(mapa);
    } catch (e) {
      toast.error('Erro ao carregar atribuições: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [open, motorista, empresaId]);

  useEffect(() => { load(); }, [load]);

  // ── Rotas ──────────────────────────────────────────────────────────────────
  const toggleRota = (rotaId) => {
    setRotasSelecionadas(prev => {
      const next = new Set(prev);
      if (next.has(rotaId)) {
        next.delete(rotaId);
        // remove do mapa de veículos
        setVeiculosPorRota(m => { const n = { ...m }; delete n[rotaId]; return n; });
      } else {
        next.add(rotaId);
        // adiciona ao mapa de veículos com valor atual
        const rota = todasRotas.find(r => r.id === rotaId);
        setVeiculosPorRota(m => ({ ...m, [rotaId]: rota?.veiculo_id || '' }));
      }
      return next;
    });
  };

  const salvarRotas = async () => {
    setSalvandoRotas(true);
    try {
      const atualizacoes = todasRotas.map(r => {
        const deveAtribuir = rotasSelecionadas.has(r.id);
        const jaAtribuida  = r.motorista_id === motorista.id;
        if (deveAtribuir && !jaAtribuida)
          return api.entities.Rota.update(r.id, { motorista_id: motorista.id });
        if (!deveAtribuir && jaAtribuida)
          return api.entities.Rota.update(r.id, { motorista_id: null });
        return Promise.resolve();
      });
      await Promise.all(atualizacoes);
      toast.success('Rotas atualizadas!');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvandoRotas(false);
    }
  };

  // ── Veículos ───────────────────────────────────────────────────────────────
  const salvarVeiculos = async () => {
    setSalvandoVeiculos(true);
    try {
      const rotasDoMotorista = todasRotas.filter(r => rotasSelecionadas.has(r.id));
      const atualizacoes = rotasDoMotorista.map(r => {
        const novoVeiculo = veiculosPorRota[r.id] || null;
        if (novoVeiculo === (r.veiculo_id || '')) return Promise.resolve();
        return api.entities.Rota.update(r.id, { veiculo_id: novoVeiculo || null });
      });
      await Promise.all(atualizacoes);
      toast.success('Veículos atualizados!');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvandoVeiculos(false);
    }
  };

  // ── Passageiros / Contratos ────────────────────────────────────────────────
  const rotasDoMotorista = todasRotas.filter(r => rotasSelecionadas.has(r.id));

  const contratosDoMotorista = contratos.filter(c => {
    const rota = todasRotas.find(r => r.id === c.rota_id);
    return rota && rota.motorista_id === motorista?.id && c.status === 'ativo';
  });

  const cancelarContrato = async (contratoId) => {
    try {
      await api.entities.Contrato.update(contratoId, { status: 'cancelado' });
      toast.success('Passageiro removido da rota.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const nc = (k, v) => setNovoContrato(p => ({ ...p, [k]: v }));

  const adicionarPassageiro = async () => {
    const { passageiro_id, rota_id, valor_mensal, data_inicio } = novoContrato;
    if (!passageiro_id || !rota_id || !valor_mensal || !data_inicio) {
      toast.error('Preencha todos os campos do contrato.');
      return;
    }
    setSalvandoContrato(true);
    try {
      await api.entities.Contrato.create({ passageiro_id, rota_id, valor_mensal, data_inicio });
      toast.success('Passageiro atribuído com sucesso!');
      setNovoContrato(CONTRATO_VAZIO);
      setAdicionandoContrato(false);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSalvandoContrato(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (!motorista) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Atribuições — {motorista.nome}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Gerencie as rotas, veículo e passageiros atribuídos a este motorista.
          </p>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            Carregando...
          </div>
        ) : (
          <Tabs defaultValue="rotas" className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="rotas"   className="flex-1 gap-1.5"><MapPin className="w-3.5 h-3.5" /> Rotas</TabsTrigger>
              <TabsTrigger value="veiculo" className="flex-1 gap-1.5"><Car    className="w-3.5 h-3.5" /> Veículo</TabsTrigger>
              <TabsTrigger value="passageiros" className="flex-1 gap-1.5"><Users className="w-3.5 h-3.5" /> Passageiros</TabsTrigger>
            </TabsList>

            {/* ── ABA ROTAS ── */}
            <TabsContent value="rotas" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Marque as rotas que serão operadas por este motorista.
              </p>
              {todasRotas.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-8">
                  Nenhuma rota cadastrada na empresa.
                </p>
              ) : (
                <div className="space-y-2">
                  {todasRotas.map(rota => (
                    <div
                      key={rota.id}
                      className="flex items-center gap-3 rounded-md border px-3 py-2.5 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleRota(rota.id)}
                    >
                      <Checkbox
                        checked={rotasSelecionadas.has(rota.id)}
                        onCheckedChange={() => toggleRota(rota.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{rota.nome}</p>
                        {rota.frota_nome && (
                          <p className="text-xs text-muted-foreground">{rota.frota_nome}</p>
                        )}
                      </div>
                      {rota.motorista_id && rota.motorista_id !== motorista.id && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          Outro motorista
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <Button
                className="w-full gap-2"
                onClick={salvarRotas}
                disabled={salvandoRotas}
              >
                <Save className="w-4 h-4" />
                {salvandoRotas ? 'Salvando...' : 'Salvar Rotas'}
              </Button>
            </TabsContent>

            {/* ── ABA VEÍCULO ── */}
            <TabsContent value="veiculo" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecione o veículo utilizado em cada rota deste motorista.
              </p>
              {rotasDoMotorista.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-8">
                  Nenhuma rota atribuída ainda. Atribua rotas primeiro.
                </p>
              ) : (
                <div className="space-y-3">
                  {rotasDoMotorista.map(rota => (
                    <div key={rota.id} className="space-y-1.5">
                      <Label className="text-sm font-medium">{rota.nome}</Label>
                      <Select
                        value={veiculosPorRota[rota.id] || 'none'}
                        onValueChange={v =>
                          setVeiculosPorRota(m => ({ ...m, [rota.id]: v === 'none' ? '' : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Nenhum veículo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Nenhum —</SelectItem>
                          {todosVeiculos.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.modelo} · {v.placa}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              )}
              {rotasDoMotorista.length > 0 && (
                <Button
                  className="w-full gap-2"
                  onClick={salvarVeiculos}
                  disabled={salvandoVeiculos}
                >
                  <Save className="w-4 h-4" />
                  {salvandoVeiculos ? 'Salvando...' : 'Salvar Veículos'}
                </Button>
              )}
            </TabsContent>

            {/* ── ABA PASSAGEIROS ── */}
            <TabsContent value="passageiros" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Passageiros atribuídos às rotas deste motorista.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setAdicionandoContrato(v => !v)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Atribuir
                </Button>
              </div>

              {/* Formulário novo contrato */}
              {adicionandoContrato && (
                <div className="rounded-md border p-3 space-y-3 bg-muted/30">
                  <p className="text-sm font-medium">Novo contrato</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Passageiro *</Label>
                    <Select value={novoContrato.passageiro_id} onValueChange={v => nc('passageiro_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        {todosPassageiros.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rota *</Label>
                    {rotasDoMotorista.length === 0 ? (
                      <p className="text-xs text-orange-600">Atribua rotas ao motorista primeiro.</p>
                    ) : (
                      <Select value={novoContrato.rota_id} onValueChange={v => nc('rota_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {rotasDoMotorista.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Valor mensal (R$) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={novoContrato.valor_mensal}
                        onChange={e => nc('valor_mensal', e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Data início *</Label>
                      <Input
                        type="date"
                        value={novoContrato.data_inicio}
                        onChange={e => nc('data_inicio', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={adicionarPassageiro}
                      disabled={salvandoContrato || rotasDoMotorista.length === 0}
                    >
                      {salvandoContrato ? 'Salvando...' : 'Confirmar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setAdicionandoContrato(false); setNovoContrato(CONTRATO_VAZIO); }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              {/* Lista de contratos ativos */}
              {contratosDoMotorista.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-6">
                  Nenhum passageiro atribuído às rotas deste motorista.
                </p>
              ) : (
                <div className="space-y-2">
                  {contratosDoMotorista.map(c => {
                    const rotaNome = todasRotas.find(r => r.id === c.rota_id)?.nome || '—';
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-md border px-3 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {c.passageiro_nome}
                          </p>
                          <p className="text-xs text-muted-foreground">{rotaNome}</p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          R$ {Number(c.valor_mensal || 0).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive shrink-0"
                          onClick={() => cancelarContrato(c.id)}
                          title="Remover passageiro desta rota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
