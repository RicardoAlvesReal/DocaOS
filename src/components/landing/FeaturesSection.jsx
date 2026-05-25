import React from 'react';
import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';
import {
  CreditCard,
  MapPin,
  Bell,
  Users,
  FileText,
  ShieldCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-600',
    title: 'Controle de Pagamentos',
    desc: 'Registre mensalidades, gere cobranças PIX automáticas e visualize o status de cada aluno em tempo real.',
  },
  {
    icon: MapPin,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'Gestão de Rotas',
    desc: 'Crie e edite rotas com paradas personalizadas, horários e capacidade de cada veículo.',
  },
  {
    icon: Bell,
    color: 'bg-sky-100 text-sky-600',
    title: 'Notificações Automáticas',
    desc: 'Avise responsáveis via WhatsApp sobre pagamentos, confirmações e alterações de rota.',
  },
  {
    icon: Users,
    color: 'bg-violet-100 text-violet-600',
    title: 'Cadastro de Passageiros',
    desc: 'Gerencie alunos, responsáveis e contatos de emergência com histórico completo por perfil.',
  },
  {
    icon: FileText,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Comprovantes Digitais',
    desc: 'Emita e armazene comprovantes de pagamento. Alunos fazem upload direto pelo painel.',
  },
  {
    icon: ShieldCheck,
    color: 'bg-green-100 text-green-600',
    title: 'Acesso Seguro',
    desc: 'Painel exclusivo para administradores e área restrita para cada aluno, com login seguro.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="funcionalidades" className="pt-16 pb-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-4">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-lg text-slate-600">
            Ferramentas pensadas para simplificar a gestão do dia a dia do seu negócio de transporte.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              {...staggerItem(i * 0.08)}
              className="bg-white rounded-2xl p-8 border border-slate-100 hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
