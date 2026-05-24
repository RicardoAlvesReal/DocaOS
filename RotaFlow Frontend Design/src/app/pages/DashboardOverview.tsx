import { motion } from "motion/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bus, TrendingUp, Users, AlertCircle, MapPin, CheckCircle2 } from "lucide-react";

const data = [
  { name: 'Seg', viagens: 40, receita: 2400 },
  { name: 'Ter', viagens: 30, receita: 1398 },
  { name: 'Qua', viagens: 45, receita: 3800 },
  { name: 'Qui', viagens: 50, receita: 3908 },
  { name: 'Sex', viagens: 65, receita: 4800 },
  { name: 'Sáb', viagens: 85, receita: 7800 },
  { name: 'Dom', viagens: 20, receita: 1200 },
];

export function DashboardOverview() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Visão Geral</h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe as métricas da sua frota hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="bg-white border border-slate-200 text-sm rounded-lg px-4 py-2 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
            <option>Hoje</option>
            <option>Últimos 7 dias</option>
            <option>Este Mês</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-600/20">
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Veículos em Rota", value: "24", trend: "+2", icon: Bus, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Passageiros Hoje", value: "842", trend: "+12%", icon: Users, color: "text-emerald-600", bg: "bg-emerald-100" },
          { label: "Receita Diária", value: "R$ 4.250", trend: "+8%", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-100" },
          { label: "Alertas de Frota", value: "3", trend: "-1", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className={`text-sm font-semibold flex items-center gap-1 ${stat.trend.startsWith('+') ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stat.trend}
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">Volume de Viagens (Semana)</h2>
            <p className="text-sm text-slate-500">Comparativo diário de rotas concluídas.</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViagens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="viagens" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorViagens)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Active Routes / Tracking */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Rotas em Andamento</h2>
              <p className="text-sm text-slate-500">Acompanhamento ao vivo</p>
            </div>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Ver mapa</button>
          </div>

          <div className="flex-1 space-y-4">
            {[
              { id: "RT-104", name: "Escola Bandeirantes", driver: "Roberto", status: "No horário", progress: 75, time: "10 min" },
              { id: "TR-092", name: "Transfer Aeroporto", driver: "Ana Maria", status: "Embarcando", progress: 10, time: "45 min" },
              { id: "EX-503", name: "Excursão Hopi Hari", driver: "Carlos S.", status: "Atraso leve", progress: 40, time: "2h 30m" },
            ].map((route, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{route.name}</h3>
                      <p className="text-xs text-slate-500">Motorista: {route.driver}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    route.status === 'No horário' ? 'bg-emerald-100 text-emerald-700' :
                    route.status === 'Embarcando' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {route.status}
                  </span>
                </div>
                
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${route.status === 'Atraso leve' ? 'bg-amber-500' : 'bg-blue-600'}`} 
                      style={{ width: `${route.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{route.time}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 border border-dashed border-slate-300 rounded-xl text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
            Ver todas as rotas (12)
          </button>
        </motion.div>
      </div>

      {/* Recent Trips Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Últimas Viagens Concluídas</h2>
          <button className="text-sm text-blue-600 font-medium hover:text-blue-700">Histórico completo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">ID Viagem</th>
                <th className="px-6 py-4">Modalidade</th>
                <th className="px-6 py-4">Destino</th>
                <th className="px-6 py-4">Data/Hora</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { id: "#V-8492", type: "Escolar", desc: "Rota Sul - Manhã", time: "Hoje, 07:30", status: "Concluído" },
                { id: "#V-8491", type: "Transfer", desc: "Aeroporto Guarulhos", time: "Hoje, 06:15", status: "Concluído" },
                { id: "#V-8490", type: "Excursão", desc: "Museu do Ipiranga", time: "Ontem, 16:00", status: "Concluído" },
                { id: "#V-8489", type: "Escolar", desc: "Rota Norte - Tarde", time: "Ontem, 13:45", status: "Concluído" },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.id}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium text-xs">
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{row.desc}</td>
                  <td className="px-6 py-4">{row.time}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </div>
  );
}
