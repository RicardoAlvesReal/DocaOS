import React from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { MessageCircle } from 'lucide-react';

const SOCIAL_LINKS = [
  { Icon: Facebook,       href: 'https://www.facebook.com/share/18aNfpJ7Tw/?mibextid=wwXIfr' },
  { Icon: Instagram,      href: 'https://www.instagram.com/toptourwerleyronconi?igsh=MTZoNWU0bzU2aHJkbQ==' },
  { Icon: MessageCircle,  href: 'https://wa.me/5527997114156' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center gap-6 text-center">
        {/* Logo */}
        <div className="flex items-center opacity-70">
          <img src="/logo-full.png" alt="RotaFlow" className="h-[150px] w-auto brightness-0 invert" />
        </div>

        {/* Social links */}
        <div className="flex gap-4">
          {SOCIAL_LINKS.map(({ Icon, href }, i) => (
            <a
              key={i}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition-colors"
            >
              <Icon className="w-4 h-4 text-white" />
            </a>
          ))}
        </div>

        <p className="text-sm">© 2026 RotaFlow Sistemas. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}