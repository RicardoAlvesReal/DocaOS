import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, CheckCircle, Clock, AlertTriangle, XCircle, Search, Trash2, Loader2 } from 'lucide-react';
import { getStudents, MONTHS_MAP, MONTH_KEYS, removeStudent } from '@/lib/authStore';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const statusConfig = {
  pago: { label: 'Pago', icon: CheckCircle, bg: 'bg-success/10 border-success/20', text: 'text-success' },
  pendente: { label: 'Pendente', icon: AlertTriangle, bg: 'bg-destructive/10 border-destructive/20', text: 'text-destructive' },
  aguardando: { label: 'Aguardando', icon: Clock, bg: 'bg-warning/10 border-warning/20', text: 'text-warning' },
  rejeitado: { label: 'Rejeitado', icon: XCircle, bg: 'bg-destructive/10 border-destructive/20', text: 'text-destructive' },
};

export default function AdminStudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    const data = await getStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => { loadStudents(); }, []);

  const handleRemove = async (matricula) => {
    setDeleting(true);
    await removeStudent(matricula);
    await loadStudents();
    setConfirmDelete(null);
    setDeleting(false);
    toast.success('Aluno removido.');
  };

  const filtered = students.filter(s =>
    s.nome.toLowerCase().includes(search.toLowerCase()) ||
    s.matricula.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Lista de Alunos</h2>
        <p className="text-muted-foreground text-sm mt-0.5">{students.length} alunos cadastrados</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou matrícula..."
          className="pl-9 h-10 bg-card"
        />
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          <span>Aluno</span>
          <span>Matrícula</span>
          <span>Mensalidade</span>
          <span>Ação</span>
        </div>

        <div className="divide-y divide-border">
          {filtered.map(s => {
            const pagos = Object.values(s.meses || {}).filter(v => v === 'pago').length;
            const total = MONTH_KEYS.length;
            return (
              <div key={s.matricula} className="grid md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-semibold text-foreground text-sm">{s.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.responsavel}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 md:hidden">
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{s.matricula}</span>
                  </div>
                </div>
                <span className="hidden md:block font-mono text-sm text-foreground">{s.matricula}</span>
                <div className="hidden md:block">
                  <span className="font-bold text-foreground text-sm">R$ {s.mensalidade.toFixed(2).replace('.', ',')}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{pagos}/{total} meses pagos</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(s)} className="h-8 px-3 rounded-lg text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Detalhes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelete(s)}
                    className="h-8 w-8 px-0 rounded-lg text-destructive border-destructive/20 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum aluno encontrado.</div>
          )}
        </div>
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">Remover Aluno</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1">
            Tem certeza que deseja remover <strong className="text-foreground">{confirmDelete?.nome}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1">Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => handleRemove(confirmDelete.matricula)}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Remover
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.nome}</DialogTitle>
                <p className="text-sm text-muted-foreground font-mono">{selected.matricula} · R$ {selected.mensalidade.toFixed(2).replace('.', ',')}/mês</p>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {MONTH_KEYS.map(key => {
                  const status = (selected.meses || {})[key] || 'pendente';
                  const cfg = statusConfig[status];
                  const Icon = cfg.icon;
                  return (
                    <div key={key} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.text}`} />
                      <div>
                        <p className="text-sm font-semibold">{MONTHS_MAP[key]}</p>
                        <p className={`text-xs ${cfg.text}`}>{cfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}