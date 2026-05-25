import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, PowerOff, Layers, Eye } from 'lucide-react';
import { toast } from 'sonner';
import FrotaDetalhesSheet from './FrotaDetalhesSheet';

export default function EmpresaFrotas({ session }) {
  const empresaId = session?.empresa_id;
  const isMotorista = session?.role === 'motorista';
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedFleet, setSelectedFleet] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isMotorista) {
        // Descobre a frota do motorista via suas rotas
        const [todosMot, todasFrotas, todasRotas] = await Promise.all([
          api.entities.Motorista.filter({ empresa_id: empresaId }),
          api.entities.Frota.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
        ]);
        const meuMot = todosMot.find(m => m.usuario_id === session.id);
        if (meuMot) {
          const minhasRotas = todasRotas.filter(r => r.motorista_id === meuMot.id);
          const frotaIds = [...new Set(minhasRotas.map(r => r.frota_id).filter(Boolean))];
          setItems(todasFrotas.filter(f => frotaIds.includes(f.id)));
        } else {
          setItems([]);
        }
      } else {
        const data = await api.entities.Frota.filter({ empresa_id: empresaId });
        setItems(data);
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (empresaId) load(); }, [empresaId]);

  const openCreate = () => { setForm({ nome: '' }); setDialog({ open: true, editing: null }); };
  const openEdit   = (i)  => { setForm(i);           setDialog({ open: true, editing: i.id  }); };
  const close      = ()   => setDialog({ open: false, editing: null });

  const handleSave = async () => {
    if (!form.nome?.trim()) { toast.error('Nome é obrigatório.'); return; }
    setSaving(true);
    try {
      if (dialog.editing) {
        await api.entities.Frota.update(dialog.editing, { nome: form.nome });
        toast.success('Frota atualizada!');
      } else {
        await api.entities.Frota.create({ nome: form.nome, empresa_id: empresaId });
        toast.success('Frota criada!');
      }
      close(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const toggleAtivo = async (item) => {
    try {
      if (item.ativo) {
        await api.entities.Frota.delete(item.id);
        toast.success('Frota desativada.');
      } else {
        await api.entities.Frota.update(item.id, { ativo: true });
        toast.success('Frota reativada!');
      }
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Frotas</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} frota(s){isMotorista ? ' vinculada(s) a você' : ''}</p>
        </div>
        {!isMotorista && (
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Nova Frota</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Layers className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isMotorista ? 'Você não está vinculado a nenhuma frota.' : 'Nenhuma frota cadastrada.'}</p>
              {!isMotorista && (
                <Button variant="outline" className="mt-4" onClick={openCreate}>Criar primeira frota</Button>
              )}
            </div>
          ) : (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Veículos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  {!isMotorista && <TableHead className="w-24">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{i.total_veiculos ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={i.ativo ? 'default' : 'secondary'}>{i.ativo ? 'Ativa' : 'Inativa'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(i.created_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    {!isMotorista && (
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedFleet(i); setDetailOpen(true); }} title="Gerenciar detalhes">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                          <Button
                            variant="ghost" size="icon"
                            className={i.ativo ? 'text-destructive hover:text-destructive' : 'text-emerald-600 hover:text-emerald-600'}
                            onClick={() => toggleAtivo(i)}
                          >
                            <PowerOff className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={close}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{dialog.editing ? 'Editar Frota' : 'Nova Frota'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome || ''} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Frota Centro" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FrotaDetalhesSheet
        frota={selectedFleet}
        empresaId={empresaId}
        open={detailOpen}
        onClose={(refetch) => {
          setDetailOpen(false);
          setSelectedFleet(null);
          if (refetch) load();
        }}
      />
    </div>
  );
}
