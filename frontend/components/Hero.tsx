import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Eye: React.FC = () => {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;

      const rect = eyeRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
      const maxDistance = 12; 
      const distance = Math.min(
        maxDistance,
        Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 5
      );

      const pupilX = Math.cos(angle) * distance;
      const pupilY = Math.sin(angle) * distance;

      setPupilPos({ x: pupilX, y: pupilY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={eyeRef}
      className="relative w-16 h-16 md:w-32 md:h-32 rounded-full border-4 flex items-center justify-center overflow-hidden mx-1 md:mx-2 bg-white border-white"
    >
      <motion.div
        className="w-6 h-6 md:w-10 md:h-10 rounded-full bg-brand-neon"
        style={{ x: pupilPos.x, y: pupilPos.y }}
        transition={{ type: "spring", stiffness: 150, damping: 15 }}
      />
    </div>
  );
};

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.2]);

  const tagStyle = "absolute px-6 py-2 rounded-full text-lg md:text-2xl font-bold backdrop-blur-md border transition-colors select-none bg-white/5 border-white/10 text-white shadow-lg";

  const handleBloopNow = () => {
    navigate('/home');
  };

  return (
    <section 
      id="about"
      className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-48 z-10"
    >
      {/* Parallax Hashtags */}
      <motion.div style={{ y: y1 }} className={`${tagStyle} top-[15%] left-[5%] md:left-[10%] z-10`}>#AI</motion.div>
      <motion.div style={{ y: y2 }} className={`${tagStyle} bottom-[45%] right-[5%] md:right-[10%] z-10`}>#Gamified</motion.div>
      <motion.div className={`${tagStyle} top-[55%] left-[15%] opacity-80 z-10`}>#Creative</motion.div>
      <motion.div style={{ y: y2, x: 0 }} className={`${tagStyle} top-[25%] right-[15%] opacity-80 z-10`}>#Manim</motion.div>

      <motion.div 
        style={{ scale, opacity }}
        className="z-10 flex flex-col items-center mt-16 md:mt-24"
      >
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 1.2, ease: "easeOut" }}
           className="flex items-center font-extrabold text-6xl md:text-[10rem] tracking-tighter leading-none text-white"
        >
          <span>BL</span>
          <Eye />
          <Eye />
          <span>P</span>
        </motion.div>
        
        <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
            className="mt-8 text-lg md:text-2xl font-bold max-w-xl text-center px-4 text-brand-neon"
        >
            The playground for next-gen digital experiences.
        </motion.p>

        {/* Bloop Now Button */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1.2, ease: "easeOut" }}
            className="mt-10"
        >
            <button 
                onClick={handleBloopNow}
                className="bg-white text-black px-10 py-4 rounded-full font-bold text-xl hover:bg-brand-neon transition-all flex items-center gap-2 group shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(204,255,0,0.4)] active:scale-95"
            >
                Bloop Now
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;