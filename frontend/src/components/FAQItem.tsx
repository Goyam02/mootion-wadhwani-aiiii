import React, { useState } from 'react';
import { motion } from 'motion/react';

export function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="w-full border-b border-[#f6f4ee]/30 py-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex justify-between items-center">
        <h3 className="text-[#f6f4ee] font-montserrat font-medium text-lg md:text-xl lg:text-2xl pt-2 pb-2 pr-4">{question}</h3>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f6f4ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </motion.div>
      </div>
      <motion.div 
        initial={{ height: 0, opacity: 0 }} 
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="text-[#f6f4ee] opacity-80 pt-2 pb-4 font-montserrat text-sm md:text-base leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}
