import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, PowerOff, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const PLANO_BADGE = {
  starter:      { label: 'Starter',      className: 'bg-slate-100 text-slate-700' },
  profissional: { label: 'Profissional', className: 'bg-primary/10 text-primary' },
  enterprise:   { label: 'Enterprise',   className: 'bg-amber-100 text-amber-700' },
};

const EMPTY_FORM = { nome: '', cnpj: '', email: '', telefone: '', plano: 'starter' };

export default function SuperAdminEmpresas() {
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [dialog, setDialog]     = useState({ open: false, editing: null });
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.entities.Empresa.filter({});
      setEmpresas(data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setDialog({ open: true, editing: null }); };
  const openEdit   = (e)  => { setForm(e);         setDialog({ open: true, editing: e.id  }); };
  const closeDialog = ()  => setDialog({ open: false, editing: null });

  const handleSave = async () => {
    if (!form.nome?.trim()) { toast.error('Nome da empresa é obrigatório.'); return; }
    setSaving(true);
    try {
      if (dialog.editing) {
        await api.entities.Empresa.update(dialog.editing, form);
        toast.success('Empresa atualizada!');
      } else {
        await api.entities.Empresa.create(form);
        toast.success('Empresa criada!');
      }
      closeDialog();
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAtivo = async (empresa) => {
    try {
      if (empresa.ativo) {
        await api.entities.Empresa.delete(empresa.id);
        toast.success('Empresa desativada.');
      } else {
        await api.entities.Empresa.update(empresa.id, { ativo: true });
        toast.success('Empresa reativada!');
      }
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Empresas</h1>
          <p className="text-muted-foreground text-sm mt-1">{empresas.length} empresa(s) cadastradas</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Empresa
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : empresas.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhuma empresa cadastrada.</p>
              <Button variant="outline" className="mt-4" onClick={openCreate}>Criar primeira empresa</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map(e => {
                  const plano = PLANO_BADGE[e.plano] || { label: e.plano, className: '' };
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{e.cnpj || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{e.email || '—'}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${plano.className}`}>
                          {plano.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={e.ativo ? 'default' : 'secondary'}>
                          {e.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(e.created_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(e)} title="Editar">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAtivo(e)}
                            title={e.ativo ? 'Desativar' : 'Reativar'}
                            className={e.ativo ? 'text-destructive hover:text-destructive' : 'text-emerald-600 hover:text-emerald-600'}
                          >
                            <PowerOff className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criar/editar */}
      <Dialog open={dialog.open} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.editing ? 'Editar Empresa' : 'Nova Empresa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={form.nome || ''} onChange={e => f('nome', e.target.value)} placeholder="Nome da empresa" />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input value={form.cnpj || ''} onChange={e => f('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={form.email || ''} onChange={e => f('email', e.target.value)} placeholder="contato@empresa.com" type="email" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone || ''} onChange={e => f('telefone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={form.plano || 'starter'} onValueChange={v => f('plano', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter — R$ 99/mês</SelectItem>
                  <SelectItem value="profissional">Profissional — R$ 249/mês</SelectItem>
                  <SelectItem value="enterprise">Enterprise — R$ 599/mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
