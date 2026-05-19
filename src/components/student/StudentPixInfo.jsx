import React from 'react';
import { Copy, Smartphone, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentPixInfo({ student }) {
  const pixKey = '27997114156';

  const copyPix = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pixKey)
        .then(() => toast.success('Chave Pix copiada com sucesso!'))
        .catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    const el = document.createElement('textarea');
    el.value = pixKey;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      toast.success('Chave Pix copiada com sucesso!');
    } catch {
      toast.error('Não foi possível copiar. Copie manualmente: ' + pixKey);
    }
    document.body.removeChild(el);
  };

  return (
    <div>
      <h2 className="text-base font-bold text-white mb-5">Pagamento via Pix</h2>
      <div className="space-y-4 max-w-lg">
        {/* Pix key box */}
        <div className="rounded-xl p-5 border" style={{ background: '#1e2d4a', borderColor: '#3b82f6' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#8b92a5' }}>Chave Pix</p>
          <p
            className="text-2xl font-mono font-black text-white cursor-pointer hover:text-blue-400 transition-colors select-all"
            onClick={copyPix}
            title="Clique para copiar"
          >
            {pixKey}
          </p>
          <p className="text-sm mt-1.5 flex items-center gap-1.5" style={{ color: '#8b92a5' }}>
            <Smartphone className="w-4 h-4" /> Tipo da chave: Telefone
          </p>
        </div>

        {/* Value */}
        <div className="rounded-xl p-5 border text-center" style={{ background: '#161b27', borderColor: '#1e2535' }}>
          <p className="text-xs mb-1" style={{ color: '#8b92a5' }}>Valor da sua mensalidade</p>
          <p className="text-3xl font-black text-white">
            R$ {student.mensalidade.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Copy button */}
        <button
          onClick={copyPix}
          className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ background: '#3b82f6' }}
          onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
          onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
        >
          <Copy className="w-4 h-4" />
          Copiar Chave Pix
        </button>

        {/* Info */}
        <div className="rounded-xl p-4 flex gap-3" style={{ background: '#161b27' }}>
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#8b92a5' }} />
          <p className="text-sm leading-relaxed" style={{ color: '#8b92a5' }}>
            Abra seu aplicativo de banco, acesse a opção Pix, cole a chave acima, informe o valor da sua mensalidade,
            realize o pagamento e depois envie o comprovante na aba <strong className="text-white">Enviar Comprovante</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}