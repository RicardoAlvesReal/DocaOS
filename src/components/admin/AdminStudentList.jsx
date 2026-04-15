import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { getStudents, MONTHS_MAP, MONTH_KEYS } from '@/lib/authStore';

export default function AdminStudentList() {
  const students = getStudents();
  const [selectedStudent, setSelectedStudent] = useState(null);

  const statusConfig = {
    pago: { label: 'Pago', icon: CheckCircle, className: 'bg-success/10 text-success border-success/20' },
    pendente: { label: 'Pendente', icon: AlertTriangle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
    aguardando: { label: 'Aguardando', icon: Clock, className: 'bg-warning/10 text-warning border-warning/20' },
    rejeitado: { label: 'Rejeitado', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Lista de Alunos</h2>
      
      {/* Desktop table */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Matrícula</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Mensalidade</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map(s => (
                <tr key={s.matricula} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{s.nome}</td>
                  <td className="px-6 py-4 font-mono text-sm">{s.matricula}</td>
                  <td className="px-6 py-4 font-semibold">R$ {s.mensalidade.toFixed(2).replace('.', ',')}</td>
                  <td className="px-6 py-4 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedStudent(s)}>
                      <Eye className="w-4 h-4 mr-1" /> Ver Detalhes
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {students.map(s => (
          <Card key={s.matricula} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{s.nome}</p>
                <p className="text-sm text-muted-foreground font-mono">{s.matricula}</p>
                <p className="text-sm font-semibold mt-1">R$ {s.mensalidade.toFixed(2).replace('.', ',')}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedStudent(s)}>
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">{selectedStudent.nome}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedStudent.matricula} · R$ {selectedStudent.mensalidade.toFixed(2).replace('.', ',')}
                </p>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {MONTH_KEYS.map(key => {
                  const status = selectedStudent.meses[key] || 'pendente';
                  const config = statusConfig[status];
                  const Icon = config.icon;
                  return (
                    <div key={key} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${config.className}`}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{MONTHS_MAP[key]}</p>
                        <p className="text-xs">{config.label}</p>
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