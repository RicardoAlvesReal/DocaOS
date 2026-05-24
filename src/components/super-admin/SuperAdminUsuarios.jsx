import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, Plus, MoreHorizontal, KeyRound, Trash2, Eye, EyeOff, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = [
  { value: 'admin',      label: 'Admin'      },
  { value: 'sub_admin',  label: 'Sub-Admin'  },
  { value: 'motorista',  label: 'Motorista'  },
  { value: 'passageiro', label: 'Passageiro' },
];

const ROLE_BADGE = {
  super_admin: { label: 'Super Admin', className: 'bg-purple-100 text-purple-700' },
  admin:       { label: 'Admin',       className: 'bg-primary/10 text-primary'    },
  sub_admin:   { label: 'Sub-Admin',   className: 'bg-blue-100 text-blue-700'     },
  motorista:   { label: 'Motorista',   className: 'bg-emerald-100 text-emerald-700' },
  passageiro:  { label: 'Passageiro',  className: 'bg-amber-100 text-amber-700'   },
};

const FORM_INIT = { nome: '', email: '', senha: '', role: 'admin', empresa_id: '' };

export default function SuperAdminUsuarios() {
  const [empresas, setEmpresas]   = useState([]);
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtroEmpresa, setFiltroEmpresa] = useState('__all__');
  const [filtroRole, setFiltroRole]       = useState('__all__');

  const [showCreate, setShowCreate]       = useState(false);
  const [form, setForm]                   = useState(FORM_INIT);
  const [showSenha, setShowSenha]         = useState(false);
  const [saving, setSaving]               = useState(false);

  const [resetTarget, setResetTarget]     = useState(null);
  const [novaSenha, setNovaSenha]         = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [resetting, setResetting]         = useState(false);

  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);

  const [togglingId, setTogglingId]       = useState(null);

  useEffect(() => {
    api.entities.Empresa.filter({}).then(setEmpresas).catch(console.error);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtroEmpresa && filtroEmpresa !== '__all__') params.empresa_id = filtroEmpresa;
      const res = await fetch(`/api/usuarios?${new URLSearchParams(params)}`);
      if (res.ok) setItems(await res.json());
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filtroEmpresa]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = filtroRole && filtroRole !== '__all__'
    ? items.filter(u => u.role === filtroRole)
    : items;

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        nome:       form.nome.trim(),
        email:      form.email.trim(),
        senha:      form.senha,
        role:       form.role,
        empresa_id: form.empresa_id || null,
      };
      const res = await fetch('/api/usuarios', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Usuario criado com sucesso.');
      setShowCreate(false);
      setForm(FORM_INIT);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      const res = await fetch(`/api/usuarios/${resetTarget.id}/reset-senha`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nova_senha: novaSenha }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Senha de ${resetTarget.nome} redefinida.`);
      setResetTarget(null);
      setNovaSenha('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleToggleAtivo = async (u) => {
    setTogglingId(u.id);
    try {
      const res = await fetch(`/api/usuarios/${u.id}/toggle-ativo`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${u.nome} ${data.ativo ? 'ativado' : 'desativado'} com sucesso.`);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/usuarios/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Usuario ${deleteTarget.nome} excluido.`);
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">Todos os usuarios da plataforma</p>
        </div>
        <Button onClick={() => { setForm(FORM_INIT); setShowCreate(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Novo Usuario
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={filtroEmpresa} onValueChange={setFiltroEmpresa}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Todas as empresas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas as empresas</SelectItem>
            {empresas.map(e => (
              <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filtroRole} onValueChange={setFiltroRole}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos os roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos os roles</SelectItem>
            {Object.entries(ROLE_BADGE).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum usuario encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => {
                  const rb = ROLE_BADGE[u.role] || { label: u.role, className: '' };
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${rb.className}`}>
                          {rb.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{u.empresa_nome || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={u.ativo ? 'default' : 'secondary'}>
                          {u.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(u.created_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => { setResetTarget({ id: u.id, nome: u.nome }); setNovaSenha(''); setShowNovaSenha(false); }}
                            >
                              <KeyRound className="w-4 h-4 mr-2" /> Resetar senha
                            </DropdownMenuItem>
                            {u.role !== 'super_admin' && (
                              <DropdownMenuItem
                                disabled={togglingId === u.id}
                                onClick={() => handleToggleAtivo(u)}
                              >
                                {u.ativo
                                  ? <><PowerOff className="w-4 h-4 mr-2 text-amber-500" /> Desativar</>
                                  : <><Power    className="w-4 h-4 mr-2 text-emerald-500" /> Ativar</>}
                              </DropdownMenuItem>
                            )}
                            {u.role !== 'super_admin' && (
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeleteTarget({ id: u.id, nome: u.nome })}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-1">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" required />
            </div>
            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" required />
            </div>
            <div className="space-y-1">
              <Label>Senha</Label>
              <div className="relative">
                <Input
                  type={showSenha ? 'text' : 'password'}
                  value={form.senha}
                  onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                  placeholder="Senha inicial"
                  required
                  minLength={4}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowSenha(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Empresa <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Select value={form.empresa_id || '__none__'} onValueChange={v => setForm(f => ({ ...f, empresa_id: v === '__none__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={open => !open && setResetTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReset} className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground">
              Defina uma nova senha para <span className="font-semibold text-foreground">{resetTarget?.nome}</span>.
            </p>
            <div className="space-y-1">
              <Label>Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showNovaSenha ? 'text' : 'password'}
                  value={novaSenha}
                  onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Minimo 4 caracteres"
                  required
                  minLength={4}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNovaSenha(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNovaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setResetTarget(null)}>Cancelar</Button>
              <Button type="submit" disabled={resetting}>{resetting ? 'Salvando...' : 'Redefinir'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <span className="font-semibold">{deleteTarget?.nome}</span>? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}