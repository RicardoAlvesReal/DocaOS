import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, CreditCard, Search } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_META = {
  aguardando:  { label: 'Aguardando',  className: 'bg-amber-500/15 text-amber-600 border-amber-500/20'   },
  confirmado:  { label: 'Confirmado',  className: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20' },
  rejeitado:   { label: 'Rejeitado',   className: 'bg-red-500/15 text-red-600 border-red-500/20'         },
  vencido:     { label: 'Vencido',     className: 'bg-secondary text-muted-foreground border-border'     },
};

export default function EmpresaPagamentos({ session, onPendingChange }) {
  const empresaId = session?.empresa_id;
  const isPassageiro = session?.role === 'passageiro';
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      let data;
      if (isPassageiro) {
        const [todosPas, todosCon] = await Promise.all([
          api.entities.Passageiro.filter({ empresa_id: empresaId }),
          api.entities.Contrato.filter({ empresa_id: empresaId }),
        ]);
        const meuPas = todosPas.find(p => p.usuario_id === session.id);
        if (meuPas) {
          const meusContratoIds = todosCon
            .filter(c => c.passageiro_id === meuPas.id)
            .map(c => c.id);
          const todosPag = await api.entities.Pagamento.filter({ empresa_id: empresaId });
          data = todosPag.filter(p => meusContratoIds.includes(p.contrato_id));
        } else {
          data = [];
        }
      } else {
        data = await api.entities.Pagamento.filter({ empresa_id: empresaId });
      }
      setItems(data);
      const pending = data.filter(p => p.status === 'aguardando').length;
      onPendingChange?.(pending);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (empresaId) load(); }, [empresaId]);

  const confirmar = async (id) => {
    setProcessing(id + '_confirmar');
    try {
      await fetch(`/api/pagamentos/${id}/confirmar`, { method: 'POST' });
      toast.success('Pagamento confirmado!');
      load();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  const rejeitar = async (id) => {
    setProcessing(id + '_rejeitar');
    try {
      await fetch(`/api/pagamentos/${id}/rejeitar`, { method: 'POST' });
      toast.success('Pagamento rejeitado.');
      load();
    } catch (e) { toast.error(e.message); }
    finally { setProcessing(null); }
  };

  const filtered = items.filter(i => {
    const matchStatus = statusFilter === 'todos' || i.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (i.passageiro_nome || '').toLowerCase().includes(q) ||
      (i.mes_referencia || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const tabs = [
    { key: 'todos',       label: 'Todos'       },
    { key: 'aguardando',  label: 'Aguardando'  },
    { key: 'confirmado',  label: 'Confirmados' },
    { key: 'rejeitado',   label: 'Rejeitados'  },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">{isPassageiro ? 'Meus Pagamentos' : 'Pagamentos'}</h1>
        <p className="text-muted-foreground text-sm mt-1">{items.length} pagamento(s)</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder={isPassageiro ? 'Buscar por mês...' : 'Buscar passageiro ou mês...'} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {tabs.map(t => (
            <Button
              key={t.key}
              variant={statusFilter === t.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(t.key)}
            >{t.label}</Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum pagamento encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {!isPassageiro && <TableHead>Passageiro</TableHead>}
                    <TableHead>Mês Ref.</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Comprovante</TableHead>
                    {!isPassageiro && <TableHead className="w-32">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(i => {
                    const sm = STATUS_META[i.status] || { label: i.status, className: '' };
                    return (
                      <TableRow key={i.id}>
                        {!isPassageiro && <TableCell className="font-medium">{i.passageiro_nome || '—'}</TableCell>}
                        <TableCell className="text-muted-foreground text-sm">{i.mes_referencia}</TableCell>
                        <TableCell className="font-medium">
                          {Number(i.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(i.vencimento).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${sm.className}`}>{sm.label}</span>
                        </TableCell>
                        <TableCell>
                          {i.comprovante_url ? (
                            <a href={i.comprovante_url} target="_blank" rel="noreferrer" className="text-primary text-xs underline underline-offset-2">
                              Ver
                            </a>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        {!isPassageiro && (
                          <TableCell>
                            {i.status === 'aguardando' ? (
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost" size="icon"
                                  className="text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50"
                                  disabled={processing === i.id + '_confirmar'}
                                  onClick={() => confirmar(i.id)}
                                  title="Confirmar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className="text-destructive hover:text-destructive"
                                  disabled={processing === i.id + '_rejeitar'}
                                  onClick={() => rejeitar(i.id)}
                                  title="Rejeitar"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
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
    </div>
  );
}
