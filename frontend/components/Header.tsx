import React, { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { name: "About Us", href: "#features" }, // Points to Our Core Engine
    { name: "FAQ", href: "#faq" },           // Points to FAQ section
    { name: "Contact", href: "#contact" },   // Points to Footer
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 px-6 py-6 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/50 backdrop-blur-xl border-b border-white/10 py-4' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center gap-2 z-20">
           <span className="font-extrabold text-2xl tracking-tighter text-brand-neon">
             BLOOP
           </span>
        </div>

        {/* Desktop Nav - Centered */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 px-2 py-1.5 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className="px-5 py-2 rounded-full text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden z-20 ml-auto" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
            {mobileMenuOpen ? <X className="text-white" /> : <Menu className="text-white" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 p-6 flex flex-col gap-4 shadow-xl md:hidden bg-black border-b border-white/10"
        >
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-bold text-white hover:text-brand-neon"
            >
              {link.name}
            </a>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;