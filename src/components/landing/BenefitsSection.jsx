import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Clock, Calendar, Home, Building2 } from 'lucide-react';

const benefits = [
  {
    icon: MapPin,
    title: 'Rotas Personalizadas',
    description: 'Planejamos rotas otimizadas para buscar e levar seu filho com eficiência e segurança.',
    highlight: true,
  },
  {
    icon: Users,
    title: 'Monitor a Bordo',
    description: 'Profissionais treinados acompanham as crianças durante todo o trajeto.',
  },
  {
    icon: Clock,
    title: 'Horários Flexíveis',
    description: 'Adaptamos os horários de acordo com a grade escolar e necessidades da família.',
  },
  {
    icon: Calendar,
    title: 'Mensalidade Fixa',
    description: 'Valores transparentes sem surpresas. Planos mensais com desconto para irmãos.',
  },
  {
    icon: Home,
    title: 'Porta a Porta',
    description: 'Buscamos e levamos seu filho na porta de casa e da escola com total segurança.',
  },
  {
    icon: Building2,
    title: 'São Camilo',
    description: 'A escola que seu filho merece.',
  },
];

function BenefitCard({ b, i }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-2xl p-6 border transition-all duration-300 cursor-default"
      style={{
        background: hovered ? '#1e2d4a' : '#161b27',
        borderColor: hovered || b.highlight ? '#3b82f6' : '#1e2535',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 8px 32px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
        style={{ background: hovered || b.highlight ? '#3b82f6' : '#1e2d4a' }}
      >
        <b.icon className="w-5 h-5 text-white" />
      </div>
      <h3
        className="text-base font-bold mb-2 transition-colors duration-300"
        style={{ color: hovered || b.highlight ? '#3b82f6' : '#ffffff' }}
      >
        {b.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: '#8b92a5' }}>
        {b.description}
      </p>
      {(b.highlight || hovered) && (
        <div className="mt-4 h-0.5 rounded-full bg-blue-500 transition-all duration-300" style={{ width: hovered ? '100%' : '4rem' }} />
      )}
    </motion.div>
  );
}

export default function BenefitsSection() {
  return (
    <section style={{ background: '#0d1117' }} className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-white/60 text-sm mb-14"
        >
          Oferecemos soluções completas de transporte escolar com foco em{' '}
          <span className="text-white font-semibold">segurança</span> e{' '}
          <span className="text-white font-semibold">conforto</span>
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <BenefitCard key={i} b={b} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}