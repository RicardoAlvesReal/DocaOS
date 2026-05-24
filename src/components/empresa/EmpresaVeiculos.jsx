import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, PowerOff, Truck } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE = {
  ativo:       { label: 'Ativo',       variant: 'default'   },
  manutencao:  { label: 'Manutenção',  variant: 'secondary' },
  inativo:     { label: 'Inativo',     variant: 'outline'   },
};

const EMPTY = { placa: '', modelo: '', ano: '', capacidade: '', frota_id: '', status: 'ativo' };

export default function EmpresaVeiculos({ session }) {
  const empresaId = session?.empresa_id;
  const isMotorista = session?.role === 'motorista';
  const isPassageiro = session?.role === 'passageiro';
  const isReadOnly   = isMotorista || isPassageiro;
  const [frotas, setFrotas] = useState([]);
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isMotorista) {
        // Descobre os veículos do motorista via suas rotas
        const [todosMot, todosVeic, todasFrotas, todasRotas] = await Promise.all([
          api.entities.Motorista.filter({ empresa_id: empresaId }),
          api.entities.Veiculo.filter({ empresa_id: empresaId }),
          api.entities.Frota.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
        ]);
        const meuMot = todosMot.find(m => m.usuario_id === session.id);
        if (meuMot) {
          const minhasRotas = todasRotas.filter(r => r.motorista_id === meuMot.id);
          const veiculoIds = [...new Set(minhasRotas.map(r => r.veiculo_id).filter(Boolean))];
          setItems(todosVeic.filter(v => veiculoIds.includes(v.id)));
        } else {
          setItems([]);
        }
        setFrotas(todasFrotas.filter(f => f.ativo));
      } else if (isPassageiro) {
        // Descobre os veículos via contratos do passageiro
        const [todosPas, todosVeic, todasFrotas, todasRotas, todosCon] = await Promise.all([
          api.entities.Passageiro.filter({ empresa_id: empresaId }),
          api.entities.Veiculo.filter({ empresa_id: empresaId }),
          api.entities.Frota.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
          api.entities.Contrato.filter({ empresa_id: empresaId }),
        ]);
        const meuPas = todosPas.find(p => p.usuario_id === session.id);
        if (meuPas) {
          const meusContratos = todosCon.filter(c => c.passageiro_id === meuPas.id);
          const minhasRotaIds = meusContratos.map(c => c.rota_id).filter(Boolean);
          const minhasRotas = todasRotas.filter(r => minhasRotaIds.includes(r.id));
          const veiculoIds = [...new Set(minhasRotas.map(r => r.veiculo_id).filter(Boolean))];
          setItems(todosVeic.filter(v => veiculoIds.includes(v.id)));
        } else {
          setItems([]);
        }
        setFrotas(todasFrotas.filter(f => f.ativo));
      } else {
        const [data, fr] = await Promise.all([
          api.entities.Veiculo.filter({ empresa_id: empresaId }),
          api.entities.Frota.filter({ empresa_id: empresaId }),
        ]);
        setItems(data);
        setFrotas(fr.filter(f => f.ativo));
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (empresaId) load(); }, [empresaId]);

  const openCreate = () => { setForm(EMPTY);  setDialog({ open: true, editing: null }); };
  const openEdit   = (i)  => { setForm(i);    setDialog({ open: true, editing: i.id  }); };
  const close      = ()   => setDialog({ open: false, editing: null });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.placa || !form.modelo || !form.frota_id) {
      toast.error('Placa, modelo e frota são obrigatórios.'); return;
    }
    setSaving(true);
    try {
      const payload = { placa: form.placa.toUpperCase(), modelo: form.modelo, ano: form.ano || null, capacidade: form.capacidade || null, frota_id: form.frota_id, status: form.status };
      if (dialog.editing) {
        await api.entities.Veiculo.update(dialog.editing, payload);
        toast.success('Veículo atualizado!');
      } else {
        await api.entities.Veiculo.create(payload);
        toast.success('Veículo cadastrado!');
      }
      close(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    try {
      await api.entities.Veiculo.delete(item.id);
      toast.success('Veículo inativado.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Veículos</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} veículo(s){isMotorista ? ' vinculado(s) a você' : isPassageiro ? ' na sua rota' : ''}</p>
        </div>
        {!isReadOnly && (
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Novo Veículo</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isMotorista ? 'Você não está vinculado a nenhum veículo.' : isPassageiro ? 'Nenhum veículo atribuído à sua rota.' : 'Nenhum veículo cadastrado.'}</p>
              {!isReadOnly && (
                <Button variant="outline" className="mt-4" onClick={openCreate}>Cadastrar veículo</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Ano</TableHead>
                    <TableHead>Capacidade</TableHead>
                    <TableHead>Frota</TableHead>
                    <TableHead>Status</TableHead>
                    {!isReadOnly && <TableHead className="w-24">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(i => {
                    const sb = STATUS_BADGE[i.status] || { label: i.status, variant: 'secondary' };
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="font-mono font-semibold">{i.placa}</TableCell>
                        <TableCell>{i.modelo}</TableCell>
                        <TableCell className="text-muted-foreground">{i.ano || '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{i.capacidade ? `${i.capacidade} pass.` : '—'}</TableCell>
                        <TableCell className="text-sm">{i.frota_nome || frotas.find(f => f.id === i.frota_id)?.nome || '—'}</TableCell>
                        <TableCell><Badge variant={sb.variant}>{sb.label}</Badge></TableCell>
                        {!isReadOnly && (
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(i)}>
                                <PowerOff className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dialog.editing ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Frota *</Label>
              <Select value={form.frota_id || ''} onValueChange={v => f('frota_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione a frota" /></SelectTrigger>
                <SelectContent>
                  {frotas.map(fr => <SelectItem key={fr.id} value={fr.id}>{fr.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Placa *</Label>
              <Input value={form.placa || ''} onChange={e => f('placa', e.target.value.toUpperCase())} placeholder="ABC-1234" className="uppercase" />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo *</Label>
              <Input value={form.modelo || ''} onChange={e => f('modelo', e.target.value)} placeholder="Ex: Mercedes Sprinter" />
            </div>
            <div className="space-y-1.5">
              <Label>Ano</Label>
              <Input type="number" value={form.ano || ''} onChange={e => f('ano', e.target.value)} placeholder="2023" />
            </div>
            <div className="space-y-1.5">
              <Label>Capacidade</Label>
              <Input type="number" value={form.capacidade || ''} onChange={e => f('capacidade', e.target.value)} placeholder="15" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Status</Label>
              <Select value={form.status || 'ativo'} onValueChange={v => f('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
