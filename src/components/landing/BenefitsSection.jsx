import React from 'react';
import { motion } from 'framer-motion';

const SERVICES = [
  {
    title: 'Transporte Escolar',
    desc: 'Controle mensalidades, gerencie alunos por escola, roteirize a busca e informe os responsáveis com facilidade.',
    img: 'https://images.unsplash.com/photo-1533222535026-754c501569dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    icon: '🎒',
  },
  {
    title: 'Transfers & Fretados',
    desc: 'Agendamento corporativo, gestão de motoristas e controle de manutenção — tudo em um só painel.',
    img: 'https://images.unsplash.com/photo-1552561018-5fea54c08479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    icon: '👔',
  },
  {
    title: 'Excursões & Viagens',
    desc: 'Lista de embarque digital, acompanhamento do trajeto e gestão completa de passageiros e guias.',
    img: 'https://images.unsplash.com/photo-1604357209793-fca5dca89f97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    icon: '🗺️',
  },
];

export default function BenefitsSection() {
  return (
    <section id="servicos" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Um sistema para todo tipo de transporte
          </h2>
          <p className="text-lg text-slate-600">
            A versatilidade que você precisa, independentemente da sua modalidade de atuação no transporte privado.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {SERVICES.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-3xl overflow-hidden bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-100"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={item.img}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg">
                  {item.icon}
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}