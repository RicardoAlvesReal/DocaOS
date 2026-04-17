import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileSearch, FileImage, Loader2 } from 'lucide-react';
import { getComprovantes, getStudentByMatricula, confirmarComprovante, rejeitarComprovante, MONTHS_MAP } from '@/lib/authStore';
import { toast } from 'sonner';

export default function AdminComprovantes({ onUpdate }) {
  const [comprovantes, setComprovantes] = useState([]);
  const [students, setStudents] = useState({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const comps = await getComprovantes();
    const pending = comps.filter(c => c.status === 'aguardando');
    setComprovantes(pending);

    // Carrega dados dos alunos para cada comprovante
    const studentMap = {};
    for (const comp of pending) {
      if (!studentMap[comp.matricula]) {
        studentMap[comp.matricula] = await getStudentByMatricula(comp.matricula);
      }
    }
    setStudents(studentMap);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleConfirmar = async (id) => {
    await confirmarComprovante(id);
    await loadData();
    onUpdate();
    toast.success('Pagamento confirmado!');
  };

  const handleRejeitar = async (id) => {
    await rejeitarComprovante(id);
    await loadData();
    onUpdate();
    toast.error('Comprovante rejeitado.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (comprovantes.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-foreground">Análise de Comprovantes</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Comprovantes enviados pelos alunos</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-16 text-center">
          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-semibold text-foreground">Nenhum comprovante pendente</p>
          <p className="text-sm text-muted-foreground mt-1">Todos os comprovantes foram analisados.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground">Análise de Comprovantes</h2>
        <p className="text-muted-foreground text-sm mt-0.5">
          <span className="font-semibold text-warning">{comprovantes.length}</span> comprovante{comprovantes.length > 1 ? 's' : ''} aguardando análise
        </p>
      </div>

      <div className="space-y-4">
        {comprovantes.map(comp => {
          const student = students[comp.matricula];
          const isPdf = comp.fileName?.toLowerCase().endsWith('.pdf');
          const fileSource = comp.fileUrl || comp.fileBase64;
          return (
            <div key={comp.id} className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-foreground">{student?.nome || comp.matricula}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">{comp.matricula}</span>
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-medium">
                      📅 {MONTHS_MAP[comp.mesKey]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs bg-warning/10 text-warning border border-warning/20 px-3 py-1.5 rounded-full font-semibold w-fit">
                  <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse" />
                  Aguardando análise
                </div>
              </div>

              <div className="px-6 py-4">
                {fileSource ? (
                  isPdf ? (
                    <a
                      href={fileSource}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-muted rounded-xl p-4 hover:bg-muted/80 transition-colors w-fit"
                    >
                      <FileImage className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">Arquivo PDF</p>
                        <p className="text-xs text-primary underline">Clique para abrir</p>
                      </div>
                    </a>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Imagem do Comprovante</p>
                      <img
                        src={fileSource}
                        alt="Comprovante"
                        className="max-w-sm w-full rounded-xl border border-border object-contain bg-muted"
                        style={{ maxHeight: 320 }}
                      />
                    </div>
                  )
                ) : (
                  <div className="bg-muted rounded-xl p-8 text-center text-muted-foreground text-sm w-fit">
                    Sem arquivo
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleConfirmar(comp.id)}
                  className="flex-1 bg-success hover:bg-success/90 text-white font-bold rounded-xl h-11"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Pagamento
                </Button>
                <Button
                  onClick={() => handleRejeitar(comp.id)}
                  variant="destructive"
                  className="flex-1 font-bold rounded-xl h-11"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}