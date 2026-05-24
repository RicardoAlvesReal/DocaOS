import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldCheck, Map, Star } from 'lucide-react';

const CAROUSEL_IMAGES = [
  'https://images.unsplash.com/photo-1688619103602-35c5b27a6619?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1636491628091-0a0dd357f46b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
];

export default function HeroSection({ onOpenLogin }) {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-slate-50 pt-32 pb-16 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

        {/* Left — texto */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium text-sm mb-6">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            O Futuro da Gestão de Frota Privada
          </div>

          <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
            Administre rotas e passageiros com{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              precisão
            </span>
            .
          </h1>

          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Plataforma completa para transporte escolar, transfers, excursões e fretados.
            Controle pagamentos, monitore veículos e fidelize seus clientes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onOpenLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 group"
            >
              Acessar Sistema
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2">
              Falar com Consultor
            </button>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex items-center gap-6 text-sm text-slate-500 font-medium">
            <div className="flex -space-x-3">
              <img
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1530882548122-0596ee66cdfd?crop=faces&fit=crop&w=100&h=100&q=80"
                alt="Motorista"
              />
              <img
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
                src="https://images.unsplash.com/photo-1533222535026-754c501569dd?crop=faces&fit=crop&w=100&h=100&q=80"
                alt="Passageiro"
              />
              <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                +1k
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-yellow-500 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span>Mais de 1000 viagens diárias.</span>
            </div>
          </div>
        </motion.div>

        {/* Right — carrossel com cards flutuantes */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl transform rotate-3 scale-105" />

          <div className="relative rounded-3xl shadow-2xl z-10 w-full h-[550px] overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={currentImg}
                src={CAROUSEL_IMAGES[currentImg]}
                alt="Frota RotaFlow"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
          </div>

          {/* Card flutuante — Status da Frota */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 z-20 flex gap-4 items-center"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="text-green-600 w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Status da Frota</p>
              <p className="text-lg font-bold text-slate-900">100% Operacional</p>
            </div>
          </motion.div>

          {/* Card flutuante — Rota em andamento */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
            className="absolute top-10 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 flex flex-col gap-2 w-48"
          >
            <div className="flex items-center justify-between">
              <Map className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Ao vivo</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1">Rota Centro-Sul</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-[70%]" />
            </div>
            <p className="text-xs text-slate-500 text-right">Faltam 5 min</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}