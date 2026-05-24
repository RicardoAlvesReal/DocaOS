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
import { Plus, Pencil, FileText } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE = {
  ativo:     { label: 'Ativo',     className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
  pendente:  { label: 'Pendente',  className: 'bg-amber-500/15 text-amber-600 border-amber-500/20'    },
  suspenso:  { label: 'Suspenso',  className: 'bg-red-500/15 text-red-600 border-red-500/20'          },
  cancelado: { label: 'Cancelado', className: 'bg-secondary text-muted-foreground border-border'       },
};

const EMPTY = { passageiro_id: '', rota_id: '', valor_mensal: '', data_inicio: '', status: 'ativo' };

export default function EmpresaContratos({ session }) {
  const empresaId = session?.empresa_id;
  const isPassageiro = session?.role === 'passageiro';
  const [passageiros, setPassageiros] = useState([]);
  const [rotas, setRotas]             = useState([]);
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isPassageiro) {
        const [todosPas, todosCon, todasRotas] = await Promise.all([
          api.entities.Passageiro.filter({ empresa_id: empresaId }),
          api.entities.Contrato.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
        ]);
        const meuPas = todosPas.find(p => p.usuario_id === session.id);
        if (meuPas) {
          setItems(todosCon.filter(c => c.passageiro_id === meuPas.id));
        } else {
          setItems([]);
        }
        setPassageiros(todosPas);
        setRotas(todasRotas);
      } else {
        const [data, pass, rot] = await Promise.all([
          api.entities.Contrato.filter({ empresa_id: empresaId }),
          api.entities.Passageiro.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
        ]);
        setItems(data);
        setPassageiros(pass);
        setRotas(rot);
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
    if (!form.passageiro_id || !form.rota_id || !form.valor_mensal || !form.data_inicio) {
      toast.error('Preencha passageiro, rota, valor e data de início.'); return;
    }
    setSaving(true);
    try {
      const payload = {
        passageiro_id: form.passageiro_id,
        rota_id: form.rota_id,
        valor_mensal: parseFloat(form.valor_mensal),
        data_inicio: form.data_inicio,
        status: form.status,
      };
      if (dialog.editing) {
        await api.entities.Contrato.update(dialog.editing, { valor_mensal: payload.valor_mensal, status: payload.status });
        toast.success('Contrato atualizado!');
      } else {
        await api.entities.Contrato.create(payload);
        toast.success('Contrato criado!');
      }
      close(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isPassageiro ? 'Meus Contratos' : 'Contratos'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} contrato(s)</p>
        </div>
        {!isPassageiro && (
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Novo Contrato</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isPassageiro ? 'Você não possui contratos.' : 'Nenhum contrato cadastrado.'}</p>
              {!isPassageiro && (
                <Button variant="outline" className="mt-4" onClick={openCreate}>Criar contrato</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Passageiro</TableHead>
                    <TableHead>Rota</TableHead>
                    <TableHead>Valor Mensal</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Status</TableHead>
                    {!isPassageiro && <TableHead className="w-20">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(i => {
                    const sb = STATUS_BADGE[i.status] || { label: i.status, className: '' };
                    const pass = passageiros.find(p => p.id === i.passageiro_id);
                    const rota = rotas.find(r => r.id === i.rota_id);
                    return (
                      <TableRow key={i.id}>
                        <TableCell className="font-medium">{i.passageiro_nome || pass?.nome || pass?.usuario_nome || '—'}</TableCell>
                        <TableCell className="text-sm">{i.rota_nome || rota?.nome || '—'}</TableCell>
                        <TableCell className="font-medium">
                          {Number(i.valor_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(i.data_inicio).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${sb.className}`}>{sb.label}</span>
                        </TableCell>
                        {!isPassageiro && (
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
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
          <DialogHeader><DialogTitle>{dialog.editing ? 'Editar Contrato' : 'Novo Contrato'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {!dialog.editing && (
              <>
                <div className="space-y-1.5">
                  <Label>Passageiro *</Label>
                  <Select value={form.passageiro_id || ''} onValueChange={v => f('passageiro_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione o passageiro" /></SelectTrigger>
                    <SelectContent>
                      {passageiros.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nome || p.usuario_nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Rota *</Label>
                  <Select value={form.rota_id || ''} onValueChange={v => f('rota_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione a rota" /></SelectTrigger>
                    <SelectContent>
                      {rotas.map(r => <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Início *</Label>
                  <Input type="date" value={form.data_inicio} onChange={e => f('data_inicio', e.target.value)} />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Valor Mensal (R$) *</Label>
              <Input type="number" step="0.01" value={form.valor_mensal || ''} onChange={e => f('valor_mensal', e.target.value)} placeholder="250.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status || 'ativo'} onValueChange={v => f('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
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
