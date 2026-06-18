import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye } from '../components/Eye';

export function StudentSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const mousePosRef = useRef({ 
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, 
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 
  });
  
  const fakeMouseActiveRef = useRef(false);
  const fakeMousePosRef = useRef({ x: 0, y: 0 });
  const userHasControlRef = useRef(true);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-[#f6f4ee] overflow-hidden relative flex items-center justify-center">
      {/* Giant Blue Character Face */}
      <div 
        className="absolute top-1/2 left-0 -translate-x-[55%] sm:-translate-x-[45%] md:-translate-x-[30%] lg:-translate-x-[35%] -translate-y-1/2 w-[180vw] h-[180vw] sm:w-[150vw] sm:h-[150vw] md:w-[80vw] md:h-[110dvh] lg:w-[80vw] lg:h-[130dvh] bg-[#1800ad] rounded-[50%] flex flex-col justify-center items-end shadow-xl transition-all duration-700 ease-in-out"
      >
        <div className="absolute top-[16%] sm:top-[16%] md:top-[18%] lg:top-[20%] right-[15%] sm:right-[10%] md:right-[15%] lg:right-[15%] w-[30%] sm:w-[35%] md:w-[35%] lg:w-[35%] flex justify-end gap-[12%]">
          <Eye 
            mousePosRef={mousePosRef} 
            fakeMouseActiveRef={fakeMouseActiveRef} 
            fakeMousePosRef={fakeMousePosRef} 
            userHasControlRef={userHasControlRef} 
            className="w-[40%] aspect-square max-w-[200px]"
          />
          <Eye 
            mousePosRef={mousePosRef} 
            fakeMouseActiveRef={fakeMouseActiveRef} 
            fakeMousePosRef={fakeMousePosRef} 
            userHasControlRef={userHasControlRef} 
            className="w-[40%] aspect-square max-w-[200px]"
          />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-[70%] max-w-[240px] md:w-[85%] md:max-w-[320px] lg:max-w-[300px] mt-24 md:mt-16 lg:mt-[12vh] bg-[#f6f4ee] rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 flex flex-col gap-3 sm:gap-4 md:gap-6 font-montserrat border border-[#1800ad] min-h-[290px] sm:min-h-[340px] md:min-h-[380px]"
      >
        <h2 className="text-center tracking-normal sm:tracking-[0.1em] md:tracking-[0.15em] text-[#2c2c2c] uppercase text-[10px] min-[320px]:text-[11px] min-[360px]:text-[12px] sm:text-[14px] md:text-base font-medium whitespace-nowrap">
          {step === 1 ? 'Set up your account' : 'Join a class'}
        </h2>
        
        <div className="flex flex-col flex-1 pb-4">
           <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3 md:gap-4 flex-1 justify-center relative mt-2"
              >
                <input 
                  type="text" 
                  placeholder="Student ID" 
                  className="w-full px-6 py-2 md:py-3 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad] font-montserrat"
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full px-6 py-2 md:py-3 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad] font-montserrat"
                />
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-3 md:gap-4 flex-1 justify-center relative mt-2"
              >
                <input 
                  type="text" 
                  placeholder="Class ID" 
                  className="w-full px-6 py-2 md:py-3 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad] font-montserrat"
                />
                <div className="relative w-full">
                  <div 
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="w-full px-6 py-2 md:py-3 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] cursor-pointer font-montserrat flex items-center justify-center relative"
                  >
                    <span className={selectedLanguage ? "text-[#2c2c2c]" : "text-gray-500"}>
                      {selectedLanguage || "Language"}
                    </span>
                    <div className="absolute right-4 pointer-events-none">
                      <motion.svg animate={{ rotate: isLangOpen ? 180 : 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1800ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></motion.svg>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isLangOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#f6f4ee] border border-[#1800ad] rounded-[24px] p-2 flex flex-col gap-1 z-20 shadow-lg font-montserrat"
                      >
                        {['English', 'Hindi', 'Gujarati', 'Marathi'].map((lang) => (
                          <div 
                            key={lang}
                            onClick={() => { setSelectedLanguage(lang); setIsLangOpen(false); }}
                            className="w-full py-2 text-center text-sm text-[#2c2c2c] hover:bg-[#1800ad] hover:text-[#f6f4ee] rounded-full cursor-pointer transition-colors"
                          >
                            {lang}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-auto">
          {step === 1 ? (
            <div className="flex items-center justify-center w-full relative mb-4 -mt-2 md:-mt-4">
              <div className="absolute left-0 right-0 h-[1.5px] bg-[#1800ad]"></div>
              <span className="relative z-10 bg-[#f6f4ee] px-3 tracking-wide text-[#2c2c2c] text-xs font-medium lowercase">or</span>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full relative mb-4 -mt-2 md:-mt-4 pointer-events-none">
              <div className="absolute left-0 right-0 h-[1.5px] bg-[#1800ad]"></div>
              <span className="relative z-10 px-3 text-xs font-medium lowercase opacity-0">or</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            {step === 1 ? (
              <>
                <button onClick={() => navigate('/login/student')} className="w-1/2 px-2 sm:px-4 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-base font-medium transition-all duration-300 rounded-full flex justify-center items-center">
                  Login
                </button>
                <button onClick={() => setStep(2)} className="w-1/2 px-2 sm:px-4 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-base font-medium transition-all duration-300 rounded-full flex justify-center items-center">
                  Next
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep(1)} className="w-1/2 px-2 sm:px-4 py-2 md:py-3 bg-transparent border-2 border-[#1800ad] text-[#1800ad] hover:bg-[#1800ad] hover:text-[#f6f4ee] text-base font-medium transition-all duration-300 rounded-full flex justify-center items-center">
                  Back
                </button>
                <button onClick={() => navigate('/student/home')} className="w-1/2 px-2 sm:px-4 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-base font-medium transition-all duration-300 rounded-full flex justify-center items-center">
                  Start
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
