import React from 'react';
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
    title: 'Todas as Escolas',
    description: 'Atendemos instituições de ensino públicas e privadas em toda a região.',
  },
];

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
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-6 border transition-all duration-300 cursor-default"
              style={{
                background: '#161b27',
                borderColor: b.highlight ? '#3b82f6' : '#1e2535',
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                style={{ background: b.highlight ? '#3b82f6' : '#1e2d4a' }}
              >
                <b.icon className="w-5 h-5 text-white" />
              </div>
              <h3
                className="text-base font-bold mb-2"
                style={{ color: b.highlight ? '#3b82f6' : '#ffffff' }}
              >
                {b.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#8b92a5' }}>
                {b.description}
              </p>
              {b.highlight && (
                <div className="mt-4 h-0.5 w-16 rounded-full bg-blue-500" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}