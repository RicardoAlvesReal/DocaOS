import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function HeroSection({ onOpenLogin }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: '#0a0c12' }}>
      {/* Background image with dark overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80')`,
          opacity: 0.25,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left text */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight mb-6">
              Transporte Escolar<br />
              <span className="text-blue-500">Seguro e<br />Confiável</span>
            </h1>
            <p className="text-sm text-white/50 mb-10 max-w-md uppercase tracking-widest leading-relaxed">
              Levamos seu filho para a escola com total segurança, pontualidade e conforto.
            </p>
            <Button
              onClick={onOpenLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 h-11 rounded-lg text-sm shadow-lg shadow-blue-600/30"
            >
              Área de acesso
            </Button>
          </motion.div>

          {/* Right image card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative w-full max-w-lg">
              <div className="absolute -inset-2 bg-blue-500/20 rounded-3xl blur-2xl" />
              <img
                src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800&q=80"
                alt="Ônibus escolar"
                className="relative w-full rounded-2xl object-cover shadow-2xl border border-white/10"
                style={{ height: 320 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}