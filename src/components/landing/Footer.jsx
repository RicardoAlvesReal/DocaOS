import React from 'react';
import { Bus, Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: '#000000' }} className="border-t border-white/5">
      {/* Map */}
      <div className="w-full h-72 overflow-hidden">
        <iframe
          title="Localização"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975!2d-46.6543!3d-23.5637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce59c8da0aa315%3A0xd59f9431f2c9776a!2sAv.%20Paulista%2C%20S%C3%A3o%20Paulo%20-%20SP!5e0!3m2!1spt-BR!2sbr!4v1681000000000!5m2!1spt-BR!2sbr"
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'grayscale(20%) brightness(0.85)' }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      {/* Footer content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Bus className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-lg">
                VanEscolar<span className="text-blue-500">+</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#8b92a5' }}>
              Transporte escolar seguro e confiável há mais de 10 anos. Seu filho em boas mãos, sempre.
            </p>
          </div>

          {/* Links Rápidos */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Links Rápidos</p>
            <ul className="space-y-2.5">
              {['Serviços', 'Segurança', 'Contato', 'Trabalhe Conosco'].map(l => (
                <li key={l}>
                  <span className="text-sm cursor-pointer hover:text-white transition-colors" style={{ color: '#8b92a5' }}>
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Informações Legais */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Informações Legais</p>
            <ul className="space-y-2.5">
              {['Política de Privacidade', 'Termos de Uso', 'Certificações', 'FAQ'].map(l => (
                <li key={l}>
                  <span className="text-sm cursor-pointer hover:text-white transition-colors" style={{ color: '#8b92a5' }}>
                    {l}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Redes Sociais */}
          <div>
            <p className="text-white font-semibold text-sm mb-4">Redes Sociais</p>
            <div className="flex gap-3 mb-4">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors hover:bg-blue-600"
                  style={{ background: '#1e2535' }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </button>
              ))}
            </div>
            <p className="text-xs" style={{ color: '#8b92a5' }}>
              Siga-nos nas redes sociais e fique por dentro das novidades!
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 mt-10 pt-6 text-center">
          <p className="text-xs" style={{ color: '#4a5165' }}>
            © 2026 VanEscolar+. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}