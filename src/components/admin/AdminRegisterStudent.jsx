import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { addStudent } from '@/lib/authStore';
import { toast } from 'sonner';

export default function AdminRegisterStudent({ onStudentAdded }) {
  const [nome, setNome] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [mensalidade, setMensalidade] = useState('');
  const [matriculaCustom, setMatriculaCustom] = useState('');
  const [senhaCustom, setSenhaCustom] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nome.trim() || !responsavel.trim() || !mensalidade.trim()) {
      toast.error('Preencha nome, responsável e mensalidade.');
      return;
    }
    setSaving(true);
    const result = await addStudent(nome.trim(), responsavel.trim(), mensalidade, matriculaCustom, senhaCustom);
    setSaving(false);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Aluno ${result.matricula} cadastrado com sucesso!`);
    setNome('');
    setResponsavel('');
    setMensalidade('');
    setMatriculaCustom('');
    setSenhaCustom('');
    onStudentAdded();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Cadastrar Novo Aluno</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Preencha os dados do aluno. Matrícula e senha são opcionais — serão geradas automaticamente se não informadas.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 max-w-xl space-y-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Dados Pessoais</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Nome Completo do Aluno *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" className="h-10 bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Nome do Responsável *</Label>
              <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Ex: Maria da Silva" className="h-10 bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">Mensalidade (R$) *</Label>
              <Input type="number" value={mensalidade} onChange={e => setMensalidade(e.target.value)} placeholder="Ex: 250" className="h-10 bg-muted/30" />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Acesso ao Sistema</p>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">
                Matrícula
                <span className="ml-2 text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">opcional — gerada automaticamente</span>
              </Label>
              <Input
                value={matriculaCustom}
                onChange={e => setMatriculaCustom(e.target.value)}
                placeholder="Ex: ALU0010 (deixe em branco para gerar)"
                className="h-10 bg-muted/30 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-sm">
                Senha
                <span className="ml-2 text-[10px] font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">opcional — gerada automaticamente</span>
              </Label>
              <div className="relative">
                <Input
                  type={showSenha ? 'text' : 'password'}
                  value={senhaCustom}
                  onChange={e => setSenhaCustom(e.target.value)}
                  placeholder="Deixe em branco para gerar"
                  className="h-10 bg-muted/30 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
          {saving ? 'Cadastrando...' : 'Cadastrar Aluno'}
        </Button>
      </div>
    </div>
  );
}