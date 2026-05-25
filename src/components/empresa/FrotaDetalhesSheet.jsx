import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/api/apiClient';
import { modalOverlay, modalContent, tabContent } from '@/lib/animations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Plus, Trash2, Car, Route, Info, Users, X } from 'lucide-react';
import { toast } from 'sonner';

const VEICULO_VAZIO = { placa: '', modelo: '', ano: '', capacidade: '' };
const ROTA_VAZIA = { nome: '', descricao: '', motorista_id: '', veiculo_id: '', horario_ida: '', horario_volta: '' };

export default function FrotaDetalhesSheet({ frota, empresaId, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [tabAtiva, setTabAtiva] = useState('info');
  const [veiculos, setVeiculos] = useState([]);
  const [rotas, setRotas] = useState([]);
  const [motoristas, setMotoristas] = useState([]);
  const [contratos, setContratos] = useState([]);

  const [editInfo, setEditInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ nome: '' });

  const [veiculoDialog, setVeiculoDialog] = useState({ open: false, editing: null });
  const [veiculoForm, setVeiculoForm] = useState(VEICULO_VAZIO);
  const [savingVeiculo, setSavingVeiculo] = useState(false);

  const [rotaDialog, setRotaDialog] = useState({ open: false, editing: null });
  const [rotaForm, setRotaForm] = useState(ROTA_VAZIA);
  const [savingRota, setSavingRota] = useState(false);

  const [rotaExpandida, setRotaExpandida] = useState(null);
  const [closing, setClosing] = useState(false);
  const mounted = open && !closing;

  const load = async () => {
    if (!open || !frota || !empresaId) return;
    setLoading(true);
    try {
      const [veics, rts, mots, ctrs] = await Promise.all([
        api.entities.Veiculo.filter({ frota_id: frota.id }),
        api.entities.Rota.filter({ frota_id: frota.id }),
        api.entities.Motorista.filter({ empresa_id: empresaId }),
        api.entities.Contrato.filter({ empresa_id: empresaId }),
      ]);
      setVeiculos(veics);
      setRotas(rts);
      setMotoristas(mots);
      setContratos(ctrs);
    } catch (e) {
      toast.error('Erro ao carregar detalhes: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [open, frota, empresaId]);

  const contratosDaRota = (rotaId) =>
    contratos.filter(c => c.rota_id === rotaId && c.status === 'ativo');

  const motoristaNome = (motoristaId) =>
    motoristas.find(m => m.id === motoristaId)?.nome || '—';

  const veiculoLabel = (veiculoId) => {
    const v = veiculos.find(v => v.id === veiculoId);
    return v ? `${v.modelo} · ${v.placa}` : '—';
  };

  const motoristaDoVeiculo = (veiculoId) => {
    const rotasDoVeiculo = rotas.filter(r => r.veiculo_id === veiculoId && r.ativo);
    const motoristasIds = [...new Set(rotasDoVeiculo.map(r => r.motorista_id).filter(Boolean))];
    return motoristasIds.map(id => motoristaNome(id));
  };

  const salvarInfo = async () => {
    if (!infoForm.nome?.trim()) { toast.error('Nome é obrigatório.'); return; }
    try {
      await api.entities.Frota.update(frota.id, { nome: infoForm.nome });
      toast.success('Frota atualizada!');
      setEditInfo(false);
      if (onClose) onClose(true);
    } catch (e) { toast.error(e.message); }
  };

  const openEditInfo = () => {
    setInfoForm({ nome: frota.nome });
    setEditInfo(true);
  };

  const openVeiculoCreate = () => {
    setVeiculoForm(VEICULO_VAZIO);
    setVeiculoDialog({ open: true, editing: null });
  };

  const openVeiculoEdit = (v) => {
    setVeiculoForm({ placa: v.placa, modelo: v.modelo, ano: String(v.ano || ''), capacidade: String(v.capacidade || '') });
    setVeiculoDialog({ open: true, editing: v.id });
  };

  const closeVeiculoDialog = () => setVeiculoDialog({ open: false, editing: null });

  const salvarVeiculo = async () => {
    const { placa, modelo, ano, capacidade } = veiculoForm;
    if (!placa?.trim() || !modelo?.trim()) { toast.error('Placa e modelo são obrigatórios.'); return; }
    setSavingVeiculo(true);
    try {
      const payload = { placa: placa.trim(), modelo: modelo.trim(), frota_id: frota.id };
      if (ano) payload.ano = parseInt(ano);
      if (capacidade) payload.capacidade = parseInt(capacidade);
      if (veiculoDialog.editing) {
        await api.entities.Veiculo.update(veiculoDialog.editing, payload);
        toast.success('Veículo atualizado!');
      } else {
        await api.entities.Veiculo.create(payload);
        toast.success('Veículo criado!');
      }
      closeVeiculoDialog();
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSavingVeiculo(false); }
  };

  const desativarVeiculo = async (veiculo) => {
    try {
      await api.entities.Veiculo.delete(veiculo.id);
      toast.success('Veículo desativado.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const openRotaCreate = () => {
    setRotaForm(ROTA_VAZIA);
    setRotaDialog({ open: true, editing: null });
  };

  const openRotaEdit = (r) => {
    setRotaForm({
      nome: r.nome,
      descricao: r.descricao || '',
      motorista_id: r.motorista_id || '',
      veiculo_id: r.veiculo_id || '',
      horario_ida: r.horario_ida || '',
      horario_volta: r.horario_volta || '',
    });
    setRotaDialog({ open: true, editing: r.id });
  };

  const closeRotaDialog = () => setRotaDialog({ open: false, editing: null });

  const salvarRota = async () => {
    const { nome, descricao, motorista_id, veiculo_id, horario_ida, horario_volta } = rotaForm;
    if (!nome?.trim()) { toast.error('Nome da rota é obrigatório.'); return; }
    setSavingRota(true);
    try {
      const payload = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        frota_id: frota.id,
        motorista_id: motorista_id || null,
        veiculo_id: veiculo_id || null,
        horario_ida: horario_ida || null,
        horario_volta: horario_volta || null,
      };
      if (rotaDialog.editing) {
        await api.entities.Rota.update(rotaDialog.editing, payload);
        toast.success('Rota atualizada!');
      } else {
        await api.entities.Rota.create(payload);
        toast.success('Rota criada!');
      }
      closeRotaDialog();
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSavingRota(false); }
  };

  const desativarRota = async (rota) => {
    try {
      await api.entities.Rota.delete(rota.id);
      toast.success('Rota desativada.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const cancelarContrato = async (contratoId) => {
    try {
      await api.entities.Contrato.update(contratoId, { status: 'cancelado' });
      toast.success('Passageiro removido da rota.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose?.();
      setClosing(false);
    }, 150);
  };

  return (
    <>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: closing ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          style={{ pointerEvents: closing ? 'none' : 'auto' }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: closing ? 0 : 1 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
          />
          <motion.div
            className="relative bg-background rounded-lg shadow-xl border w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{
              opacity: closing ? 0 : 1,
              scale: closing ? 0.9 : 1,
              y: closing ? 5 : 0,
            }}
            transition={{ duration: 0.15 }}
          >
            <div className="sticky top-0 bg-background z-20 flex items-center justify-between px-6 pt-6 pb-2 border-b">
              <div>
                <h2 className="text-lg font-semibold">{frota?.nome}</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie informações, veículos e rotas desta frota.
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => onClose?.()}>
                <X className="w-4 h-4" />
              </Button>
            </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">Carregando...</div>
        ) : (
          <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="w-full">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="info" className="flex-1 gap-1.5"><Info className="w-3.5 h-3.5" /> Informações</TabsTrigger>
              <TabsTrigger value="veiculos" className="flex-1 gap-1.5"><Car className="w-3.5 h-3.5" /> Veículos</TabsTrigger>
              <TabsTrigger value="rotas" className="flex-1 gap-1.5"><Route className="w-3.5 h-3.5" /> Rotas</TabsTrigger>
            </TabsList>

            {/* ── ABA INFORMAÇÕES ── */}
            <TabsContent value="info" className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key="info"
                  {...tabContent}
                >
              <Card>
                <CardContent className="p-4 space-y-3">
                  {editInfo ? (
                    <>
                      <div className="space-y-1.5">
                        <Label>Nome da Frota</Label>
                        <Input value={infoForm.nome} onChange={e => setInfoForm(f => ({ ...f, nome: e.target.value }))} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={salvarInfo}>Salvar</Button>
                        <Button variant="outline" onClick={() => setEditInfo(false)}>Cancelar</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Nome</p>
                          <p className="font-medium">{frota?.nome}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={openEditInfo}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={frota?.ativo ? 'default' : 'secondary'}>
                          {frota?.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Veículos</p>
                        <p className="font-medium">{veiculos.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Rotas</p>
                        <p className="font-medium">{rotas.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Criada em</p>
                        <p className="font-medium">{frota?.created_date ? new Date(frota.created_date).toLocaleDateString('pt-BR') : ''}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* ── ABA VEÍCULOS ── */}
            <TabsContent value="veiculos" className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key="veiculos"
                  {...tabContent}
                >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {veiculos.length} veículo(s) nesta frota.
                </p>
                <Button size="sm" className="gap-1.5" onClick={openVeiculoCreate}>
                  <Plus className="w-3.5 h-3.5" /> Novo Veículo
                </Button>
              </div>

              {veiculos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum veículo cadastrado nesta frota.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {veiculos.map(v => (
                    <div key={v.id} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{v.modelo}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.placa}{v.ano ? ` · ${v.ano}` : ''}{v.capacidade ? ` · ${v.capacidade} lugares` : ''}
                        </p>
                        {(() => {
                          const mots = motoristaDoVeiculo(v.id);
                          return mots.length > 0 ? (
                            <p className="text-xs text-blue-600 mt-0.5">
                              Motorista: {mots.join(', ')}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-0.5">Sem motorista atribuído</p>
                          );
                        })()}
                      </div>
                      <Badge variant={v.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                        {v.status === 'ativo' ? 'Ativo' : v.status === 'manutencao' ? 'Manutenção' : 'Inativo'}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => openVeiculoEdit(v)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => desativarVeiculo(v)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* ── ABA ROTAS ── */}
            <TabsContent value="rotas" className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key="rotas"
                  {...tabContent}
                >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {rotas.length} rota(s) nesta frota.
                </p>
                <Button size="sm" className="gap-1.5" onClick={openRotaCreate}>
                  <Plus className="w-3.5 h-3.5" /> Nova Rota
                </Button>
              </div>

              {rotas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhuma rota cadastrada nesta frota.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {rotas.map(r => {
                    const expandida = rotaExpandida === r.id;
                    const passageiros = contratosDaRota(r.id);
                    return (
                      <div key={r.id} className="rounded-md border">
                        <div
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                          onClick={() => setRotaExpandida(expandida ? null : r.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{r.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {motoristaNome(r.motorista_id)} · {veiculoLabel(r.veiculo_id)}
                            </p>
                          </div>
                          <Badge variant={r.ativo ? 'default' : 'secondary'} className="text-xs">
                            {r.ativo ? 'Ativa' : 'Inativa'}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); openRotaEdit(r); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); desativarRota(r); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {expandida && (
                          <div className="border-t px-3 py-3 space-y-2 bg-muted/20">
                            {r.descricao && (
                              <p className="text-xs text-muted-foreground">{r.descricao}</p>
                            )}
                            {r.horario_ida && (
                              <p className="text-xs text-muted-foreground">
                                Ida: {r.horario_ida.slice(0, 5)}{r.horario_volta ? ` · Volta: ${r.horario_volta.slice(0, 5)}` : ''}
                              </p>
                            )}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Passageiros ({passageiros.length})
                              </p>
                              {passageiros.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Nenhum passageiro vinculado.</p>
                              ) : (
                                <div className="space-y-1">
                                  {passageiros.map(c => (
                                    <div key={c.id} className="flex items-center justify-between bg-background rounded px-2 py-1">
                                      <span className="text-xs font-medium">{c.passageiro_nome}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                          R$ {Number(c.valor_mensal || 0).toFixed(2)}
                                        </span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 text-destructive hover:text-destructive"
                                          onClick={() => cancelarContrato(c.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        )}

        {/* ── DIALOG VEÍCULO ── */}
        <AnimatePresence>
          {veiculoDialog.open && (
            <motion.div
              key="dlg-veiculo"
              className="fixed inset-0 z-[60] flex items-center justify-center"
              {...modalOverlay}
            >
              <motion.div
                className="absolute inset-0 bg-black/40"
                {...modalOverlay}
                onClick={closeVeiculoDialog}
              />
              <motion.div
                className="relative bg-background rounded-lg shadow-xl border w-full max-w-sm z-10 p-6"
                {...modalContent}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{veiculoDialog.editing ? 'Editar Veículo' : 'Novo Veículo'}</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeVeiculoDialog}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Placa *</Label>
                    <Input value={veiculoForm.placa} onChange={e => setVeiculoForm(f => ({ ...f, placa: e.target.value }))} placeholder="ABC-1234" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Modelo *</Label>
                    <Input value={veiculoForm.modelo} onChange={e => setVeiculoForm(f => ({ ...f, modelo: e.target.value }))} placeholder="Ex: Mercedes Sprinter" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Ano</Label>
                      <Input value={veiculoForm.ano} onChange={e => setVeiculoForm(f => ({ ...f, ano: e.target.value }))} placeholder="2024" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Capacidade</Label>
                      <Input value={veiculoForm.capacidade} onChange={e => setVeiculoForm(f => ({ ...f, capacidade: e.target.value }))} placeholder="20" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={closeVeiculoDialog}>Cancelar</Button>
                  <Button onClick={salvarVeiculo} disabled={savingVeiculo}>
                    {savingVeiculo ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DIALOG ROTA ── */}
        <AnimatePresence>
          {rotaDialog.open && (
            <motion.div
              key="dlg-rota"
              className="fixed inset-0 z-[60] flex items-center justify-center"
              {...modalOverlay}
            >
              <motion.div
                className="absolute inset-0 bg-black/40"
                {...modalOverlay}
                onClick={closeRotaDialog}
              />
              <motion.div
                className="relative bg-background rounded-lg shadow-xl border w-full max-w-md z-10 p-6"
                {...modalContent}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{rotaDialog.editing ? 'Editar Rota' : 'Nova Rota'}</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={closeRotaDialog}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Nome *</Label>
                    <Input value={rotaForm.nome} onChange={e => setRotaForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Rota Centro" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Input value={rotaForm.descricao} onChange={e => setRotaForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Opcional" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label>Horário Ida</Label>
                      <Input type="time" value={rotaForm.horario_ida} onChange={e => setRotaForm(f => ({ ...f, horario_ida: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Horário Volta</Label>
                      <Input type="time" value={rotaForm.horario_volta} onChange={e => setRotaForm(f => ({ ...f, horario_volta: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Motorista</Label>
                    <Select value={rotaForm.motorista_id} onValueChange={v => setRotaForm(f => ({ ...f, motorista_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {motoristas.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Veículo</Label>
                    <Select value={rotaForm.veiculo_id} onValueChange={v => setRotaForm(f => ({ ...f, veiculo_id: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {veiculos.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.modelo} · {v.placa}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="outline" onClick={closeRotaDialog}>Cancelar</Button>
                  <Button onClick={salvarRota} disabled={savingRota}>
                    {savingRota ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </motion.div>
      </motion.div>
    )}
    </>
  );
}
