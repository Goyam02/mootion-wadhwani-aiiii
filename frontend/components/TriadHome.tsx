import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { AppMode } from '../types';

const ModeCard = ({
  title,
  modeName,
  subtitle,
  to
}: {
  title: string;
  modeName: AppMode;
  subtitle: string;
  to: string;
}) => (
  <Link to={to} className="group relative flex-1 min-h-[180px] cursor-pointer overflow-hidden bg-gradient-to-b from-zinc-900 to-[#050a06] rounded-3xl border border-zinc-800 transition-all duration-500 hover:border-brand-neon/50 hover:shadow-[0_0_30px_rgba(204,255,0,0.15)] flex flex-col justify-between p-8">
    {/* Default Subtle Glow (fixes weird black) */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-zinc-800/10 blur-[40px] rounded-full group-hover:opacity-0 transition-opacity duration-500 pointer-events-none" />

    {/* Green Light Hover Effect */}
    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-neon/20 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none translate-x-1/4 -translate-y-1/4" />

    {/* Background Texture (Subtle) */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

    {/* Top Section: Typography (Moved up) */}
    <div className="relative z-10">
      <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight text-white group-hover:text-brand-neon transition-colors duration-300">
        {title}<span className="text-brand-neon text-5xl leading-none">.</span>
      </h2>
      <p className="font-sans text-sm text-zinc-500 mt-2 font-medium tracking-wide group-hover:text-zinc-300 transition-colors">{subtitle}</p>
    </div>

    {/* Bottom Section: Just Arrow */}
    <div className="relative z-10 flex justify-end items-end">
      <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
        <ArrowUpRight size={28} className="text-brand-neon" />
      </div>
    </div>
  </Link>
);

const TriadHome: React.FC = () => (
  <div className="relative flex items-center justify-center min-h-screen w-full p-6 md:p-8 z-10">
    {/* Container for Cards - Full Height */}
    <div className="w-full max-w-6xl flex flex-col md:flex-row gap-6 h-full md:h-[80vh] max-h-[800px] animate-rise-up">
      <ModeCard
        title="Ask"
        modeName={AppMode.ASK}
        subtitle="Knowledge Core"
        to="/ask"
      />
      <ModeCard
        title="Plan"
        modeName={AppMode.PLAN}
        subtitle="Strategy Engine"
        to="/plan"
      />
      <ModeCard
        title="Play"
        modeName={AppMode.PLAY}
        subtitle="Creative Lab"
        to="/play"
      />
    </div>
  </div>
);

export default TriadHome;