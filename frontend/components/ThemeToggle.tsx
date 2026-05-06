import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  const isDark = theme === 'dark';

  return (
    <div 
      onClick={toggleTheme}
      className={`relative w-16 h-8 rounded-full cursor-pointer flex items-center px-1 transition-colors duration-300 ${isDark ? 'bg-white/10 border border-white/20' : 'bg-gray-200 border border-gray-300'}`}
    >
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={`absolute w-6 h-6 rounded-full flex items-center justify-center shadow-lg ${isDark ? 'bg-brand-neon text-brand-black' : 'bg-white text-yellow-500'}`}
        style={{
          left: isDark ? 'auto' : '4px',
          right: isDark ? '4px' : 'auto',
        }}
      >
        {isDark ? <Moon size={14} fill="currentColor" /> : <Sun size={14} fill="currentColor" />}
      </motion.div>
    </div>
  );
};

export default ThemeToggle;