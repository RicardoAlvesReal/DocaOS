import React from 'react';
import { Button } from '@/components/ui/button';
import { Bus, Shield, Clock, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection({ onOpenLogin }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-secondary/80" />
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-8xl">🚌</div>
        <div className="absolute top-40 right-20 text-6xl">🚌</div>
        <div className="absolute bottom-32 left-1/4 text-7xl">🚌</div>
        <div className="absolute bottom-20 right-10 text-5xl">🚌</div>
        <div className="absolute top-60 left-1/2 text-9xl">🚌</div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full mb-6">
              <Bus className="w-5 h-5" />
              <span className="text-sm font-semibold">Transporte Escolar de Confiança</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Seu filho seguro
              <span className="block text-primary">no caminho da escola</span>
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
              A VanEscolar+ oferece transporte escolar com pontualidade, segurança e 
              o carinho que seu filho merece. Confie em quem cuida como família.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={onOpenLogin}
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/30"
              >
                🚪 Área de Acesso
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-3xl" />
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <div className="text-center text-9xl mb-4">🚌</div>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard icon={<Shield className="w-6 h-6" />} label="Segurança" value="100%" />
                  <StatCard icon={<Clock className="w-6 h-6" />} label="Pontualidade" value="99.5%" />
                  <StatCard icon={<MapPin className="w-6 h-6" />} label="Rotas" value="25+" />
                  <StatCard icon={<Bus className="w-6 h-6" />} label="Alunos" value="500+" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white/10 rounded-xl p-4 text-center border border-white/5">
      <div className="text-primary mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}