import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Bus, Map, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router";
import { useState, useEffect } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import caminhoDaEscolaImg from "../../imports/4323fcb0-6688-47f4-8418-f5514d207056.jpeg";

const CAROUSEL_IMAGES = [
  caminhoDaEscolaImg,
  "https://images.unsplash.com/photo-1688619103602-35c5b27a6619?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcHJpbnRlciUyMHZhbnxlbnwxfHx8fDE3NzkyNjg5ODB8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1636491628091-0a0dd357f46b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjB2YW4lMjBicmF6aWx8ZW58MXx8fHwxNzc5NTkxNjk2fDA&ixlib=rb-4.1.0&q=80&w=1080"
];

export function LandingPage() {
  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Bus className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Rota<span className="text-blue-600">Flow</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#funcionalidades" className="hover:text-blue-600 transition-colors">Funcionalidades</a>
            <a href="#servicos" className="hover:text-blue-600 transition-colors">Serviços</a>
            <a href="#depoimentos" className="hover:text-blue-600 transition-colors">Depoimentos</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="hidden sm:block text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Login
            </Link>
            <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-blue-600/25 flex items-center gap-2 group">
              Acessar Sistema
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
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
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Administre rotas e passageiros com <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">precisão</span>.
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Plataforma completa para transporte escolar, transfers, excursões e fretados. Controle pagamentos, monitore veículos em tempo real e fidelize seus clientes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 group">
                Ver Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2">
                Falar com Consultor
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-sm text-slate-500 font-medium">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-white" src="https://images.unsplash.com/photo-1530882548122-0596ee66cdfd?crop=faces&fit=crop&w=100&h=100&q=80" alt="Motorista" />
                <img className="w-10 h-10 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1533222535026-754c501569dd?crop=faces&fit=crop&w=100&h=100&q=80" alt="Crianças" />
                <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-600">+1k</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-yellow-500 mb-1">
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <span>Mais de 1000 viagens diárias.</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-3xl transform rotate-3 scale-105" />
            
            <div className="relative rounded-3xl shadow-2xl z-10 w-full h-[600px] overflow-hidden">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentImg}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full"
                >
                  <ImageWithFallback 
                    src={CAROUSEL_IMAGES[currentImg]} 
                    alt="Transporte Escolar e Fretamento"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Floating Card */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 z-20 flex gap-4 items-center"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="text-green-600 w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">Status da Frota</p>
                <p className="text-lg font-bold text-slate-900">100% Operacional</p>
              </div>
            </motion.div>

            {/* Floating Map Pin */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute top-12 -right-8 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-20 flex flex-col gap-2 w-48"
            >
              <div className="flex items-center justify-between">
                <Map className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Ao vivo</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 mt-1">Rota Centro-Sul</p>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-blue-600 h-full w-[70%]" />
              </div>
              <p className="text-xs text-slate-500 text-right">Faltam 5 min</p>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Features/Services Section */}
      <section id="servicos" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Um sistema para todo tipo de transporte</h2>
            <p className="text-lg text-slate-600">A versatilidade que você precisa, independentemente de qual seja a sua modalidade de atuação no transporte privado.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Transporte Escolar",
                desc: "Controle mensalidades, gerencie alunos por escola, roteirize a busca e informe os pais em tempo real.",
                img: "https://images.unsplash.com/photo-1533222535026-754c501569dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGtpZHMlMjBzY2hvb2x8ZW58MXx8fHwxNzc5NTkwNjY1fDA&ixlib=rb-4.1.0&q=80&w=800",
                icon: "🎒"
              },
              {
                title: "Transfers & Fretados",
                desc: "Agendamento corporativo, emissão de boletos, gestão de motoristas e controle de manutenção da frota.",
                img: "https://images.unsplash.com/photo-1552561018-5fea54c08479?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjB2YW4lMjB0cmFuc2ZlcnxlbnwxfHx8fDE3Nzk1OTA2NjV8MA&ixlib=rb-4.1.0&q=80&w=800",
                icon: "👔"
              },
              {
                title: "Excursões & Viagens",
                desc: "Venda de passagens, lista de embarque digital, acompanhamento do trajeto e gestão de guias.",
                img: "https://images.unsplash.com/photo-1604357209793-fca5dca89f97?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
                icon: "🗺️"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-3xl overflow-hidden bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border border-slate-100"
              >
                <div className="h-48 overflow-hidden relative">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
      
      {/* Footer minimalista */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-center">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-6 opacity-50 grayscale">
             <Bus className="w-6 h-6" />
             <span className="text-xl font-bold text-white tracking-tight">RotaFlow</span>
          </div>
          <p>© 2026 RotaFlow Sistemas. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
