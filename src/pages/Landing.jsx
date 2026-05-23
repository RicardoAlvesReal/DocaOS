import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import FleetSection from '@/components/landing/FleetSection';
import Footer from '@/components/landing/Footer';
import { getSession } from '@/lib/authStore';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate(session.type === 'admin' ? '/admin' : '/aluno');
    }
  }, [navigate]);

  const goToAcesso = () => navigate('/acesso');

  return (
    <div className="min-h-screen">
      <Navbar onOpenLogin={goToAcesso} />
      <HeroSection onOpenLogin={goToAcesso} />
      <BenefitsSection />
      <FleetSection />
      <Footer />
    </div>
  );
}