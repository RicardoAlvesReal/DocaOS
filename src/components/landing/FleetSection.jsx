import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const features = [
  'Veículos com menos de 5 anos',
  'Manutenção preventiva mensal',
  'Ar condicionado',
  'Cintos de segurança em todos os assentos',
  'Rastreamento em tempo real',
  'Extintor de incêndio e equipamentos de segurança',
];

function FleetItem({ text, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-default transition-all duration-200"
      style={{
        background: hovered ? '#1e2d4a' : '#1e2535',
        borderLeft: hovered ? '3px solid #3b82f6' : '3px solid transparent',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
      }}
    >
      <CheckCircle2 className="w-4 h-4 flex-shrink-0 transition-colors duration-200" style={{ color: hovered ? '#60a5fa' : '#3b82f6' }} />
      <span className="text-sm transition-colors duration-200" style={{ color: hovered ? '#ffffff' : '#c8d0e0' }}>{text}</span>
    </motion.div>
  );
}

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
            Veículos modernos, seguros e climatizados para todos os tipos de rota e contratante
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
              Conforto, Segurança e Tecnologia em Cada Rota
            </h3>
            <div className="space-y-3">
              {features.map((f, i) => (
                <FleetItem key={i} text={f} index={i} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}