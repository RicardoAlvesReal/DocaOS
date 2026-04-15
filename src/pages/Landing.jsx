import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import Footer from '@/components/landing/Footer';
import LoginModal from '@/components/LoginModal';
import { getSession } from '@/lib/authStore';

export default function Landing() {
  const [loginOpen, setLoginOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (session) {
      navigate(session.type === 'admin' ? '/admin' : '/aluno');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <Navbar onOpenLogin={() => setLoginOpen(true)} />
      <HeroSection onOpenLogin={() => setLoginOpen(true)} />
      <BenefitsSection />
      <Footer />
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}