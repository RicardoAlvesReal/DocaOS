import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileSearch, Image } from 'lucide-react';
import { getComprovantes, getStudentByMatricula, confirmarComprovante, rejeitarComprovante, MONTHS_MAP } from '@/lib/authStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminComprovantes({ onUpdate }) {
  const comprovantes = getComprovantes().filter(c => c.status === 'aguardando');

  const handleConfirmar = (id) => {
    confirmarComprovante(id);
    onUpdate();
    toast.success('Pagamento confirmado!');
  };

  const handleRejeitar = (id) => {
    rejeitarComprovante(id);
    onUpdate();
    toast.error('Comprovante rejeitado.');
  };

  if (comprovantes.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Análise de Comprovantes</h2>
        <Card className="p-12 text-center">
          <FileSearch className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">Nenhum comprovante pendente</p>
          <p className="text-sm text-muted-foreground mt-1">Todos os comprovantes foram analisados.</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Análise de Comprovantes
        <span className="ml-3 bg-warning text-warning-foreground text-sm font-bold px-3 py-1 rounded-full">
          {comprovantes.length} pendente{comprovantes.length > 1 ? 's' : ''}
        </span>
      </h2>

      <div className="space-y-4">
        {comprovantes.map(comp => {
          const student = getStudentByMatricula(comp.matricula);
          return (
            <Card key={comp.id} className="p-6 border-warning/30">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{student?.nome || comp.matricula}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{comp.matricula}</p>
                  <div className="flex flex-wrap gap-3 mt-3 text-sm">
                    <span className="bg-muted px-3 py-1 rounded-lg font-medium">
                      📅 Mês: {MONTHS_MAP[comp.mesKey]}
                    </span>
                    <span className="bg-muted px-3 py-1 rounded-lg font-medium">
                      🕐 {format(new Date(comp.dataEnvio), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                </div>
                <div className="lg:w-64 flex-shrink-0">
                  {comp.fileBase64 ? (
                    comp.fileName?.endsWith('.pdf') ? (
                      <div className="bg-muted rounded-xl p-8 text-center">
                        <FileSearch className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">Arquivo PDF</p>
                        <a href={comp.fileBase64} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                          Abrir PDF
                        </a>
                      </div>
                    ) : (
                      <img
                        src={comp.fileBase64}
                        alt="Comprovante"
                        className="w-full h-48 object-cover rounded-xl border"
                      />
                    )
                  ) : (
                    <div className="bg-muted rounded-xl p-8 text-center">
                      <Image className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Sem imagem</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <Button
                  onClick={() => handleConfirmar(comp.id)}
                  className="flex-1 bg-success text-success-foreground hover:bg-success/90 font-bold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirmar Pagamento
                </Button>
                <Button
                  onClick={() => handleRejeitar(comp.id)}
                  variant="destructive"
                  className="flex-1 font-bold"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Rejeitar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}