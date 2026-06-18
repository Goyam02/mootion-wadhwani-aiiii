import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye } from '../components/Eye';
import { ArrowRight, ArrowLeft, Check, BookOpen } from 'lucide-react';
import { api } from '../lib/api';

export function TeacherOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Form states
  const [schoolName, setSchoolName] = useState('');
  const [fullName, setFullName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Preset options
  const gradeOptions = [
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ];

  const [showExclusiveNote, setShowExclusiveNote] = useState(false);

  const getSubjectOptions = () => {
    const hasGroup1 = selectedGrades.some(g => ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].includes(g));
    const hasGroup2 = selectedGrades.some(g => ['Class 11', 'Class 12'].includes(g));

    if (hasGroup1) {
      return ['Science', 'Mathematics'];
    }
    if (hasGroup2) {
      return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
    }
    return ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  };

  const subjectOptions = getSubjectOptions();

  const languageOptions = [
    'English', 'Hindi', 'Gujarati', 'Marathi'
  ];

  useEffect(() => {
    const valid = getSubjectOptions();
    setSelectedSubjects(prev => prev.filter(s => valid.includes(s)));
  }, [selectedGrades]);

  const toggleGrade = (grade: string) => {
    const isGroup1 = ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].includes(grade);
    const isSelecting = !selectedGrades.includes(grade);

    if (isSelecting) {
      const hasGroup1 = selectedGrades.some(g => ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'].includes(g));
      const hasGroup2 = selectedGrades.some(g => ['Class 11', 'Class 12'].includes(g));

      if (isGroup1 && hasGroup2) {
        // Switch to Group 1, clear Group 2
        setSelectedGrades([grade]);
        setShowExclusiveNote(true);
      } else if (!isGroup1 && hasGroup1) {
        // Switch to Group 2, clear Group 1
        setSelectedGrades([grade]);
        setShowExclusiveNote(true);
      } else {
        setSelectedGrades([...selectedGrades, grade]);
      }
    } else {
      const nextGrades = selectedGrades.filter(g => g !== grade);
      setSelectedGrades(nextGrades);
      if (nextGrades.length === 0) {
        setShowExclusiveNote(false);
      }
    }
  };

  const toggleSubject = (subj: string) => {
    if (selectedSubjects.includes(subj)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
    } else {
      setSelectedSubjects([...selectedSubjects, subj]);
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/teacher/login');
    }
  };

  const getGradeValue = (gradeStr: string) => {
    const match = gradeStr.match(/\d+/);
    return match ? match[0] : gradeStr;
  };

  const submitOnboarding = async (loadNcert: boolean) => {
    setIsLoadingChapters(true);
    setError(null);
    try {
      // 1. Register teacher account
      const regRes = await api.post('/auth/register', {
        login_id: teacherId,
        full_name: fullName,
        role: "teacher",
        password,
        preferred_language: selectedLanguage.toLowerCase()
      });

      // 2. Store tokens
      localStorage.setItem('mootion_access_token', regRes.access_token);
      localStorage.setItem('mootion_refresh_token', regRes.refresh_token);
      localStorage.setItem('mootion_role', regRes.role || 'teacher');

      // 3. Post preferences
      await api.post('/teachers/onboarding/preferences', {
        preferred_language: selectedLanguage.toLowerCase()
      });

      // 4. Onboarding complete
      await api.post('/teachers/onboarding/complete', {
        load_ncert: loadNcert
      });

      // 5. Create classes sequentially
      for (const grade of selectedGrades) {
        const gradeVal = getGradeValue(grade);
        for (const subject of selectedSubjects) {
          await api.post('/teachers/classes', {
            grade: gradeVal,
            subject: subject
          });
        }
      }

      // 6. Save onboarding data locally for UI fallback dashboard features
      localStorage.setItem('mootion_teacher_setup', JSON.stringify({
        schoolName,
        teacherId,
        selectedGrades,
        selectedSubjects,
        selectedLanguage,
        ncertLoaded: loadNcert,
        setupAt: new Date().toISOString()
      }));

      navigate('/teacher/home');
    } catch (err: any) {
      console.error(err);
      setStep(1);
      if (err.status === 409) {
        setError("This Teacher ID is already taken");
      } else if (err.status === 401) {
        setError("Incorrect ID or password");
      } else if (err.status === 422) {
        if (err.detail && Array.isArray(err.detail)) {
          const msgs = err.detail.map((d: any) => d.msg).join(", ");
          setError(`Validation Error: ${msgs}`);
        } else if (err.detail && typeof err.detail === 'string') {
          setError(err.detail);
        } else {
          setError("Invalid input data - check fields are correct");
        }
      } else {
        setError(err.detail || "Could not connect to server");
      }
    } finally {
      setIsLoadingChapters(false);
    }
  };

  const handleLoadNCERT = () => {
    submitOnboarding(true);
  };

  const handleSkipNow = () => {
    submitOnboarding(false);
  };

  return (
    <div className="w-full h-[100dvh] bg-[#f6f4ee] overflow-hidden relative flex items-center justify-center font-montserrat text-[#1800ad]">
      
      {/* Giant Blue Character Face Background decoration */}
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
        <motion.div 
          layout
          className="flex flex-col flex-1 relative overflow-visible"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3 flex-1 justify-start pt-1 sm:pt-1.5"
              >
                <div>
                  <h2 className="text-center tracking-normal sm:tracking-[0.1em] md:tracking-[0.15em] text-[#2c2c2c] uppercase text-[10px] min-[320px]:text-[11px] min-[360px]:text-[12px] sm:text-[14px] md:text-base font-black whitespace-nowrap">Set up your profile</h2>
                </div>

                <div className="flex flex-col gap-2.5 flex-1 justify-center w-full mt-1.5">
                  <input 
                    type="text" 
                    placeholder="School ID"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-6 py-2 md:py-2.5 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad]"
                  />

                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-6 py-2 md:py-2.5 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad]"
                  />

                  <input 
                    type="text" 
                    placeholder="Teacher ID (min 3 chars)"
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-6 py-2 md:py-2.5 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad]"
                  />

                  <input 
                    type="password" 
                    placeholder="Password (min 8 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-6 py-2 md:py-2.5 text-[13px] sm:text-sm md:text-base bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad]"
                  />
                </div>

                <div className="flex items-center justify-center w-full relative mb-3 mt-1 sm:mt-0">
                  <div className="absolute left-0 right-0 h-[2.5px] bg-[#1800ad]"></div>
                  <span className="relative z-10 bg-[#f6f4ee] px-3 tracking-wide text-[#2c2c2c] text-xs font-semibold lowercase">or</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={handleBack} 
                    className="flex-1 px-6 py-2 md:py-3 bg-transparent border-2 border-[#1800ad] hover:bg-[#1800ad]/5 text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full text-center"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={!schoolName.trim() || !fullName.trim() || teacherId.trim().length < 3 || password.length < 8}
                    className="flex-1 px-6 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full flex items-center justify-center disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3 flex-1 justify-start pt-1 sm:pt-1.5 animate-fadeIn"
              >
                <div>
                  <h2 className="text-center tracking-normal sm:tracking-[0.1em] md:tracking-[0.15em] text-[#2c2c2c] uppercase text-[10px] min-[320px]:text-[11px] min-[360px]:text-[12px] sm:text-[14px] md:text-base font-black whitespace-nowrap">select grades</h2>
                </div>

                <div className="grid grid-cols-2 gap-1 md:gap-1.5 px-0.5 my-auto py-2">
                  {gradeOptions.map((grade) => {
                    const isSelected = selectedGrades.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => toggleGrade(grade)}
                        className={`px-2 py-1.5 sm:py-2.5 rounded-xl border-2 font-bold text-[10px] sm:text-xs transition-all flex items-center gap-1.5 ${
                          isSelected 
                            ? 'bg-[#1800ad] border-[#1800ad] text-[#f6f4ee] shadow-sm' 
                            : 'bg-transparent border-[#1800ad]/20 text-[#1800ad] hover:border-[#1800ad]/55 hover:bg-[#1800ad]/5'
                        }`}
                      >
                        {/* Custom checkbox */}
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'bg-white border-transparent' : 'bg-[#f6f4ee] border-[#1800ad]'
                        }`}>
                          {isSelected && <Check size={9} className="stroke-[3.5] text-[#1800ad]" />}
                        </div>
                        <span className="truncate">{grade}</span>
                      </button>
                    );
                  })}
                </div>

                {showExclusiveNote && (
                  <p className="text-[10px] text-amber-600 font-semibold text-center mt-1 max-w-[280px] mx-auto leading-normal">
                    Note: Middle school (Class 5–10) and high school (Class 11–12) grades are mutually exclusive. Selecting this grade has deselected your previous choices.
                  </p>
                )}

                <div className="flex items-center justify-center w-full relative mb-3 mt-1 sm:mt-0">
                  <div className="absolute left-0 right-0 h-[2.5px] bg-[#1800ad]"></div>
                  <span className="relative z-10 bg-[#f6f4ee] px-3 tracking-wide text-[#2c2c2c] text-xs font-semibold lowercase">or</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={handleBack} 
                    className="flex-1 px-6 py-2 md:py-3 bg-transparent border-2 border-[#1800ad] hover:bg-[#1800ad]/5 text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full text-center"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={selectedGrades.length === 0}
                    className="flex-1 px-6 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full flex items-center justify-center disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3 flex-1 justify-start pt-1 sm:pt-1.5"
              >
                <div>
                  <h2 className="text-center tracking-normal sm:tracking-[0.1em] md:tracking-[0.15em] text-[#2c2c2c] uppercase text-[10px] min-[320px]:text-[11px] min-[360px]:text-[12px] sm:text-[14px] md:text-base font-black whitespace-nowrap">Subjects Assigned</h2>
                </div>

                <div className="flex flex-col gap-2 py-3 justify-center flex-1">
                  {subjectOptions.map((subj) => {
                    const isSelected = selectedSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleSubject(subj)}
                        className={`w-full px-5 py-2.5 sm:py-3 rounded-full border-2 font-bold text-xs sm:text-sm transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#1800ad] border-[#1800ad] text-[#f6f4ee] shadow-sm' 
                            : 'bg-transparent border-[#1800ad]/35 text-[#1800ad] hover:bg-[#1800ad]/5 hover:border-[#1800ad]/65'
                        }`}
                      >
                        <span className="flex-1 text-center font-extrabold tracking-wide">{subj}</span>
                        {isSelected && <Check size={14} className="shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center w-full relative mb-3 mt-1 sm:mt-0">
                  <div className="absolute left-0 right-0 h-[2.5px] bg-[#1800ad]"></div>
                  <span className="relative z-10 bg-[#f6f4ee] px-3 tracking-wide text-[#2c2c2c] text-xs font-semibold lowercase">or</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={handleBack} 
                    className="flex-1 px-6 py-2 md:py-3 bg-transparent border-2 border-[#1800ad] hover:bg-[#1800ad]/5 text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full text-center"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleNext}
                    disabled={selectedSubjects.length === 0}
                    className="flex-1 px-6 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full flex items-center justify-center disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-3 flex-1 justify-start pt-1 sm:pt-1.5"
              >
                <div>
                  <h2 className="text-center tracking-normal sm:tracking-[0.1em] md:tracking-[0.15em] text-[#2c2c2c] uppercase text-[10px] min-[320px]:text-[11px] min-[360px]:text-[12px] sm:text-[14px] md:text-base font-black whitespace-nowrap">Language</h2>
                </div>

                <div className="flex flex-col gap-2 py-3 justify-center flex-1">
                  {languageOptions.map((lang) => {
                    const isSelected = selectedLanguage === lang;
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLanguage(lang)}
                        className={`w-full px-[18px] py-2.5 sm:py-3 rounded-full border-2 font-bold text-xs sm:text-sm transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#1800ad] border-[#1800ad] text-[#f6f4ee] shadow-sm' 
                            : 'bg-transparent border-[#1800ad]/35 text-[#1800ad] hover:bg-[#1800ad]/5 hover:border-[#1800ad]/65'
                        }`}
                      >
                        <span className="flex-1 text-center font-extrabold tracking-wide">{lang}</span>
                        {isSelected && <Check size={14} className="shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-center w-full relative mb-3 mt-1 sm:mt-0">
                  <div className="absolute left-0 right-0 h-[2.5px] bg-[#1800ad]"></div>
                  <span className="relative z-10 bg-[#f6f4ee] px-3 tracking-wide text-[#2c2c2c] text-xs font-semibold lowercase">or</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={handleBack} 
                    className="flex-1 px-6 py-2 md:py-3 bg-transparent border-2 border-[#1800ad] hover:bg-[#1800ad]/5 text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full text-center"
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-6 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full flex items-center justify-center"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col flex-1 justify-between items-center text-center py-1 font-montserrat"
              >
                <div className="flex flex-col gap-4 flex-1 justify-center items-center my-auto pt-2 pb-4">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1800ad] leading-tight tracking-tight">
                    Welcome to<br />Mootion.
                  </h2>
                  <p className="text-base sm:text-lg text-[#2a2a2a] leading-relaxed max-w-[240px] sm:max-w-[280px] font-semibold opacity-90">
                    Load the NCERT syllabus for your classes and start teaching in minutes.
                  </p>
                  
                  {error && (
                    <div className="text-red-600 text-xs font-bold text-center mt-2">
                      {error}
                    </div>
                  )}
                </div>

                {isLoadingChapters ? (
                  <div className="my-6 flex flex-col items-center gap-2">
                     <div className="w-6 h-6 border-4 border-t-[#1800ad] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                     <span className="text-[9px] font-bold uppercase tracking-wider font-mono animate-pulse text-[#1800ad]">Structuring...</span>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full mt-auto">
                    <button 
                      type="button"
                      onClick={handleSkipNow}
                      className="flex-1 px-6 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full text-center"
                    >
                      Skip
                    </button>
                    <button 
                      type="button"
                      onClick={handleLoadNCERT}
                      className="flex-1 px-6 py-2 md:py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] text-[13px] sm:text-sm md:text-base font-bold transition-all duration-300 rounded-full text-center"
                    >
                      Start
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}
