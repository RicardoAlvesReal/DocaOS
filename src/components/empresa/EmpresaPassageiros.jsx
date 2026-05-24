import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, UserMinus, Users } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = { nome: '', email: '', senha: '', cpf: '', telefone: '', endereco: '' };

export default function EmpresaPassageiros({ session }) {
  const empresaId = session?.empresa_id;
  const isMotorista = session?.role === 'motorista';
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.entities.Passageiro.filter({ empresa_id: empresaId });
      setItems(data);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (empresaId) load(); }, [empresaId]);

  const openCreate = () => { setForm(EMPTY); setDialog({ open: true, editing: null }); };
  const openEdit   = (i)  => { setForm(i);   setDialog({ open: true, editing: i.id  }); };
  const close      = ()   => setDialog({ open: false, editing: null });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome || !form.email) { toast.error('Nome e e-mail são obrigatórios.'); return; }
    if (!dialog.editing && !form.senha) { toast.error('Senha é obrigatória para novo passageiro.'); return; }
    setSaving(true);
    try {
      if (dialog.editing) {
        await api.entities.Passageiro.update(dialog.editing, {
          cpf: form.cpf, telefone: form.telefone, endereco: form.endereco,
        });
        toast.success('Passageiro atualizado!');
      } else {
        await api.entities.Passageiro.create({
          nome: form.nome, email: form.email, senha: form.senha,
          cpf: form.cpf, telefone: form.telefone, endereco: form.endereco,
          empresa_id: empresaId,
        });
        toast.success('Passageiro cadastrado!');
      }
      close(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    try {
      await api.entities.Passageiro.delete(item.id);
      toast.success('Passageiro desativado.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Passageiros</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} passageiro(s)</p>
        </div>
        {!isMotorista && (
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Novo Passageiro</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum passageiro cadastrado.</p>
              {!isMotorista && (
                <Button variant="outline" className="mt-4" onClick={openCreate}>Cadastrar passageiro</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Endereço</TableHead>
                    {!isMotorista && <TableHead className="w-24">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.nome || i.usuario_nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{i.email || i.usuario_email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{i.telefone || '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{i.cpf || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate">{i.endereco || '—'}</TableCell>
                      {!isMotorista && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(i)}>
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog.open} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dialog.editing ? 'Editar Passageiro' : 'Novo Passageiro'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {!dialog.editing && (
              <>
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="passageiro@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha *</Label>
                  <Input type="password" value={form.senha} onChange={e => f('senha', e.target.value)} placeholder="Senha de acesso" />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={form.cpf || ''} onChange={e => f('cpf', e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.telefone || ''} onChange={e => f('telefone', e.target.value)} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={form.endereco || ''} onChange={e => f('endereco', e.target.value)} placeholder="Rua, número, bairro" />
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
