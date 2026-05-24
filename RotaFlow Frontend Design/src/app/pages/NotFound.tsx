import { AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 p-8">
      <AlertCircle className="w-12 h-12 text-slate-300" />
      <h2 className="text-xl font-bold text-slate-900">Página em Construção</h2>
      <p className="text-sm max-w-sm text-center">Esta funcionalidade do RotaFlow está sendo desenvolvida. Por favor, acesse o Dashboard ou Veículos.</p>
    </div>
  );
}
