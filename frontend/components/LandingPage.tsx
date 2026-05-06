import React, { useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import FAQ from './FAQ';
import Footer from './Footer';
import InteractiveBackground from './InteractiveBackground';

const LandingPage: React.FC = () => {
  // Enforce dark mode on body
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative">
      <InteractiveBackground />
      <Header />
      <main className="relative z-10">
        <Hero />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;