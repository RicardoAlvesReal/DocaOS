import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ChangePasswordModal({ open, aluno, onSuccess }) {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    await base44.entities.Aluno.update(aluno.id, { senha: novaSenha, primeiro_acesso: false });
    setLoading(false);
    onSuccess(novaSenha);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md border-border/50" hideClose>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Criar Nova Senha</DialogTitle>
              <p className="text-xs text-muted-foreground">Primeiro acesso — defina sua senha pessoal</p>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>Bem-vindo(a), <strong>{aluno?.nome}</strong>! Por segurança, crie uma senha pessoal antes de continuar.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Nova Senha</Label>
            <div className="relative">
              <Input
                type={showNova ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
                className="h-11 bg-muted/40 border-border/60 focus:border-primary pr-11"
              />
              <button type="button" onClick={() => setShowNova(!showNova)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showNova ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Confirmar Senha</Label>
            <div className="relative">
              <Input
                type={showConfirmar ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                value={confirmar}
                onChange={e => setConfirmar(e.target.value)}
                className="h-11 bg-muted/40 border-border/60 focus:border-primary pr-11"
              />
              <button type="button" onClick={() => setShowConfirmar(!showConfirmar)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showConfirmar ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/8 rounded-xl px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20">
            <KeyRound className="w-4 h-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}