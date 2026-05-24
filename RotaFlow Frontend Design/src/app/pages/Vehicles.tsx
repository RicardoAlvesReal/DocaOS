import { BusFront, Plus, Settings2 } from "lucide-react";
import { motion } from "motion/react";

export function Vehicles() {
  const vehicles = [
    { id: "V01", plate: "ABC-1234", type: "Van", model: "Mercedes Sprinter", capacity: 15, status: "Ativo" },
    { id: "V02", plate: "XYZ-9876", type: "Micro-ônibus", model: "Volare W9", capacity: 22, status: "Em Manutenção" },
    { id: "V03", plate: "QWE-4567", type: "Van", model: "Renault Master", capacity: 15, status: "Ativo" },
    { id: "V04", plate: "RTY-3456", type: "Ônibus", model: "Marcopolo Paradiso", capacity: 46, status: "Ativo" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Veículos & Frota</h1>
          <p className="text-slate-500 text-sm mt-1">Gerencie os veículos cadastrados na sua frota.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Filtros
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Veículo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {vehicles.map((v, i) => (
          <motion.div 
            key={v.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-200 hover:shadow-md transition-all"
          >
            <div className="h-32 bg-slate-100 flex items-center justify-center relative">
              <BusFront className="w-16 h-16 text-slate-300" />
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                  v.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {v.status}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900">{v.model}</h3>
                <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{v.id}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">{v.type}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Placa</span>
                  <span className="font-medium text-slate-900">{v.plate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Capacidade</span>
                  <span className="font-medium text-slate-900">{v.capacity} lugares</span>
                </div>
              </div>

              <button className="w-full py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                Ver detalhes
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
