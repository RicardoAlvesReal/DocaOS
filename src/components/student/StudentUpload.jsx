import React, { useState, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle } from 'lucide-react';
import { addComprovante, MONTHS_MAP, MONTH_KEYS } from '@/lib/authStore';
import { toast } from 'sonner';

export default function StudentUpload({ student, onUpdate }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef(null);

  const availableMonths = MONTH_KEYS.filter(k => {
    const s = student.meses[k];
    return s === 'pendente' || s === 'rejeitado';
  });

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(f.type)) {
      toast.error('Formato inválido. Envie JPG, PNG ou PDF.');
      return;
    }
    setFile(f);
  };

  const handleSubmit = () => {
    if (!selectedMonth) { toast.error('Selecione o mês.'); return; }
    if (!file) { toast.error('Selecione um arquivo.'); return; }
    setSending(true);
    const reader = new FileReader();
    reader.onload = () => {
      addComprovante(student.matricula, selectedMonth, reader.result, file.name);
      setSending(false);
      setSelectedMonth('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      onUpdate();
      toast.success('Comprovante enviado! Aguarde a análise.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 className="text-base font-bold text-white mb-5">Enviar Comprovante de Pagamento</h2>
      <div className="space-y-4 max-w-lg">
        {/* Month select */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8b92a5' }}>
            Mês Referente
          </label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger
              className="h-11 rounded-xl border text-white"
              style={{ background: '#1e2535', borderColor: '#2a3347' }}
            >
              <SelectValue placeholder="Selecione o mês" />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.length === 0 ? (
                <SelectItem value="none" disabled>Sem meses pendentes</SelectItem>
              ) : (
                availableMonths.map(k => (
                  <SelectItem key={k} value={k}>{MONTHS_MAP[k]}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8b92a5' }}>
            Comprovante (JPG, PNG ou PDF)
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-xl p-8 text-center cursor-pointer border-2 border-dashed transition-all"
            style={{
              background: '#161b27',
              borderColor: file ? '#22c55e' : '#2a3347',
            }}
          >
            {file ? (
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="font-medium text-sm text-emerald-400">{file.name}</span>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: '#8b92a5' }} />
                <p className="text-sm" style={{ color: '#8b92a5' }}>Clique para selecionar o arquivo</p>
                <p className="text-xs mt-1" style={{ color: '#4a5165' }}>JPG, PNG ou PDF</p>
              </>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={sending || !selectedMonth || !file}
          className="w-full h-11 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#3b82f6' }}
          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}
        >
          <Upload className="w-4 h-4" />
          {sending ? 'Enviando...' : 'Enviar Comprovante'}
        </button>
      </div>
    </div>
  );
}