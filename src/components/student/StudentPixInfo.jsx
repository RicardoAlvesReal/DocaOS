import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Smartphone, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentPixInfo({ student }) {
  const pixKey = '27997114156';

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    toast.success('Chave Pix copiada!');
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">💰 Pagamento via Pix</h2>
      <div className="bg-card rounded-2xl border border-border p-6 max-w-lg space-y-4">
        <div className="bg-primary/8 rounded-xl p-5 border border-primary/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Chave Pix</p>
          <p className="text-2xl font-mono font-black text-foreground">{pixKey}</p>
          <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" /> Tipo da chave: Telefone
          </p>
        </div>

        <div className="bg-secondary/5 rounded-xl p-5 border border-border text-center">
          <p className="text-xs text-muted-foreground mb-1">Valor da sua mensalidade</p>
          <p className="text-3xl font-black text-foreground">
            R$ {student.mensalidade.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <Button onClick={copyPix} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20">
          <Copy className="w-4 h-4 mr-2" />
          Copiar Chave Pix
        </Button>

        <div className="bg-muted rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Abra seu aplicativo de banco, acesse a opção Pix, cole a chave acima, informe o valor da sua mensalidade, 
            realize o pagamento e depois envie o comprovante aqui nesta área para confirmar seu pagamento.
          </p>
        </div>
      </div>
    </div>
  );
}