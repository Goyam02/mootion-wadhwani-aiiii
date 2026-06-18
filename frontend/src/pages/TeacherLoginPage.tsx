import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye } from '../components/Eye';
import { api } from '../lib/api';

export function TeacherLoginPage() {
  const navigate = useNavigate();
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!teacherId.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.post('/auth/login', {
        login_id: teacherId,
        password: password
      });

      if (data.role !== 'teacher') {
        setError("This account is registered as a student. Please log in via the student portal.");
        setIsLoading(false);
        return;
      }

      localStorage.setItem('mootion_access_token', data.access_token);
      localStorage.setItem('mootion_refresh_token', data.refresh_token);
      localStorage.setItem('mootion_role', data.role || 'teacher');

      try {
        const teacherProfile = await api.get('/teachers/me');
        const classes = await api.get('/teachers/classes');
        const grades = Array.from(new Set(classes.map((c: any) => c.grade.startsWith('Class ') ? c.grade : `Class ${c.grade}`)));
        const subjects = Array.from(new Set(classes.map((c: any) => c.subject)));
        
        localStorage.setItem('mootion_teacher_setup', JSON.stringify({
          schoolName: "Default School",
          teacherId: teacherProfile.login_id,
          selectedGrades: grades,
          selectedSubjects: subjects,
          selectedLanguage: teacherProfile.preferred_language || "English",
          ncertLoaded: true,
          setupAt: new Date().toISOString()
        }));
      } catch (profileErr) {
        console.error("Failed to sync profile:", profileErr);
        localStorage.setItem('mootion_teacher_setup', JSON.stringify({
          schoolName: "Default School",
          teacherId: teacherId,
          selectedGrades: ['Class 8'],
          selectedSubjects: ['Physics'],
          selectedLanguage: 'English',
          ncertLoaded: true,
          setupAt: new Date().toISOString()
        }));
      }

      navigate('/teacher/home');
    } catch (err: any) {
      console.error(err);
      if (err.status === 401) {
        setError("Incorrect ID or password");
      } else {
        setError("Could not connect to server");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <h2 className="text-center tracking-normal sm:tracking-[0.1em] md:tracking-[0.15em] text-[#2c2c2c] uppercase text-[10px] min-[320px]:text-[11px] min-[360px]:text-[12px] sm:text-[14px] md:text-base font-black whitespace-nowrap">Teacher Login</h2>
        
        <form onSubmit={handleStart} className="flex flex-col flex-1 pb-4">
          <div className="flex flex-col gap-3 md:gap-4 flex-1 justify-center relative mt-2">
            {error && (
              <div className="text-red-600 text-xs font-bold text-center -mt-1 mb-2">
                {error}
              </div>
            )}
            <input 
              type="text" 
              placeholder="Teacher ID" 
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              disabled={isLoading}
              className="w-full px-6 py-2 md:py-3 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad]"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="w-full px-6 py-2 md:py-3 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad]"
            />
            <button 
              type="submit"
              disabled={isLoading || !teacherId.trim() || !password.trim()}
              className="w-full px-6 py-2 md:py-3 mt-2 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full disabled:opacity-50"
            >
              {isLoading ? "Starting..." : "Start"}
            </button>
          </div>
        </form>

        <div className="mt-auto">
          <div className="flex items-center justify-center w-full relative mb-4 -mt-2 md:-mt-4">
            <div className="absolute left-0 right-0 h-[1.5px] bg-[#1800ad]"></div>
            <span className="relative z-10 bg-[#f6f4ee] px-3 tracking-wide text-[#2c2c2c] text-xs font-semibold lowercase">or</span>
          </div>

          <button 
            type="button"
            onClick={() => navigate('/teacher/onboarding')} 
            className="w-full px-6 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full"
          >
            Set up your account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
