import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  BookOpen,
  BarChart2,
  MessageSquare,
  Search, 
  Copy,
  Check,
  TrendingDown,
  BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChatbotFab } from '../components/ChatbotFab';
import { NavItem } from '../components/NavItem';
import { 
  getStoredTasks, 
  getPlaygroundQuota, 
  getTeacherAssignedNew, 
  completeAllTasks, 
  resetAllTasks, 
  setTeacherAssignedNew 
} from '../data/taskStore';
import { api } from '../lib/api';

export function TeacherDashboardPage() {
  const navigate = useNavigate();

  // Load profile state
  const [profile, setProfile] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('mootion_teacher_setup');
    if (data) {
      setProfile(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await api.get('/teachers/classes');
        setClasses(data);
      } catch (err: any) {
        console.error("Failed to fetch teacher classes:", err);
        if (err.status === 403 || err.status === 401) {
          localStorage.removeItem('mootion_access_token');
          localStorage.removeItem('mootion_refresh_token');
          navigate('/teacher/login');
        }
      }
    };
    fetchClasses();
  }, []);

  const getGradeCodesString = (gradeName: string) => {
    const cleanGrade = gradeName.replace(/\D/g, '');
    const matched = classes.filter(c => c.grade === cleanGrade || c.grade === gradeName);
    if (matched.length > 0) {
      return matched.map(c => c.class_code).join(' / ');
    }
    return 'Loading...';
  };

  const teacherName = profile?.teacherId ? `Teacher` : "Teacher";

  // Determine user-selected grades and subjects from onboarding or fallback
  const rawGrades = profile?.selectedGrades || [];
  const rawSubjects = profile?.selectedSubjects || [];
  
  const grades = rawGrades.length > 0 ? rawGrades : ['Class 6', 'Class 7', 'Class 8'];
  const subjects = rawSubjects.length > 0 ? rawSubjects : ['Physics', 'Chemistry', 'Mathematics'];

  // Helper to sort grades numerically
  const getGradeNum = (g: string) => {
    const match = g.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
  };
  const sortedGrades = [...grades].sort((a, b) => getGradeNum(a) - getGradeNum(b));

  // Determine completions precisely for Class 6 (50%), Class 7 (90%), Class 8 (20%)
  const getProgressVal = (gName: string) => {
    const num = getGradeNum(gName);
    if (num === 6) return 50;
    if (num === 7) return 90;
    if (num === 8) return 20;
    // Fallback for custom configured classes
    return Math.abs((num * 23) % 7) * 10 + 30; 
  };

  // Struggle concept mapping
  const getStrugglingConcept = (gradeName: string, subjectName: string) => {
    const num = getGradeNum(gradeName);
    const lowercaseSubj = subjectName.toLowerCase();
    
    if (lowercaseSubj.includes('phys')) {
      if (num === 6) return { concept: "Magnetic lines attraction poles", accuracy: 48 };
      if (num === 7) return { concept: "Heat conduction & transfer rates", accuracy: 52 };
      if (num === 8) return { concept: "Static Friction vs Kinetic Friction", accuracy: 38 };
      return { concept: "Balanced and unbalanced forces", accuracy: 45 };
    }
    if (lowercaseSubj.includes('chem')) {
      if (num === 6) return { concept: "Sifting vs Sedimentation filters", accuracy: 42 };
      if (num === 7) return { concept: "Saturated vs Unsaturated solutions", accuracy: 51 };
      if (num === 8) return { concept: "Synthetic polymer chemical reactions", accuracy: 49 };
      return { concept: "Chemical equations oxidation", accuracy: 44 };
    }
    if (lowercaseSubj.includes('math')) {
      if (num === 6) return { concept: "Ratio simplification fractions", accuracy: 35 };
      if (num === 7) return { concept: "Algebraic expression terms", accuracy: 46 };
      if (num === 8) return { concept: "Rational numbers on number lines", accuracy: 41 };
      return { concept: "Linear equations with variables", accuracy: 39 };
    }
    // Biology or general
    if (num === 6) return { concept: "Food components iodine tests", accuracy: 56 };
    if (num === 7) return { concept: "Photosynthesis chloroplast filters", accuracy: 49 };
    if (num === 8) return { concept: "Cell organelles mitochondria division", accuracy: 35 };
    return { concept: "Asexual vegetative reproduction", accuracy: 42 };
  };

  const handleCopyInviteCode = (e: React.MouseEvent, code: string, cardId: string) => {
    e.stopPropagation(); // Stop navigation click
    if (code === 'Loading...') return;
    navigator.clipboard.writeText(code);
    setCopiedId(cardId);
    setCopiedToast(`Class code ${code} copied!`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
    setTimeout(() => {
      setCopiedToast(null);
    }, 3500);
  };

  const handleCardClick = (gradeName: string, subjectName: string) => {
    // Navigate dynamically to the corresponding teacher class setup or dashboard view Page
    const g = gradeName.toLowerCase().replace(/\s+/g, '-');
    const s = subjectName.toLowerCase().replace(/\s+/g, '-');
    
    // Fallback safe path to Class 8 Physics if that's the only configured mock route,
    // otherwise let the router direct dynamically.
    navigate(`/teacher/class/${g}-${s}`);
  };

  const handleClassroomNav = () => {
    if (classes && classes.length > 0) {
      const firstClass = classes[0];
      const g = firstClass.grade.toLowerCase().replace(/\s+/g, '-');
      const s = firstClass.subject.toLowerCase().replace(/\s+/g, '-');
      navigate(`/teacher/class/${g}-${s}`);
    } else {
      navigate('/teacher/class/class-8-science');
    }
  };

  const getSubjectsForGradeCard = (gradeName: string, allSubjects: string[]) => {
    const num = getGradeNum(gradeName);
    if (num >= 5 && num <= 10) {
      const list: string[] = [];
      const hasScience = allSubjects.some(s => ['physics', 'chemistry', 'biology', 'science'].includes(s.toLowerCase()));
      if (hasScience) list.push('Science');
      if (allSubjects.some(s => s.toLowerCase() === 'mathematics')) list.push('Mathematics');
      return list;
    } else {
      return allSubjects.filter(s => s.toLowerCase() !== 'science');
    }
  };

  return (
    <div className="flex flex-1 w-full bg-[#1800ad] font-montserrat text-[#1800ad] relative">
      
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-8 py-2.5 flex justify-between items-center z-40 rounded-full shadow-[0_10px_40px_rgba(24,0,173,0.25)] border-[2px] border-[#f6f4ee]">
        <NavItem icon={<LayoutDashboard size={24} />} active onClick={() => navigate('/teacher/home')} />
        <NavItem icon={<BookOpen size={24} />} onClick={handleClassroomNav} />
        <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
        <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
      </nav>

      {/* Floating Copied Toast Notification */}
      <AnimatePresence>
        {copiedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 25 }}
            className="fixed bottom-24 sm:bottom-8 right-6 z-50 bg-[#1800ad] text-[#f6f4ee] px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 border-2 border-[#f6f4ee] font-bold text-xs sm:text-sm tracking-wide lowercase"
          >
            <Check size={16} className="text-[#f6f4ee] stroke-[3]" />
            <span>{copiedToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ChatBot FAB */}
      <ChatbotFab />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        {/* Logo */}
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} active onClick={() => navigate('/teacher/home')} />
          <NavItem icon={<BookOpen size={24} />} onClick={handleClassroomNav} />
          <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
          <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
        </nav>

        {/* Profile Avatar */}
        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-opacity duration-300 shadow-sm relative">
           <span className="text-[#1800ad] font-bold text-lg">P</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full relative flex flex-col">
        <div className="max-w-[1300px] w-full">
        
        {/* Top Header */}
        <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-8 lg:mb-10 w-full relative">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#1800ad]">
              Welcome Back, {teacherName} 👋
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <p className="text-[#1800ad]/70 font-medium">Coordinate your students and assign interactive modules effortlessly.</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-[calc(100%+16px)] -ml-2 translate-y-1.5 xl:translate-y-0 xl:ml-0 xl:w-[380px]">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search size={18} className="text-[#1800ad]/60" />
            </div>
            <input 
              type="text" 
              placeholder="Search your lectures..." 
              className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-transparent border-2 border-[#1800ad]/30 rounded-full text-sm outline-none focus:border-[#1800ad] focus:ring-4 focus:ring-[#1800ad]/10 transition-all placeholder:text-[#1800ad]/50 font-medium text-[#1800ad]"
            />
          </div>
        </header>

        <div className="flex flex-col xl:grid xl:grid-cols-[1fr_390px] gap-8 lg:gap-10">
          
          {/* Left Column: Classroom Portals */}
          <section className="flex flex-col order-1 gap-6">
            <div>
              <h2 className="text-2xl font-black text-[#1800ad] tracking-tight uppercase">My Classrooms & Invite Keys</h2>
              <p className="text-xs font-semibold text-[#1800ad]/60 leading-normal lowercase mt-0.5">
                Each classroom holds a unique alphabetical student entry invitation. Click code to copy. Click a subject card to view chapters and academic timeline.
              </p>
            </div>

            <div className="flex flex-col gap-8 flex-1">
              {sortedGrades.map((grade) => {
                const classCode = getGradeCodesString(grade);
                const isClassCopied = copiedId === grade;

                return (
                  <div key={grade} className="flex flex-col gap-3.5 bg-[#1800ad]/5 p-5 sm:p-6 rounded-[32px] border-2 border-[#1800ad]/15">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#1800ad]/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center font-bold text-xs sm:text-sm">
                          {getGradeNum(grade) !== 999 ? getGradeNum(grade) : '★'}
                        </div>
                        <span className="text-lg font-extrabold text-[#1800ad]">{grade}</span>
                      </div>
                      
                      <div className="flex items-center flex-wrap gap-2.5">
                        {/* Copyable invitation key for the whole class */}
                        <button
                          type="button"
                          onClick={(e) => handleCopyInviteCode(e, classCode, grade)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-[2px] text-[11px] font-extrabold tracking-wide transition-all ${
                            isClassCopied 
                              ? 'bg-[#1800ad] text-[#f6f4ee] border-[#1800ad] scale-102' 
                              : 'bg-transparent text-[#1800ad] border-[#1800ad]/30 hover:border-[#1800ad]'
                          }`}
                          title="Click to copy class invitation code"
                        >
                          <span className="opacity-70">code:</span>
                          <span className="font-mono uppercase tracking-wider">{classCode}</span>
                          {isClassCopied ? <Check size={11} className="stroke-[3]" /> : <Copy size={11} />}
                        </button>

                        <div className="text-[10px] sm:text-xs font-bold text-[#1800ad]/70 bg-[#1800ad]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                          {getSubjectsForGradeCard(grade, subjects).length} Subjects Configured
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getSubjectsForGradeCard(grade, subjects).map((subj) => {
                        return (
                          <motion.div
                            key={subj}
                            whileHover={{ y: -4 }}
                            onClick={() => handleCardClick(grade, subj)}
                            className="bg-[#f6f4ee] border-2 border-[#1800ad]/20 hover:border-[#1800ad] p-4.5 rounded-[24px] flex flex-col justify-between gap-4 cursor-pointer shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300"
                          >
                            {/* Class and Subject Name */}
                            <div className="relative z-10">
                              <h4 className="text-xs font-semibold text-[#1800ad]/60 uppercase tracking-wider">
                                {grade}
                              </h4>
                              <h3 className="text-lg font-black text-[#1800ad] leading-tight mt-1">
                                {subj}
                              </h3>
                            </div>

                            {/* Card footer details with non-underlined, simple rename info */}
                            <div className="flex items-center justify-between text-[10px] font-bold text-[#1800ad]/60 mt-2 border-t border-[#1800ad]/10 pt-2 relative z-10">
                              <span className="flex items-center gap-1">
                                <BookMarked size={12} />
                                NCERT loaded
                              </span>
                              <span className="text-[#1800ad]/90 flex items-center gap-0.5">
                                Syllabus &rarr;
                              </span>
                            </div>

                            {/* Card Background subtle grid texture */}
                            <div className="absolute inset-x-0 bottom-0 top-[60%] bg-gradient-to-t from-[#1800ad]/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300"></div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column (Notifications/State Indicators) */}
          <aside className="w-full flex flex-col h-fit xl:sticky xl:top-[20px] order-2 shrink-0 gap-6">
            
            {/* Notifications: Class Content Completions */}
            <div>
              <h2 className="text-xl font-bold text-[#1800ad]">Class Content Completed</h2>
              <p className="text-xs font-medium text-[#1800ad]/60 lowercase mt-0.5">Real-time student progress percentages per grade.</p>
            </div>

            <div className="bg-[#f6f4ee] rounded-[32px] border-2 border-[#1800ad] p-5 lg:p-6 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col gap-4">
                {sortedGrades.map((grade) => {
                  const progress = getProgressVal(grade);
                  
                  return (
                    <div key={grade} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="uppercase tracking-wide text-[#1800ad]">{grade}</span>
                        <span className="bg-[#1800ad] text-[#f6f4ee] font-mono px-2 py-0.5 rounded-full text-[10px]">
                          {progress}% done
                        </span>
                      </div>
                      
                      {/* Bar Container */}
                      <div className="w-full bg-[#1800ad]/10 h-3 rounded-full overflow-hidden border border-[#1800ad]/5 relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            progress >= 80 
                              ? 'bg-[#1800ad]' 
                              : progress >= 40 
                                ? 'bg-[#1800ad]/75' 
                                : 'bg-[#1800ad]/50'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student Struggle Radar & Struggling Concepts */}
            <div>
              <h2 className="text-xl font-bold text-[#1800ad]">Student Struggle Radar</h2>
              <p className="text-xs font-medium text-[#1800ad]/60 lowercase mt-0.5">Lowest scoring concepts identified automatically by Mootion AI.</p>
            </div>

            <div className="bg-[#f6f4ee] rounded-[32px] border-2 border-[#1800ad] p-5 lg:p-6 shadow-sm flex flex-col gap-3.5">
              <div className="flex flex-col gap-3">
                {sortedGrades.map((grade) => {
                  // pick first subject for mock struggling concept display
                  const firstSubj = subjects[0] || 'Physics';
                  const struggle = getStrugglingConcept(grade, firstSubj);
                  
                  return (
                    <div key={grade} className="p-3.5 rounded-2xl bg-white border border-[#1800ad]/10 flex flex-col gap-1.5 hover:border-[#1800ad]/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-[#1800ad]/55 tracking-widest leading-none">
                          {grade} • {firstSubj}
                        </span>
                        <div className="flex items-center gap-1">
                          <TrendingDown size={11} className="text-[#1800ad]/70" />
                          <span className="text-[10px] font-bold text-[#1800ad]/80 font-mono">
                            {struggle.accuracy}% accuracy
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-bold text-[#121212] leading-snug">
                        {struggle.concept}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </aside>

        </div>
      </div>
    </main>

  </div>
);
}
