import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Route, Users, X } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY      = { nome: '', frota_id: '', descricao: '', motorista_id: '', veiculo_id: '' };
const EMPTY_PASS = { passageiro_id: '', valor_mensal: '', data_inicio: '' };

export default function EmpresaRotas({ session }) {
  const empresaId = session?.empresa_id;
  const isMotorista = session?.role === 'motorista';
  const isPassageiro = session?.role === 'passageiro';
  const isReadOnly   = isMotorista || isPassageiro;
  const [frotas, setFrotas] = useState([]);
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving]           = useState(false);
  const [motoristas, setMotoristas]     = useState([]);
  const [veiculos, setVeiculos]         = useState([]);
  const [passageiros, setPassageiros]   = useState([]);
  const [contratos, setContratos]       = useState([]);
  const [passDialog, setPassDialog]     = useState({ open: false, rotaId: null });
  const [passForm, setPassForm]         = useState(EMPTY_PASS);
  const [savingPass, setSavingPass]     = useState(false);
  const [addingPass, setAddingPass]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isMotorista) {
        // Motorista vê apenas as rotas atribuídas a ele
        const [todosMot, todasRotas, todasFrotas] = await Promise.all([
          api.entities.Motorista.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
          api.entities.Frota.filter({ empresa_id: empresaId }),
        ]);
        const meuMot = todosMot.find(m => m.usuario_id === session.id);
        if (meuMot) {
          setItems(todasRotas.filter(r => r.motorista_id === meuMot.id));
        } else {
          setItems([]);
        }
        setFrotas(todasFrotas.filter(f => f.ativo));
      } else if (isPassageiro) {
        // Passageiro vê apenas as rotas dos seus contratos
        const [todosPas, todasRotas, todasFrotas, todosCon] = await Promise.all([
          api.entities.Passageiro.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
          api.entities.Frota.filter({ empresa_id: empresaId }),
          api.entities.Contrato.filter({ empresa_id: empresaId }),
        ]);
        const meuPas = todosPas.find(p => p.usuario_id === session.id);
        if (meuPas) {
          const meusContratos = todosCon.filter(c => c.passageiro_id === meuPas.id);
          const rotaIds = meusContratos.map(c => c.rota_id).filter(Boolean);
          setItems(todasRotas.filter(r => rotaIds.includes(r.id)));
        } else {
          setItems([]);
        }
        setFrotas(todasFrotas.filter(f => f.ativo));
      } else {
        const [data, fr, mots, veics, pass, cons] = await Promise.all([
          api.entities.Rota.filter({ empresa_id: empresaId }),
          api.entities.Frota.filter({ empresa_id: empresaId }),
          api.entities.Motorista.filter({ empresa_id: empresaId }),
          api.entities.Veiculo.filter({ empresa_id: empresaId }),
          api.entities.Passageiro.filter({ empresa_id: empresaId }),
          api.entities.Contrato.filter({ empresa_id: empresaId }),
        ]);
        setItems(data);
        setFrotas(fr.filter(f => f.ativo));
        setMotoristas(mots);
        setVeiculos(veics);
        setPassageiros(pass);
        setContratos(cons);
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (empresaId) load(); }, [empresaId]);

  const openCreate = () => { setForm(EMPTY); setDialog({ open: true, editing: null }); };
  const openEdit   = (i)  => { setForm(i);   setDialog({ open: true, editing: i.id  }); };
  const close      = ()   => setDialog({ open: false, editing: null });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome || !form.frota_id) { toast.error('Nome e frota são obrigatórios.'); return; }
    setSaving(true);
    try {
      const payload = {
        nome: form.nome,
        frota_id: form.frota_id,
        descricao: form.descricao,
        motorista_id: form.motorista_id || null,
        veiculo_id: form.veiculo_id || null,
      };
      if (dialog.editing) {
        await api.entities.Rota.update(dialog.editing, payload);
        toast.success('Rota atualizada!');
      } else {
        await api.entities.Rota.create(payload);
        toast.success('Rota criada!');
      }
      close(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    try {
      await api.entities.Rota.delete(item.id);
      toast.success('Rota removida.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  // Passageiros dialog helpers
  const passDialogRota        = passDialog.rotaId ? items.find(r => r.id === passDialog.rotaId) : null;
  const passDialogContratos   = passDialog.rotaId
    ? contratos.filter(c => c.rota_id === passDialog.rotaId && c.status !== 'cancelado')
    : [];
  const passDialogPassIds     = passDialogContratos.map(c => c.passageiro_id);
  const unassignedPassageiros = passageiros.filter(p => !passDialogPassIds.includes(p.id));

  const closePassDialog = () => { setPassDialog({ open: false, rotaId: null }); setAddingPass(false); setPassForm(EMPTY_PASS); };

  const handleAddPassageiro = async () => {
    if (!passForm.passageiro_id || !passForm.valor_mensal || !passForm.data_inicio) {
      toast.error('Preencha passageiro, valor e data de início.'); return;
    }
    setSavingPass(true);
    try {
      await api.entities.Contrato.create({
        passageiro_id: passForm.passageiro_id,
        rota_id: passDialog.rotaId,
        valor_mensal: parseFloat(passForm.valor_mensal),
        data_inicio: passForm.data_inicio,
        status: 'ativo',
      });
      toast.success('Passageiro atribuído à rota!');
      setPassForm(EMPTY_PASS);
      setAddingPass(false);
      load();
    } catch (e) { toast.error(e.message); }
    finally { setSavingPass(false); }
  };

  const handleRemovePassageiro = async (contrato) => {
    try {
      await api.entities.Contrato.update(contrato.id, { status: 'cancelado' });
      toast.success('Passageiro removido da rota.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rotas</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} rota(s){isMotorista ? ' atribuída(s) a você' : isPassageiro ? ' dos seus contratos' : ''}</p>
        </div>
        {!isReadOnly && (
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Nova Rota</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Route className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isMotorista ? 'Você não está atribuído a nenhuma rota.' : isPassageiro ? 'Nenhuma rota atribuída aos seus contratos.' : 'Nenhuma rota cadastrada.'}</p>
              {!isReadOnly && (
                <Button variant="outline" className="mt-4" onClick={openCreate}>Criar rota</Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Frota</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead className="text-center w-20">Passageiros</TableHead>
                  {!isReadOnly && <TableHead className="w-28">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(i => {
                  const frota = frotas.find(fr => fr.id === i.frota_id);
                  return (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.nome}</TableCell>
                      <TableCell className="text-sm">{i.frota_nome || frota?.nome || '—'}</TableCell>
                      <TableCell className="text-sm">
                        {i.motorista_nome || <span className="text-muted-foreground/50 italic text-xs">Nenhum</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        {i.modelo ? `${i.modelo} (${i.placa})` : i.placa || <span className="text-muted-foreground/50 italic text-xs">Nenhum</span>}
                      </TableCell>
                      <TableCell className="text-sm text-center">{i.total_passageiros ?? 0}</TableCell>
                      {!isReadOnly && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Gerenciar passageiros" onClick={() => setPassDialog({ open: true, rotaId: i.id })}>
                              <Users className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(i)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dialog.editing ? 'Editar Rota' : 'Nova Rota'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Ex: Rota Centro-Norte" />
            </div>
            <div className="space-y-1.5">
              <Label>Frota *</Label>
              <Select value={form.frota_id || ''} onValueChange={v => f('frota_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a frota" /></SelectTrigger>
                <SelectContent>
                  {frotas.map(fr => <SelectItem key={fr.id} value={fr.id}>{fr.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Motorista</Label>
                <Select value={form.motorista_id || '__none__'} onValueChange={v => f('motorista_id', v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Nenhum —</SelectItem>
                    {motoristas.map(m => <SelectItem key={m.id} value={m.id}>{m.nome || m.usuario_nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Veículo</Label>
                <Select value={form.veiculo_id || '__none__'} onValueChange={v => f('veiculo_id', v === '__none__' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Nenhum —</SelectItem>
                    {veiculos.map(v => <SelectItem key={v.id} value={v.id}>{v.modelo ? `${v.modelo} (${v.placa})` : v.placa}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.descricao || ''} onChange={e => f('descricao', e.target.value)} placeholder="Pontos de parada, horários..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Gerenciamento de Passageiros da Rota */}
      <Dialog open={passDialog.open} onOpenChange={closePassDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Passageiros — {passDialogRota?.nome || '...'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {passDialogContratos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">Nenhum passageiro atribuído a esta rota.</p>
            ) : (
              <div className="border rounded-md divide-y max-h-52 overflow-y-auto">
                {passDialogContratos.map(c => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{c.passageiro_nome || '—'}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(c.valor_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / mês · Início {new Date(c.data_inicio).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      title="Remover da rota"
                      onClick={() => handleRemovePassageiro(c)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {addingPass ? (
              <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                <p className="text-sm font-semibold">Adicionar passageiro</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Passageiro *</Label>
                  <Select
                    value={passForm.passageiro_id || ''}
                    onValueChange={v => setPassForm(p => ({ ...p, passageiro_id: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione o passageiro" /></SelectTrigger>
                    <SelectContent>
                      {unassignedPassageiros.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome || p.usuario_nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor Mensal (R$) *</Label>
                    <Input
                      className="h-8 text-sm" type="number" step="0.01" placeholder="250.00"
                      value={passForm.valor_mensal}
                      onChange={e => setPassForm(p => ({ ...p, valor_mensal: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Data de Início *</Label>
                    <Input
                      className="h-8 text-sm" type="date"
                      value={passForm.data_inicio}
                      onChange={e => setPassForm(p => ({ ...p, data_inicio: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => { setAddingPass(false); setPassForm(EMPTY_PASS); }}>Cancelar</Button>
                  <Button size="sm" onClick={handleAddPassageiro} disabled={savingPass}>{savingPass ? 'Salvando...' : 'Confirmar'}</Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline" className="w-full gap-2"
                onClick={() => setAddingPass(true)}
                disabled={unassignedPassageiros.length === 0}
              >
                <Plus className="w-4 h-4" />
                {unassignedPassageiros.length === 0 ? 'Todos os passageiros já estão nesta rota' : 'Adicionar Passageiro'}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePassDialog}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
