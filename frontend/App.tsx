import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, X } from 'lucide-react';
import { AppMode } from './types';
import AskModule from './components/AskModule';
import PlanModule from './components/PlanModule';
import PlayModule from './components/PlayModule';
import LandingPage from './components/LandingPage';
import TriadHome from './components/TriadHome';

const App: React.FC = () => {
  const ModuleLayout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    return (
      <div className="flex flex-col h-screen w-full bg-brand-black animate-fade-in relative z-10">
        {/* Floating Home/Close Button (Minimal Header Replacement) */}
        <div className="absolute top-6 right-6 z-50">
           <button 
              onClick={() => navigate('/home')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-brand-neon transition-all hover:scale-105 shadow-xl backdrop-blur-sm hover:shadow-[0_0_15px_rgba(204,255,0,0.5)]"
              title="Back to Home"
            >
              <X size={20} />
           </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </div>
    );
  };

  return (
    <main className="bg-brand-black min-h-screen w-full flex flex-col overflow-hidden text-brand-text relative">
      {/* Global Grid Background */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid pointer-events-none opacity-20 z-0" />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<TriadHome />} />
        <Route path="/ask" element={<ModuleLayout><AskModule /></ModuleLayout>} />
        <Route path="/plan" element={<ModuleLayout><PlanModule /></ModuleLayout>} />
        <Route path="/play" element={<ModuleLayout><PlayModule /></ModuleLayout>} />
      </Routes>
    </main>
  );
};

export default App;