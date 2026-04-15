import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bus, LogIn, AlertCircle } from 'lucide-react';
import { login } from '@/lib/authStore';
import { useNavigate } from 'react-router-dom';

export default function LoginModal({ open, onOpenChange }) {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    const session = login(matricula.trim(), senha.trim());
    if (!session) {
      setError('Matrícula ou senha incorreta.');
      return;
    }
    onOpenChange(false);
    setMatricula('');
    setSenha('');
    navigate(session.type === 'admin' ? '/admin' : '/aluno');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Área de Acesso</DialogTitle>
              <p className="text-xs text-muted-foreground">VanEscolar+</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Matrícula</Label>
            <Input
              placeholder="Ex: ALU0001 ou ADMIN2025"
              value={matricula}
              onChange={e => setMatricula(e.target.value)}
              className="h-11 bg-muted/40 border-border/60 focus:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Senha</Label>
            <Input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              className="h-11 bg-muted/40 border-border/60 focus:border-primary"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/8 rounded-xl px-3 py-2.5 border border-destructive/20">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20">
            <LogIn className="w-4 h-4 mr-2" />
            Entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}