import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Instagram, Github } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Eye } from '../components/Eye';
import { FAQItem } from '../components/FAQItem';

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggable, setIsDraggable] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  
  const userHasControlRef = useRef(false);
  const mousePosRef = useRef({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
  });
  
  const fakeMouseActiveRef = useRef(true);
  const fakeMousePosRef = useRef({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
  });
  const [heroLoaded, setHeroLoaded] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsDraggable(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroLoaded(true);
    }, 7600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      if (!fakeMouseActiveRef.current) {
        userHasControlRef.current = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    let startTime = Date.now();
    let animationFrameId: number;

    const textStart = 2000;
    const textDuration = 6 * 500; // 0 to 6 means 7 letters, last letter starts at 5.0s 
    const textEnd = textStart + textDuration;
    const rollbackStart = 5600;
    const rollbackDuration = 800;

    const animateSimulatedMouse = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed < textStart) {
        // Look center before text starts appearing
        fakeMousePosRef.current = {
           x: window.innerWidth / 2,
           y: window.innerHeight * 0.4
        };
      } else if (elapsed >= textStart && elapsed <= textEnd) {
        // Text is appearing from 2.0s to 5.0s
        const progress = (elapsed - textStart) / textDuration; // 0 to 1
        fakeMousePosRef.current = {
           x: window.innerWidth * (0.25 + (progress * 0.5)),
           y: window.innerHeight * 0.6
        };
      } else if (elapsed > textEnd && elapsed < rollbackStart) {
        // Hold position at the end of the text
        fakeMousePosRef.current = {
           x: window.innerWidth * 0.75,
           y: window.innerHeight * 0.6
        };
      } else if (elapsed >= rollbackStart && elapsed <= rollbackStart + rollbackDuration) {
        // Roll back to center
        const progress = (elapsed - rollbackStart) / rollbackDuration;
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        const startX = window.innerWidth * 0.75;
        const startY = window.innerHeight * 0.6;
        const endX = window.innerWidth / 2;
        const endY = window.innerHeight / 2;
        fakeMousePosRef.current = {
           x: startX + (endX - startX) * ease,
           y: startY + (endY - startY) * ease
        };
      } else {
         fakeMouseActiveRef.current = false; // Return to real cursor trigger flag
         return; // done
      }
      
      if (elapsed < rollbackStart + rollbackDuration + 100) {
        animationFrameId = requestAnimationFrame(animateSimulatedMouse);
      }
    };
    
    animationFrameId = requestAnimationFrame(animateSimulatedMouse);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const cardsData = [
    {
      text: "Don't observe.\nExperiment.",
      bg: "#1800ad",
      textCol: "#ffffff",
      border: "none",
    },
    {
      text: "Don't struggle.\nVisualize.",
      bg: "#ffffff",
      textCol: "#2c2c2c",
      border: "1px solid #1800ad",
    },
    {
      text: "Don't imagine.\nExperience.",
      bg: "#1800ad",
      textCol: "#ffffff",
      border: "none",
    },
    {
      text: "Teach and\nLearn.",
      bg: "#ffffff",
      textCol: "#2c2c2c",
      border: "1px solid #1800ad",
    }
  ];

  return (
    <>
      <style>
        {`
          html, body, #root {
            background-color: #f6f4ee !important;
          }
          @media (max-width: 1024px) {
            html, body {
              scroll-snap-type: y mandatory;
              overflow-x: hidden;
            }
            #root, .mobile-snap-wrapper {
              display: contents;
            }
          }
        `}
      </style>
      <div className="w-full bg-[#f6f4ee] overflow-x-hidden min-h-[100dvh] mobile-snap-wrapper">
        <section 
          className="relative snap-start h-[100dvh] lg:h-[100dvh] w-full flex flex-col justify-end lg:justify-start overflow-hidden pt-10 sm:pt-14 md:pt-16 lg:pt-20" 
        >
        <nav className="absolute top-0 left-0 w-full flex justify-between items-center px-6 md:px-16 py-6 font-montserrat z-10 text-xs sm:text-sm md:text-base font-medium tracking-widest text-[#2c2c2c]">
          <div className="text-[#1800ad] font-bold">MOOTION</div>
          <div className="hidden sm:flex gap-6 md:gap-12 lg:gap-24">
            <a href="#" className="hover:text-[#1800ad] transition-colors">HOME</a>
            <a href="#" className="hover:text-[#1800ad] transition-colors">ABOUT US</a>
            <a href="#" className="hover:text-[#1800ad] transition-colors">CONTACT</a>
          </div>
          <div>
            <button onClick={() => navigate('/onboarding')} className="hover:text-[#1800ad] transition-colors cursor-pointer bg-transparent border-none font-montserrat tracking-widest uppercase font-medium">LOG IN</button>
          </div>
        </nav>

        <div 
          className="relative left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 w-[280vw] sm:w-[150vw] lg:w-full aspect-[2/1] lg:aspect-[2/1] flex flex-col justify-start items-center pt-[15vw] sm:pt-[8vw] lg:pt-[5%] flex-shrink-0" 
          style={{ 
            backgroundColor: '#1800ad',
            borderRadius: '50% 50% 0 0 / 100% 100% 0 0'
          }}
        >
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0, type: 'spring', bounce: 0.4 }}
          className="flex justify-center gap-[2%] w-full"
        >
          <Eye mousePosRef={mousePosRef} fakeMouseActiveRef={fakeMouseActiveRef} fakeMousePosRef={fakeMousePosRef} userHasControlRef={userHasControlRef} className="w-[10%] sm:w-[12%] lg:w-[12%] aspect-square max-w-[180px] min-w-[60px]" />
          <Eye mousePosRef={mousePosRef} fakeMouseActiveRef={fakeMouseActiveRef} fakeMousePosRef={fakeMousePosRef} userHasControlRef={userHasControlRef} className="w-[10%] sm:w-[12%] lg:w-[12%] aspect-square max-w-[180px] min-w-[60px]" />
        </motion.div>
        <div className="flex flex-col items-center mt-[5%] sm:mt-[6%] lg:mt-[3%]">
          <div 
            className="text-[#f6f4ee] font-val text-[16vw] lg:text-[11vw] leading-none tracking-wider flex"
            style={{
              textShadow: '1px 1px 0px black, 2px 2px 0px black, 3px 3px 0px black, 4px 4px 0px black, 5px 5px 0px black, 6px 6px 0px black'
            }}
          >
            {"MOOTION".split("").map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.0 + (index * 0.5) }}
              >
                {char}
              </motion.span>
            ))}
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 6.2 }}
            className="text-[#f6f4ee] font-montserrat font-medium mt-1 md:mt-2 text-[4vw] sm:text-lg md:text-xl lg:text-2xl"
          >
            Where concepts are taught in motion
          </motion.div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 7.0, type: "spring", bounce: 0.5 }}
          >
            <button onClick={() => navigate('/onboarding')} className="mt-10 sm:mt-4 md:mt-4 px-6 sm:px-5 md:px-6 lg:px-8 py-2 sm:py-[6px] md:py-2 lg:py-3 bg-[#f6f4ee] text-black font-montserrat text-sm sm:text-xs md:text-sm lg:text-lg font-medium rounded-full border-2 border-transparent hover:border-[#f6f4ee] hover:bg-[#1800ad] hover:text-[#f6f4ee] transition-all duration-300 cursor-pointer flex items-center justify-center">
              Start Now
            </button>
          </motion.div>
        </div>
      </div>
    </section>
      
      {heroLoaded && (
        <>
          <section className="snap-start min-h-[100dvh] lg:min-h-0 w-full flex flex-col items-center justify-center lg:justify-start pt-4 lg:pt-28 pb-8 md:pb-24 px-2 sm:px-4 overflow-hidden relative" ref={containerRef}>
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-[#1800ad] font-val text-5xl sm:text-6xl md:text-8xl lg:text-[7vw] leading-none tracking-widest text-center relative z-0"
              style={{
                textShadow: '1px 1px 0px black, 2px 2px 0px black, 3px 3px 0px black, 4px 4px 0px black'
              }}
            >
              ABOUT US
            </motion.h2>

            <div className="w-full max-w-[1300px] mt-6 md:mt-8 lg:mt-16 flex flex-row flex-wrap lg:flex-nowrap justify-center items-stretch gap-4 sm:gap-6 md:gap-8 lg:gap-12 z-20 px-2 sm:px-4">
              {cardsData.map((card, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                  drag={isDraggable}
                  dragConstraints={containerRef}
                  dragElastic={0}
                  dragMomentum={false}
                  whileHover={isDraggable ? { scale: 1.05, boxShadow: '0 20px 35px rgba(0,0,0,0.15)' } : {}}
                  whileTap={isDraggable ? { cursor: 'grabbing', scale: 1.02 } : {}}
                  className={`${isDraggable ? 'cursor-grab' : 'cursor-default'} w-[calc(50%-8px)] sm:w-[calc(50%-12px)] md:w-[280px] lg:w-[300px] h-[220px] sm:h-[280px] md:h-[340px] p-4 sm:p-5 md:p-6 rounded-xl md:rounded-2xl flex flex-col justify-end items-start shadow-sm shrink-0`}
                  style={{ 
                    backgroundColor: card.bg, 
                    color: card.textCol,
                    border: card.border
                  }}
                >
                  <div className="font-montserrat font-medium text-[3.5vw] sm:text-base md:text-lg lg:text-xl whitespace-pre-line leading-tight pointer-events-none">
                    {card.text}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="snap-start min-h-[100dvh] lg:min-h-0 w-full flex flex-col items-center justify-center lg:justify-start py-16 md:py-20 lg:py-28 px-4 md:px-8 overflow-hidden relative bg-[#1800ad] mt-8 md:mt-12 lg:mt-16">
            <motion.h2 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-[#f6f4ee] font-val text-5xl sm:text-6xl md:text-8xl lg:text-[7vw] leading-none tracking-widest text-center relative z-0 uppercase"
              style={{
                textShadow: '1px 1px 0px black, 2px 2px 0px black, 3px 3px 0px black, 4px 4px 0px black'
              }}
            >
              FAQ'S
            </motion.h2>
            
            <div className="w-full max-w-[900px] lg:max-w-[1100px] xl:max-w-[1200px] mt-10 md:mt-16 flex flex-col z-20">
              {[
                {
                  question: "What is Mootion?",
                  answer: "Mootion is where concepts are taught in motion. We believe in learning by experimenting, not just observing."
                },
                {
                  question: "How do I get started?",
                  answer: "Simply click the 'Start Now' button in the hero section and explore our interactive motion concepts."
                },
                {
                  question: "Can I use it on a tablet or mobile phone?",
                  answer: "Absolutely! Mootion is fully responsive and designed to work beautifully across desktop, tablet, and mobile devices."
                },
                {
                  question: "Do I need prior experience?",
                  answer: "Not at all. Mootion is designed to be completely intuitive for beginners while remaining powerful enough for experts."
                }
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <FAQItem question={faq.question} answer={faq.answer} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Footer Section */}
          <section className="snap-start min-h-[100dvh] lg:min-h-0 w-full bg-[#f6f4ee] flex flex-col justify-center lg:justify-start pt-20 md:pt-32 lg:pt-36 pb-16 md:pb-24 px-6 md:px-12 lg:px-24">
            <div className="w-full max-w-[1300px] mx-auto flex flex-col md:flex-row justify-between items-start gap-12 md:gap-8">
              <div className="w-full md:w-1/2 flex flex-col gap-6">
                <h2 className="text-black font-montserrat font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[4.5vw] leading-[1.05] tracking-tight">
                  Let's build<br />
                  <span className="text-[#1800ad]">the impossible.</span>
                </h2>
                <p className="text-gray-800 font-montserrat text-sm md:text-base max-w-[420px] mt-2 mb-2 leading-relaxed">
                  Got an idea? We have the engines. Reach out to start your next project with MOOTION.
                </p>
                
                <div className="flex items-center w-full max-w-[420px] border border-[#2c2c2c]/30 rounded-full overflow-hidden bg-white/50 p-1 pl-4 -ml-2">
                  <input 
                    type="email" 
                    placeholder="Enter your Email..." 
                    className="flex-grow py-3 bg-transparent outline-none text-black font-montserrat text-sm placeholder:text-gray-500"
                  />
                  <button className="h-[44px] w-[44px] ml-2 flex items-center justify-center bg-white border border-[#2c2c2c]/20 shadow-sm rounded-full hover:bg-[#1800ad] hover:border-[#1800ad] hover:text-white transition-all duration-300 text-black shrink-0">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col items-start gap-12 md:gap-16 pt-4">
                <div className="flex flex-row gap-16 sm:gap-24">
                  <div className="flex flex-col gap-5 font-montserrat">
                    <h4 className="text-gray-500 font-bold mb-1 text-sm tracking-wide">Sitemap</h4>
                    <a href="#" className="text-black hover:text-[#1800ad] transition-colors font-medium text-sm">Home</a>
                    <a href="#" className="text-black hover:text-[#1800ad] transition-colors font-medium text-sm">Features</a>
                    <a href="#" className="text-black hover:text-[#1800ad] transition-colors font-medium text-sm">FAQ</a>
                  </div>
                  <div className="flex flex-col gap-5 font-montserrat">
                    <h4 className="text-gray-500 font-bold mb-1 text-sm tracking-wide">Sitemap</h4>
                    <a href="#" className="text-black hover:text-[#1800ad] transition-colors font-medium text-sm">X</a>
                    <a href="#" className="text-black hover:text-[#1800ad] transition-colors font-medium text-sm">Instagram</a>
                    <a href="#" className="text-black hover:text-[#1800ad] transition-colors font-medium text-sm">LinkedIn</a>
                  </div>
                </div>
                
                <div className="flex flex-row gap-4 mt-auto">
                  <a href="#" className="w-12 h-12 flex items-center justify-center rounded-full border border-black hover:bg-[#1800ad] hover:border-[#1800ad] hover:text-white transition-all text-black">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                    </svg>
                  </a>
                  <a href="#" className="w-12 h-12 flex items-center justify-center rounded-full border border-black hover:bg-[#1800ad] hover:border-[#1800ad] hover:text-white transition-all text-black">
                    <Instagram size={20} />
                  </a>
                  <a href="#" className="w-12 h-12 flex items-center justify-center rounded-full border border-black hover:bg-[#1800ad] hover:border-[#1800ad] hover:text-white transition-all text-black">
                    <Github size={20} />
                  </a>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
    </>
  );
}