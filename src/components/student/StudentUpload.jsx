import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
      <h2 className="text-xl font-bold text-foreground mb-4">📤 Enviar Comprovante</h2>
      <Card className="p-6 max-w-lg">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold">Mês Referente</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(k => (
                  <SelectItem key={k} value={k}>{MONTHS_MAP[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Comprovante (JPG, PNG ou PDF)</Label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              {file ? (
                <div className="flex items-center gap-2 justify-center text-success">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium text-sm">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar o arquivo</p>
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

          <Button
            onClick={handleSubmit}
            disabled={sending || !selectedMonth || !file}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold h-12"
          >
            <Upload className="w-5 h-5 mr-2" />
            Enviar Comprovante
          </Button>
        </div>
      </Card>
    </div>
  );
}