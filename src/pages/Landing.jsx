import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import PricingSection from '@/components/landing/PricingSection';
import Footer from '@/components/landing/Footer';
import LoginModal from '@/components/LoginModal';
import { getSession } from '@/lib/authStore';

export default function Landing() {
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (session) {
      const dest =
        session.type === 'super_admin' ? '/super-admin' :
        session.type === 'empresa'     ? '/empresa'     : '/';
      navigate(dest);
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar onOpenLogin={() => setLoginOpen(true)} />
      <HeroSection onOpenLogin={() => setLoginOpen(true)} />
      <PricingSection />
      <FeaturesSection />
      <BenefitsSection />
      <Footer />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}