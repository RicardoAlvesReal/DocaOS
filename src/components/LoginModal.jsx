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
    if (session.type === 'admin') {
      navigate('/admin');
    } else {
      navigate('/aluno');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bus className="w-5 h-5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-xl font-bold">Área de Acesso</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Entre com sua matrícula e senha para acessar o sistema.
          </p>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="matricula" className="font-semibold">Matrícula</Label>
            <Input
              id="matricula"
              placeholder="Ex: ALU0001 ou ADMIN2025"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="h-12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha" className="font-semibold">Senha</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-12"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl">
            <LogIn className="w-5 h-5 mr-2" />
            Entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}