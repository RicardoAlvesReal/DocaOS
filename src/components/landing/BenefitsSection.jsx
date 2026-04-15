import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Heart, MapPin, Users, Phone } from 'lucide-react';

const benefits = [
  { icon: Shield, title: 'Segurança Total', description: 'Motoristas habilitados, veículos revisados e rastreamento em tempo real para sua tranquilidade.' },
  { icon: Clock, title: 'Pontualidade', description: 'Compromisso com horários. Seu filho nunca perde o início das aulas.' },
  { icon: Heart, title: 'Cuidado e Carinho', description: 'Tratamos cada criança como se fosse da nossa família. Ambiente acolhedor e seguro.' },
  { icon: MapPin, title: 'Rotas Otimizadas', description: 'Caminhos planejados para menor tempo de trajeto e máximo conforto.' },
  { icon: Users, title: 'Equipe Qualificada', description: 'Profissionais treinados e preparados para cuidar do que é mais precioso para você.' },
  { icon: Phone, title: 'Comunicação Direta', description: 'Canal aberto com os pais. Acompanhe pagamentos e status pelo nosso sistema online.' },
];

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary font-semibold text-sm uppercase tracking-widest">Por que nos escolher</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">
            Benefícios que fazem a <span className="text-primary">diferença</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Há mais de 10 anos levando crianças com segurança e carinho.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                <benefit.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}