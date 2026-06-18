import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye } from '../components/Eye';

export function OnboardingPage() {
  const navigate = useNavigate();
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
        className="absolute top-1/2 left-0 -translate-x-[55%] sm:-translate-x-[45%] md:-translate-x-[30%] lg:-translate-x-[35%] -translate-y-1/2 w-[180vw] h-[180vw] sm:w-[150vw] sm:h-[150vw] md:w-[80vw] md:h-[110dvh] lg:w-[80vw] lg:h-[130dvh] bg-[#1800ad] rounded-[50%] flex flex-col justify-center items-end shadow-xl"
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
        className="relative z-10 flex flex-col gap-6 ml-0 md:ml-[10%] w-[80%] max-w-[320px]"
      >
        <button onClick={() => navigate('/teacher/login')} className="w-full px-6 py-4 bg-[#f6f4ee] text-black font-montserrat text-base md:text-lg font-medium rounded-full border-2 border-[#1800ad] hover:bg-[#1800ad] hover:text-[#f6f4ee] transition-all duration-300 shadow-md">
          Continue as a Teacher
        </button>
        <button onClick={() => navigate('/login/student')} className="w-full px-6 py-4 bg-[#f6f4ee] text-black font-montserrat text-base md:text-lg font-medium rounded-full border-2 border-[#1800ad] hover:bg-[#1800ad] hover:text-[#f6f4ee] transition-all duration-300 shadow-md">
          Continue as a Student
        </button>
      </motion.div>
    </div>
  );
}
