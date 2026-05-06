import React from 'react';
import { motion } from 'framer-motion';
import { Twitter, Instagram, Github, ArrowRight } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer id="contact" className="relative pt-24 pb-12 px-6 bg-black border-t border-white/5 overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-grid-white opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10"
      >
        
        {/* Contact Section */}
        <div>
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
            Let's build <br/>
            <span className="text-brand-neon">the impossible.</span>
          </h2>
          <p className="text-xl mb-8 max-w-md text-gray-400">
            Got an idea? We have the engines. Reach out to start your next project with BLOOP.
          </p>

          <form className="space-y-4 max-w-md" onSubmit={(e) => e.preventDefault()}>
            <div className="group relative flex items-center p-1 rounded-2xl border-2 transition-colors focus-within:ring-2 bg-white/5 border-white/10 focus-within:border-brand-neon focus-within:ring-brand-neon/20">
              <input 
                type="email" 
                placeholder="enter your email..." 
                className="w-full bg-transparent px-6 py-4 outline-none font-medium text-white placeholder-gray-500"
              />
              <button className="mr-1 p-3 rounded-xl transition-transform hover:scale-105 bg-white text-black hover:bg-brand-neon">
                <ArrowRight size={24} />
              </button>
            </div>
          </form>
        </div>

        {/* Links & Socials */}
        <div className="flex flex-col justify-between md:items-end">
            <div className="grid grid-cols-2 gap-12 text-lg mb-12">
                <div className="flex flex-col gap-4">
                    <span className="font-bold opacity-50 text-white">Sitemap</span>
                    <a href="#" className="hover:underline text-gray-300 hover:text-brand-neon">Home</a>
                    <a href="#features" className="hover:underline text-gray-300 hover:text-brand-neon">Features</a>
                    <a href="#faq" className="hover:underline text-gray-300 hover:text-brand-neon">FAQ</a>
                </div>
                <div className="flex flex-col gap-4">
                    <span className="font-bold opacity-50 text-white">Sitemap</span>
                    <a href="#" className="hover:underline text-gray-300 hover:text-brand-neon">Twitter</a>
                    <a href="#" className="hover:underline text-gray-300 hover:text-brand-neon">Instagram</a>
                    <a href="#" className="hover:underline text-gray-300 hover:text-brand-neon">LinkedIn</a>
                </div>
            </div>

            <div className="flex gap-4">
                {[Twitter, Instagram, Github].map((Icon, i) => (
                    <a key={i} href="#" className="p-3 rounded-full border transition-colors border-white/20 text-white hover:bg-brand-neon hover:text-black">
                        <Icon size={20} />
                    </a>
                ))}
            </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-24 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium border-white/10 text-gray-500 relative z-10"
      >
        <span>© 2024 BLOOP Studio. All rights reserved.</span>
        <span className="px-3 py-1 rounded-full border border-current text-xs uppercase tracking-wider">
            Made with BLOOP
        </span>
      </motion.div>
    </footer>
  );
};

export default Footer;