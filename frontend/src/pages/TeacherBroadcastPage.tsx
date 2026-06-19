import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  ChevronRight, 
  X, 
  Tv, 
  Sliders, 
  RefreshCw, 
  Volume2, 
  Maximize2, 
  Sparkles, 
  Beaker, 
  Film,
  Award
} from 'lucide-react';

export function TeacherBroadcastPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const classId = searchParams.get('classId') || 'class-8-science';

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentSlide, setCurrentSlide] = useState<'video' | 'simulation'>('video');
  
  // Simulation Live Physics Parameters
  const [friction, setFriction] = useState(0.35);
  const [mass, setMass] = useState(50);
  const [gravity, setGravity] = useState(9.8);
  const [velocity, setVelocity] = useState(0);

  const handleResetParameters = () => {
    setFriction(0.35);
    setMass(50);
    setGravity(9.8);
    setVelocity(0);
  };

  const handleEndBroadcast = () => {
    navigate(`/teacher/class/${classId}`);
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0c0827] text-[#f6f4ee] flex flex-col justify-between overflow-hidden font-montserrat select-none">
      
      {/* 1. TOP STATUS BROADCAST BAR */}
      <header className="bg-black/40 border-b border-[#f6f4ee]/10 px-6 py-4.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full"></span> Live Projection
          </div>
          <span className="text-xs font-semibold opacity-60">|</span>
          <span className="text-xs font-black uppercase tracking-widest text-[#f6f4ee]/80 font-mono">
            Class 8 Science • Electromagnetic Friction
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-extrabold text-[#f6f4ee]/90 flex items-center gap-1">
            <Tv size={14} className="text-rose-400" /> Resolution: 1080p Web Cast
          </span>
          <button 
            onClick={handleEndBroadcast}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-full shadow transition-all"
          >
            <X size={14} className="stroke-[3]" /> End Presentation
          </button>
        </div>
      </header>

      {/* 2. THEATRICAL CONTENT BODY GRID */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[1fr_360px] overflow-hidden relative">
        
        {/* Main projection screen (Left) */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden bg-black/20">
          <AnimatePresence mode="wait">
            {currentSlide === 'video' ? (
              /* ACTIVE VIDEO ELEMENT MOCK */
              <motion.div
                key="video-slide"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-4xl aspect-video bg-[#1800ad]/15 border-2 border-white/10 rounded-[32px] relative overflow-hidden flex flex-col justify-between p-6 shadow-2xl"
              >
                {/* Embedded Video Graphic */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#13018c] to-[#401df4] opacity-80 z-0"></div>
                
                {/* Floating particle simulation effect inside layout */}
                <div className="absolute inset-0 z-0 opacity-25 flex items-center justify-between pointer-events-none">
                  <div className="w-20 h-20 bg-emerald-400 rounded-full blur-2xl animate-pulse"></div>
                  <div className="w-32 h-32 bg-amber-400 rounded-full blur-3xl animate-pulse delay-700"></div>
                </div>

                <div className="z-10 flex justify-between items-start">
                  <span className="text-[10px] bg-white/20 px-3.5 py-1 text-[#f6f4ee] font-black uppercase tracking-widest rounded-full font-mono">
                    Scene 1: Force Vectors & Inter locking
                  </span>
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-[#f6f4ee]/70" />
                    <Maximize2 size={16} className="text-[#f6f4ee]/70" />
                  </div>
                </div>

                {/* Conceptual vector illustrations */}
                <div className="z-10 flex flex-col items-center justify-center text-center py-10">
                  <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 text-[#f6f4ee] shadow-inner">
                    <Film size={36} className="animate-pulse" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black max-w-lg leading-tight tracking-tight text-white">
                    What creates Friction? Microscopic inter-locking forces.
                  </h2>
                  <p className="text-xs md:text-sm font-semibold text-rose-300 mt-2 tracking-wide uppercase font-mono">
                    {isPlaying ? '▶ Currently Playing Lecture Reel' : '⏸ Stream Paused by Presenter'}
                  </p>
                </div>

                <div className="z-10 mt-auto flex flex-col gap-2">
                  {/* Progress Seek bar */}
                  <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden cursor-pointer relative">
                    <div className={`bg-rose-500 h-full rounded-full transition-all duration-300 ${isPlaying ? 'w-[42%]' : 'w-[42%]'}`}></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-white/50 font-mono">
                    <span>02:18</span>
                    <span>05:30</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ACTIVE INTERACTIVE PHYSICS SIMULATION VARIABLE PREVIEW */
              <motion.div
                key="simulation-slide"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-4xl aspect-video bg-[#0c0827] border-2 border-white/10 rounded-[32px] relative overflow-hidden flex flex-col justify-between p-6 shadow-2xl"
              >
                {/* Block Physics representation */}
                <div className="absolute inset-0 bg-[#070417] z-0" />
                
                {/* Flat Plane floor */}
                <div className="absolute bottom-[25%] left-0 right-0 h-2 bg-[#f6f4ee]/20 z-10" />

                <div className="z-10 flex justify-between items-start">
                  <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 font-black uppercase tracking-wider rounded-full font-mono">
                    Sandbox Engine: Slate Block on Slideway
                  </span>
                  <div className="flex items-center gap-4 text-xs font-bold text-teal-400 font-mono">
                    <span>Friction forces: (μ = {friction.toFixed(2)})</span>
                    <span>Mass: {mass} kg</span>
                  </div>
                </div>

                {/* Animated Block component based on variables */}
                <div className="z-10 flex-1 flex items-center justify-center relative py-12">
                  <motion.div 
                    animate={{ 
                      x: isPlaying ? [0, 80, -20, 0] : 0 
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4, 
                      ease: "easeInOut" 
                    }}
                    className="w-28 h-20 bg-rose-600 rounded-2xl border-2 border-[#f6f4ee]/30 flex flex-col justify-center items-center font-bold text-[#f6f4ee] shadow-lg relative"
                  >
                    <span className="text-xs font-black uppercase tracking-wide">Block M1</span>
                    <span className="text-[10px] font-semibold opacity-80">{mass} kg</span>

                    {/* Vector Arrow pointing right showing force pulls */}
                    <div className="absolute -right-14 w-12 h-1.5 bg-emerald-400 flex items-center justify-end">
                      <div className="w-3 h-3 bg-emerald-400 rotate-45 -mr-1.5" />
                    </div>
                    <span className="absolute -right-14 -top-5 text-[9px] font-black uppercase text-emerald-400">Pull Force</span>

                    {/* Left dragging resistance vector arrow */}
                    <div className="absolute -left-12 w-10 h-1.5 bg-rose-400 flex items-center">
                      <div className="w-3 h-3 bg-rose-400 rotate-45 -ml-1.5" />
                    </div>
                    <span className="absolute -left-14 -top-5 text-[9px] font-black uppercase text-rose-300">Friction forces</span>
                  </motion.div>
                </div>

                <div className="z-10 flex flex-wrap gap-4 items-center justify-center text-xs font-black uppercase tracking-wide text-[#f6f4ee]/80 font-mono">
                  <div className="px-3.5 py-1.5 bg-white/5 rounded-xl border border-white/10">
                    Calculated pull Threshold: <span className="text-[#3ed4d4] font-bold">{(mass * gravity * friction).toFixed(1)} N</span>
                  </div>
                  <div className="px-3.5 py-1.5 bg-white/5 rounded-xl border border-white/10">
                    Real gravity constant: <span className="text-amber-400 font-bold">{gravity.toFixed(1)} m/s²</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Presenter Parameter Tuning Column (Right) */}
        <div className="w-full md:w-[360px] bg-black/40 border-l border-[#f6f4ee]/10 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
          
          <div className="flex flex-col gap-6">
            <div className="border-b border-[#f6f4ee]/10 pb-4">
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-1.5 text-pink-400 leading-none">
                <Sliders size={16} /> Variable Tuner
              </h3>
              <p className="text-[11px] font-semibold text-[#f6f4ee]/65 mt-1.5 leading-snug">
                Friction variables are applied live onto the chalkboard projector. Drag sliders to trigger real-time physical calculations.
              </p>
            </div>

            {/* LIVE ADJUSTMENT SLIDERS */}
            <div className="flex flex-col gap-5">
              
              {/* Slider 1: Coefficient */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="opacity-70">Friction Coeff (μ)</span>
                  <span className="text-emerald-400 font-mono">{(friction).toFixed(2)}</span>
                </div>
                <input 
                  type="range"
                  min="0.05"
                  max="1.00"
                  step="0.05"
                  value={friction}
                  onChange={(e) => setFriction(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-white/10 rounded-full cursor-pointer outline-none focus:outline-none"
                />
                <div className="flex justify-between text-[9px] font-semibold text-white/40">
                  <span>Ice (0.05)</span>
                  <span>Adhesive (1.0)</span>
                </div>
              </div>

              {/* Slider 2: Mass */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="opacity-70">Mass BlockWeight</span>
                  <span className="text-emerald-400 font-mono">{mass} kg</span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={mass}
                  onChange={(e) => setMass(parseInt(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-white/10 rounded-full cursor-pointer outline-none focus:outline-none"
                />
                <div className="flex justify-between text-[9px] font-semibold text-white/40">
                  <span>5 kg</span>
                  <span>200 kg</span>
                </div>
              </div>

              {/* Slider 3: Gravity */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider">
                  <span className="opacity-70">Attraction Gravity</span>
                  <span className="text-emerald-400 font-[#f6f4ee] font-mono">{gravity.toFixed(1)} m/s²</span>
                </div>
                <input 
                  type="range"
                  min="1.6"
                  max="24.8"
                  step="0.1"
                  value={gravity}
                  onChange={(e) => setGravity(parseFloat(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-white/10 rounded-full cursor-pointer outline-none"
                />
                <div className="flex justify-between text-[9px] font-semibold text-white/40">
                  <span>Moon (1.6)</span>
                  <span>Jupiter (24.8)</span>
                </div>
              </div>

            </div>
          </div>

          {/* Quick preset settings actions */}
          <div className="flex flex-col gap-3.5 mt-8 border-t border-[#f6f4ee]/10 pt-6">
            <button
              onClick={handleResetParameters}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} /> Reset Parameters
            </button>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-[10px] leading-relaxed text-[#f6f4ee]/70">
              <span className="font-extrabold text-[#f6f4ee] uppercase block mb-1">Classroom Formula checklist</span>
              F₁ = μ • F_N where normal force F_N is calculated via F_N = m • g. Real-time friction bounds react to incline shifts.
            </div>
          </div>

        </div>

      </div>

      {/* 3. BROADCAST PRESENTATION FOOTER METRIC CONTROL BAR */}
      <footer className="bg-[#070417] border-t border-[#f6f4ee]/15 p-5 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0 z-10 text-[#f6f4ee]">
        
        {/* Play Pause Controls */}
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            {isPlaying ? (
              <Pause size={20} className="fill-white font-black" />
            ) : (
              <Play size={20} className="fill-white font-black ml-1" />
            )}
          </button>
          
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider">{isPlaying ? 'Presenting Stream' : 'Stream Paused'}</span>
            <span className="text-[10px] text-teal-400 font-bold font-mono">Student screens synchronized</span>
          </div>
        </div>

        {/* Content item navigator tabs (staggered sliders/tabs!) */}
        <div className="flex gap-2.5 bg-white/5 rounded-full p-1.5 border border-white/15">
          <button
            onClick={() => setCurrentSlide('video')}
            className={`px-5 py-2 whitespace-nowrap rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              currentSlide === 'video' ? 'bg-[#1800ad] text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            1. Lecture Video
          </button>
          <button
            onClick={() => setCurrentSlide('simulation')}
            className={`px-5 py-2 whitespace-nowrap rounded-full text-xs font-black uppercase tracking-wider transition-all ${
              currentSlide === 'simulation' ? 'bg-[#1800ad] text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            2. Buoyancy sandbox
          </button>
        </div>

        {/* Forward Content Item controls */}
        <div className="flex gap-3 scale-95 origin-right">
          <button
            onClick={() => setCurrentSlide(currentSlide === 'video' ? 'simulation' : 'video')}
            className="bg-white/15 hover:bg-white/20 hover:scale-102 text-white px-5 py-3 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 transition-all"
          >
            Next Activity <ChevronRight size={14} className="stroke-[3.5]" />
          </button>
        </div>

      </footer>

    </div>
  );
}
