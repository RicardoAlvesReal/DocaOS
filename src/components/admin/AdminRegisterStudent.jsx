import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserPlus, Copy, CheckCircle } from 'lucide-react';
import { addStudent } from '@/lib/authStore';
import { toast } from 'sonner';

export default function AdminRegisterStudent({ onStudentAdded }) {
  const [nome, setNome] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [mensalidade, setMensalidade] = useState('');
  const [generated, setGenerated] = useState(null);

  const handleGenerate = () => {
    if (!nome.trim() || !responsavel.trim() || !mensalidade.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }
    const student = addStudent(nome.trim(), responsavel.trim(), mensalidade);
    setGenerated(student);
    toast.success('Matrícula e senha geradas!');
  };

  const handleConfirm = () => {
    setNome('');
    setResponsavel('');
    setMensalidade('');
    setGenerated(null);
    onStudentAdded();
    toast.success('Aluno cadastrado com sucesso!');
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Cadastrar Novo Aluno</h2>
      <Card className="p-6 max-w-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold">Nome Completo do Aluno</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome do aluno" disabled={!!generated} />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Nome do Responsável</Label>
            <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome do responsável" disabled={!!generated} />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Valor da Mensalidade (R$)</Label>
            <Input type="number" value={mensalidade} onChange={e => setMensalidade(e.target.value)} placeholder="Ex: 250" disabled={!!generated} />
          </div>

          {!generated && (
            <Button onClick={handleGenerate} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
              <UserPlus className="w-5 h-5 mr-2" />
              Gerar Matrícula e Senha
            </Button>
          )}

          {generated && (
            <div className="mt-6 bg-success/5 border-2 border-success/30 rounded-xl p-6 space-y-3">
              <h3 className="font-bold text-success flex items-center gap-2">
                <CheckCircle className="w-5 h-5" /> Dados Gerados
              </h3>
              <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border">
                <div>
                  <span className="text-xs text-muted-foreground">Matrícula</span>
                  <p className="text-xl font-mono font-bold">{generated.matricula}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyText(generated.matricula)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border">
                <div>
                  <span className="text-xs text-muted-foreground">Senha</span>
                  <p className="text-xl font-mono font-bold">{generated.senha}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => copyText(generated.senha)}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">⚠️ Anote esses dados e entregue ao responsável.</p>
              <Button onClick={handleConfirm} className="w-full bg-success text-success-foreground hover:bg-success/90 font-bold">
                Confirmar Cadastro
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}