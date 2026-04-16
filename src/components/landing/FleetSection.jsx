import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const features = [
  'Veículos com menos de 5 anos',
  'Manutenção preventiva mensal',
  'Ar condicionado',
  'Cintos de segurança em todos os assentos',
  'Bancos acolchoados e confortáveis',
  'Sistema de áudio para comunicação',
  'Extintor de incêndio e kit primeiros socorros',
  'Câmeras internas de monitoramento',
];

export default function FleetSection() {
  return (
    <section style={{ background: '#000000' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl font-black text-white mb-3">Nossa Frota</h2>
          <p className="text-white/50 text-sm">
            Veículos modernos, seguros e confortáveis para garantir o bem-estar das crianças
          </p>
        </motion.div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-2xl rounded-2xl border p-8"
            style={{ background: '#161b27', borderColor: '#1e2535' }}
          >
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-6"
              style={{ background: '#3b82f6', color: '#fff' }}
            >
              Diferenciais da Nossa Frota
            </span>
            <h3 className="text-2xl font-bold text-white mb-6">
              Conforto e Segurança em Cada Detalhe
            </h3>
            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{ background: '#1e2535' }}
                >
                  <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-sm" style={{ color: '#c8d0e0' }}>{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}