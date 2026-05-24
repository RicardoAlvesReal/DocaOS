import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Building2, Rocket } from 'lucide-react';

const DISCOUNT = 0.2; // 20% de desconto no plano anual

const PLANS = [
  {
    id: 'starter',
    icon: Zap,
    iconColor: 'text-sky-500',
    iconBg: 'bg-sky-50',
    name: 'Starter',
    desc: 'Ideal para frotas pequenas que estão começando a se organizar.',
    monthly: 99,
    highlight: false,
    badge: null,
    features: [
      'Até 5 veículos cadastrados',
      '1 usuário administrador',
      'Gestão de passageiros e alunos',
      'Controle de mensalidades',
      'Relatórios básicos',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'pro',
    icon: Building2,
    iconColor: 'text-white',
    iconBg: 'bg-white/20',
    name: 'Profissional',
    desc: 'Para empresas em crescimento que precisam de mais controle e recursos.',
    monthly: 249,
    highlight: true,
    badge: 'Mais popular',
    features: [
      'Até 20 veículos cadastrados',
      '3 usuários administradores',
      'Gestão completa de motoristas',
      'Controle de rotas e trajetos',
      'Contratos digitais',
      'Comprovantes e notificações',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
  },
  {
    id: 'enterprise',
    icon: Rocket,
    iconColor: 'text-violet-500',
    iconBg: 'bg-violet-50',
    name: 'Enterprise',
    desc: 'Solução completa para frotas grandes e operações mais complexas.',
    monthly: 599,
    highlight: false,
    badge: null,
    features: [
      'Veículos ilimitados',
      'Usuários ilimitados',
      'Multi-frota e filiais',
      'API de integração',
      'Painéis personalizados',
      'Gestão de manutenção',
      'Relatórios e exportação',
      'Gerente de conta dedicado',
    ],
  },
];

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  const price = (monthly) => annual ? Math.round(monthly * (1 - DISCOUNT)) : monthly;

  return (
    <section id="planos" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              Planos e Preços
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Escolha o plano ideal para sua frota
            </h2>
            <p className="text-lg text-slate-600">
              Sem taxas escondidas. Cancele quando quiser.
            </p>
          </motion.div>

          {/* Toggle mensal / anual */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium transition-colors ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>
              Mensal
            </span>
            <button
              onClick={() => setAnnual(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${annual ? 'bg-primary' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0'}`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${annual ? 'text-slate-900' : 'text-slate-400'}`}>
              Anual
            </span>
            {annual && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                20% off
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-3xl p-8 border flex flex-col gap-6 ${
                  plan.highlight
                    ? 'bg-primary text-white border-primary shadow-2xl shadow-primary/30 scale-105'
                    : 'bg-white text-slate-900 border-slate-200 hover:shadow-lg hover:shadow-slate-200/60 transition-shadow'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold bg-amber-400 text-amber-900 px-4 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </span>
                )}

                {/* Ícone + nome */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.iconBg}`}>
                    <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-lg leading-tight ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {plan.name}
                    </p>
                    <p className={`text-xs leading-tight ${plan.highlight ? 'text-white/70' : 'text-slate-500'}`}>
                      {plan.desc}
                    </p>
                  </div>
                </div>

                {/* Preço */}
                <div>
                  <div className="flex items-end gap-1.5">
                    <span className={`text-sm font-semibold ${plan.highlight ? 'text-white/70' : 'text-slate-500'}`}>R$</span>
                    <span className="text-5xl font-bold leading-none">{price(plan.monthly)}</span>
                    <span className={`text-sm mb-1 ${plan.highlight ? 'text-white/70' : 'text-slate-500'}`}>/mês</span>
                  </div>
                  {annual && (
                    <p className={`text-xs mt-1.5 ${plan.highlight ? 'text-white/60' : 'text-slate-400'}`}>
                      Cobrado R$ {price(plan.monthly) * 12}/ano
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm">
                      <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-white/20' : 'bg-primary/10'}`}>
                        <Check className={`w-2.5 h-2.5 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                      </span>
                      <span className={plan.highlight ? 'text-white/90' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-white text-primary hover:bg-white/90'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  Começar agora
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Nota rodapé */}
        <p className="text-center text-sm text-slate-400 mt-10">
          Todos os planos incluem 14 dias de teste grátis. Sem necessidade de cartão de crédito.
        </p>
      </div>
    </section>
  );
}
