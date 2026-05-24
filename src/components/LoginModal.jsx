import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bus, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { login } from '@/lib/authStore';
import { useNavigate } from 'react-router-dom';
export default function LoginModal({ open, onOpenChange }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const session = await login(email.trim(), senha.trim());
    setLoading(false);
    if (!session) {
      setError('E-mail ou senha incorreta.');
      return;
    }
    onOpenChange(false);
    setEmail('');
    setSenha('');
    const dest =
      session.type === 'super_admin' ? '/super-admin' :
      session.type === 'empresa'     ? '/empresa'     : '/';
    navigate(dest);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Área de Acesso</DialogTitle>
              <p className="text-xs text-muted-foreground">RotaFlow</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">E-mail</Label>
            <Input
              placeholder="Digite seu e-mail"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-11 bg-muted/40 border-border/60 focus:border-primary"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-sm">Senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                className="h-11 bg-muted/40 border-border/60 focus:border-primary pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}