import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, UserMinus, UserCheck, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import AtribuicoesMotoristaSheet from './AtribuicoesMotoristaSheet';

const EMPTY = { nome: '', email: '', senha: '', cnh: '', cnh_validade: '', telefone: '' };

export default function EmpresaMotoristas({ session }) {
  const empresaId = session?.empresa_id;
  const isPassageiro = session?.role === 'passageiro';
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ open: false, editing: null });
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [atribuicoes, setAtribuicoes] = useState({ open: false, motorista: null });

  const openAtribuicoes = (m) => setAtribuicoes({ open: true, motorista: m });
  const closeAtribuicoes = () => setAtribuicoes({ open: false, motorista: null });

  const load = async () => {
    setLoading(true);
    try {
      if (isPassageiro) {
        // Passageiro vê apenas o(s) motorista(s) das suas rotas
        const [todosPas, todosMot, todosCon, todasRotas] = await Promise.all([
          api.entities.Passageiro.filter({ empresa_id: empresaId }),
          api.entities.Motorista.filter({ empresa_id: empresaId }),
          api.entities.Contrato.filter({ empresa_id: empresaId }),
          api.entities.Rota.filter({ empresa_id: empresaId }),
        ]);
        const meuPas = todosPas.find(p => p.usuario_id === session.id);
        if (meuPas) {
          const meusContratos = todosCon.filter(c => c.passageiro_id === meuPas.id);
          const minhasRotaIds = meusContratos.map(c => c.rota_id).filter(Boolean);
          const minhasRotas = todasRotas.filter(r => minhasRotaIds.includes(r.id));
          const motoristasIds = [...new Set(minhasRotas.map(r => r.motorista_id).filter(Boolean))];
          setItems(todosMot.filter(m => motoristasIds.includes(m.id)));
        } else {
          setItems([]);
        }
      } else {
        const data = await api.entities.Motorista.filter({ empresa_id: empresaId });
        setItems(data);
      }
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (empresaId) load(); }, [empresaId]);

  const openCreate = () => { setForm(EMPTY);    setDialog({ open: true, editing: null }); };
  const openEdit   = (i)  => { setForm(i);      setDialog({ open: true, editing: i.id  }); };
  const close      = ()   => setDialog({ open: false, editing: null });
  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.nome || !form.email) { toast.error('Nome e e-mail são obrigatórios.'); return; }
    if (!dialog.editing && !form.senha) { toast.error('Senha é obrigatória para novo motorista.'); return; }
    setSaving(true);
    try {
      if (dialog.editing) {
        await api.entities.Motorista.update(dialog.editing, {
          cnh: form.cnh, cnh_validade: form.cnh_validade || null, telefone: form.telefone,
        });
        toast.success('Motorista atualizado!');
      } else {
        await api.entities.Motorista.create({
          nome: form.nome, email: form.email, senha: form.senha,
          cnh: form.cnh, cnh_validade: form.cnh_validade || null,
          telefone: form.telefone, empresa_id: empresaId,
        });
        toast.success('Motorista cadastrado!');
      }
      close(); load();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    try {
      await api.entities.Motorista.delete(item.id);
      toast.success('Motorista desativado.');
      load();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isPassageiro ? 'Meu Motorista' : 'Motoristas'}</h1>
          <p className="text-muted-foreground text-sm mt-1">{items.length} motorista(s){isPassageiro ? ' na sua rota' : ''}</p>
        </div>
        {!isPassageiro && (
          <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Novo Motorista</Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">{isPassageiro ? 'Nenhum motorista atribuído à sua rota.' : 'Nenhum motorista cadastrado.'}</p>
              {!isPassageiro && (
                <Button variant="outline" className="mt-4" onClick={openCreate}>Cadastrar motorista</Button>
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
                    <TableHead>CNH</TableHead>
                    <TableHead>Validade CNH</TableHead>
                    {!isPassageiro && <TableHead className="w-32">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.nome || i.usuario_nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{i.email || i.usuario_email}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{i.telefone || '—'}</TableCell>
                      <TableCell className="font-mono text-sm">{i.cnh || '—'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {i.cnh_validade ? new Date(i.cnh_validade).toLocaleDateString('pt-BR') : '—'}
                      </TableCell>
                      {!isPassageiro && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Atribuições" onClick={() => openAtribuicoes(i)}>
                              <ClipboardList className="w-4 h-4" />
                            </Button>
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

      <AtribuicoesMotoristaSheet
        motorista={atribuicoes.motorista}
        empresaId={empresaId}
        open={atribuicoes.open}
        onClose={closeAtribuicoes}
      />

      <Dialog open={dialog.open} onOpenChange={close}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{dialog.editing ? 'Editar Motorista' : 'Novo Motorista'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {!dialog.editing && (
              <>
                <div className="space-y-1.5">
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={e => f('nome', e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail *</Label>
                  <Input type="email" value={form.email} onChange={e => f('email', e.target.value)} placeholder="motorista@email.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Senha *</Label>
                  <Input type="password" value={form.senha} onChange={e => f('senha', e.target.value)} placeholder="Senha de acesso" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone || ''} onChange={e => f('telefone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNH</Label>
                <Input value={form.cnh || ''} onChange={e => f('cnh', e.target.value)} placeholder="00000000000" />
              </div>
              <div className="space-y-1.5">
                <Label>Validade CNH</Label>
                <Input type="date" value={form.cnh_validade ? form.cnh_validade.split('T')[0] : ''} onChange={e => f('cnh_validade', e.target.value)} />
              </div>
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
