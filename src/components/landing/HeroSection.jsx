import React from 'react';
import { Button } from '@/components/ui/button';
import { Bus, Shield, Clock, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection({ onOpenLogin }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-secondary">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      {/* Blue glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full mb-8 text-sm font-medium">
              <Bus className="w-4 h-4" />
              Transporte Escolar Inteligente
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Seu filho seguro<br />
              <span className="text-primary">no caminho certo</span>
            </h1>
            <p className="text-lg text-white/50 mb-10 max-w-lg leading-relaxed">
              A VanEscolar+ une tecnologia e cuidado para garantir transporte seguro, 
              pontual e transparente para cada criança.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={onOpenLogin}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 h-14 rounded-xl shadow-xl shadow-primary/30 text-base gap-2"
              >
                Área de Acesso <ArrowRight className="w-5 h-5" />
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
              <div className="absolute -inset-6 bg-primary/5 rounded-3xl blur-2xl" />
              <div className="relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/8">
                <div className="text-center text-8xl mb-6 drop-shadow-lg">🚌</div>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon="🛡️" label="Segurança" value="100%" />
                  <StatCard icon="⏱️" label="Pontualidade" value="99.5%" />
                  <StatCard icon="📍" label="Rotas" value="25+" />
                  <StatCard icon="👦" label="Alunos" value="500+" />
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
    <div className="bg-white/5 border border-white/8 rounded-2xl p-4 text-center hover:bg-white/8 transition-colors">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/40 mt-0.5">{label}</div>
    </div>
  );
}