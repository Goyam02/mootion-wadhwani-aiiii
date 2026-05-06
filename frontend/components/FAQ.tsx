import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "What exactly is BLOOP?",
    answer: "BLOOP is a creative technology studio and digital playground. We blend AI, motion graphics, and interactive web design to build experiences that feel like the future."
  },
  {
    question: "Is this open source?",
    answer: "Parts of our stack like the 'OCR Lab' and basic 'Video Forge' templates are open-sourced on our GitHub. The core studio tools are available for enterprise partners."
  },
  {
    question: "How do I join the team?",
    answer: "We are always looking for creative technologists, WebGL wizards, and design engineers. Drop your portfolio in the contact form below."
  },
  {
    question: "Can I use your design system?",
    answer: "Our design system 'Neon-Core' will be released as a public NPM package in Q4 2024."
  }
];

const FAQItem: React.FC<{ item: typeof faqs[0]; isOpen: boolean; onClick: () => void }> = ({ item, isOpen, onClick }) => {
  return (
    <div className="border-b transition-colors border-white/10">
      <button 
        onClick={onClick}
        className="w-full py-8 flex items-center justify-between text-left group"
      >
        <span className={`text-xl md:text-3xl font-bold transition-colors ${
            isOpen 
                ? 'text-brand-neon'
                : 'text-white group-hover:text-gray-300'
        }`}>
          {item.question}
        </span>
        <div className={`p-2 rounded-full border transition-all ${
            isOpen 
                ? 'bg-brand-neon border-brand-neon text-black'
                : 'border-white/20 text-gray-400'
        }`}>
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-lg leading-relaxed text-gray-400">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 bg-[#0A0A0A] relative overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-grid-white opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto relative z-10"
      >
        <div className="flex items-end gap-4 mb-12">
            <h2 className="text-4xl font-bold text-white">FAQ</h2>
            <div className="h-1 flex-grow mb-3 rounded-full bg-white/10" />
        </div>
        
        <div>
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index} 
              item={faq} 
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default FAQ;