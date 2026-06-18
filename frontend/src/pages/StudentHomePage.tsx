import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Compass, 
  Gamepad2, 
  Search, 
  ArrowRight,
  Flame,
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  Menu,
  X,
  Play,
  Sparkles,
  Beaker,
  UserPlus
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
import { TASKS } from '../data/tasks';
import { api } from '../lib/api';

// Fake Calendar Data Generator for GitHub-style graph (Month view)
const generateCalendarData = () => {
  const data = [];
  const today = new Date();
  
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const startingDayOfWeek = firstDay.getDay(); 
  
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  
  // Pad beginning of month
  for (let i = 0; i < startingDayOfWeek; i++) {
    data.push({ date: null, value: -1, dayNumber: null });
  }
  
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), i);
    const isPastOrToday = d <= today;
    const isActive = isPastOrToday && Math.random() > 0.6;
    const value = isActive ? Math.floor(Math.random() * 4) + 1 : 0;
    
    data.push({
      date: d,
      value: isPastOrToday ? value : 0, 
      dayNumber: i
    });
  }
  return data;
};

const calendarData = generateCalendarData();

export function StudentHomePage() {
  const navigate = useNavigate();

  // Load state from Task Store
  const [localTasks, setLocalTasks] = useState(() => getStoredTasks());
  const [quota, setQuota] = useState(() => getPlaygroundQuota());
  const [teacherAssigned, setTeacherAssigned] = useState(() => getTeacherAssignedNew());

  // Classes states
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Join Class Modal State
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinClassCodes, setJoinClassCodes] = useState<{ value: string; error: string | null }[]>([
    { value: '', error: null }
  ]);
  const [isJoining, setIsJoining] = useState(false);

  // Assignments Modal State
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [classAssignments, setClassAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Placeholder Assignment Detail Modal State
  const [selectedPlaceholderAssignment, setSelectedPlaceholderAssignment] = useState<any | null>(null);

  // Determine if student has completed all assigned tasks
  const isPlaygroundActive = !teacherAssigned && !localTasks.some(t => t.status !== 'Completed');

  const fetchClasses = async () => {
    try {
      const data = await api.get('/students/classes');
      setClasses(data);
    } catch (err: any) {
      console.error("Failed to fetch student classes:", err);
      if (err.status === 403 || err.status === 401) {
        localStorage.removeItem('mootion_access_token');
        localStorage.removeItem('mootion_refresh_token');
        navigate('/login/student');
      }
    } finally {
      setIsLoadingClasses(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const fetchAssignments = async () => {
      setIsLoadingAssignments(true);
      try {
        const data = await api.get(`/students/classes/${selectedClass.class_id}/assignments`);
        setClassAssignments(data);
      } catch (err) {
        console.error("Failed to fetch class assignments:", err);
      } finally {
        setIsLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [selectedClass]);

  const addClassCodeField = () => {
    setJoinClassCodes([...joinClassCodes, { value: '', error: null }]);
  };

  const handleClassCodeChange = (index: number, val: string) => {
    const next = [...joinClassCodes];
    next[index] = { value: val, error: null };
    setJoinClassCodes(next);
  };

  const handleJoinClasses = async () => {
    setIsJoining(true);
    let hasError = false;
    const nextCodes = [...joinClassCodes];

    for (let i = 0; i < nextCodes.length; i++) {
      const item = nextCodes[i];
      if (item.value.trim() !== '') {
        try {
          await api.post('/students/join-class', {
            class_code: item.value.trim()
          });
        } catch (err: any) {
          console.error("Error joining class:", err);
          hasError = true;
          nextCodes[i] = {
            ...item,
            error: "Class not found — check the code with your teacher"
          };
        }
      }
    }

    setJoinClassCodes(nextCodes);
    await fetchClasses();
    setIsJoining(false);

    if (!hasError) {
      setIsJoinModalOpen(false);
      setJoinClassCodes([{ value: '', error: null }]);
    }
  };

  const getCellColor = (value: number, date: Date | null) => {
    if (date) {
      const dOptions = new Date(date).setHours(0,0,0,0);
      const todayOptions = new Date().setHours(0,0,0,0);
      if (dOptions > todayOptions) return 'bg-gray-300 pointer-events-none text-gray-500';
    }
    if (value === 0) return 'bg-[#1800ad]/10'; // empty/light
    if (value === 1) return 'bg-[#1800ad]/30'; 
    if (value === 2) return 'bg-[#1800ad]/50'; 
    if (value === 3) return 'bg-[#1800ad]/70'; 
    return 'bg-[#1800ad]'; // full blue
  };

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-8 py-2.5 flex justify-between items-center z-45 rounded-full shadow-[0_10px_40px_rgba(24,0,173,0.25)] border-[2px] border-[#f6f4ee]">
        <NavItem icon={<LayoutDashboard size={24} />} active onClick={() => navigate('/student/home')} />
        <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
        <NavItem icon={<Compass size={24} />} onClick={() => navigate('/student/explore')} />
        <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
      </nav>

      {/* ChatBot FAB */}
      <ChatbotFab />

      {/* Persistent Join Class FAB */}
      <button 
        onClick={() => setIsJoinModalOpen(true)}
        className="fixed bottom-28 md:bottom-6 left-4 md:left-24 lg:left-28 xl:left-32 z-40 w-14 h-14 rounded-full border-4 border-[#f6f4ee] bg-[#1800ad] shadow-xl flex items-center justify-center hover:scale-105 hover:shadow-2xl transition-all text-[#f6f4ee] font-black text-2xl"
        title="Join a class"
      >
        <UserPlus size={22} className="stroke-[2.5]" />
      </button>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        {/* Logo */}
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} active onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
        </nav>

        {/* Profile Avatar Fixed to Bottom Left */}
        <div className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-opacity duration-300 shadow-sm relative">
           <span className="text-[#1800ad] font-bold text-lg transition-colors duration-300">P</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
        <div className="max-w-[1300px] w-full h-full">
        
        {/* Top Header */}
        <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-8 lg:mb-10 w-full relative">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#1800ad]">
              Welcome Back, Poorvika 👋
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <p className="text-[#1800ad]/70 font-medium">Let's keep the momentum going.</p>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#f6f4ee] text-[#1800ad] rounded-full border-2 border-[#1800ad] shadow-sm">
                <Flame size={16} className="text-[#1800ad]" fill="currentColor" />
                <span className="text-xs sm:text-sm font-bold tracking-wide">7 Days in a Row</span>
              </div>
            </div>
          </div>

          {/* Search Bar aligned with right column on desktop (width 380px) */}
          <div className="relative w-[calc(100%+16px)] -ml-2 translate-y-1.5 xl:translate-y-0 xl:ml-0 xl:w-[380px]">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search size={18} className="text-[#1800ad]/60" />
            </div>
            <input 
              type="text" 
              placeholder="Search your library..." 
              className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-transparent border-2 border-[#1800ad]/30 rounded-full text-sm outline-none focus:border-[#1800ad] focus:ring-4 focus:ring-[#1800ad]/10 transition-all placeholder:text-[#1800ad]/50 font-medium text-[#1800ad]"
            />
          </div>
        </header>

        {/* Section: My Classes */}
        <section className="mb-8 w-full font-montserrat">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#1800ad]">My Classes</h2>
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="px-5 py-2 bg-[#1800ad] text-[#f6f4ee] border-2 border-[#1800ad] rounded-full text-xs font-extrabold hover:bg-[#f6f4ee] hover:text-[#1800ad] transition-all shadow-md"
            >
              + Join a class
            </button>
          </div>
          
          {isLoadingClasses ? (
            <div className="py-8 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#1800ad]/20 border-t-[#1800ad] rounded-full animate-spin"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="bg-[#f6f4ee] border-2 border-dashed border-[#1800ad]/20 rounded-[32px] p-8 text-center text-[#1800ad]/60 font-semibold text-sm">
              You haven't joined any classes yet. Click "+ Join a class" to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {classes.map((cls) => (
                <motion.div 
                  key={cls.class_id}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedClass(cls)}
                  className="p-5 rounded-[28px] border-2 border-[#1800ad]/20 bg-[#f6f4ee] text-[#1800ad] flex flex-col justify-between cursor-pointer hover:border-[#1800ad] transition-all group shadow-sm min-h-[140px]"
                >
                  <div>
                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block mb-1">{cls.subject}</span>
                    <h3 className="text-lg font-black group-hover:text-[#1800ad] leading-tight">{cls.display_name}</h3>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1800ad]/10 text-xs font-bold opacity-75">
                    <span>Grade {cls.grade}</span>
                    <span className="bg-[#1800ad]/10 px-2.5 py-1 rounded-full font-mono">{cls.class_code}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col xl:grid xl:grid-cols-[1fr_380px] gap-8 lg:gap-10">
          
          {/* Section: Up Next Task */}
          <section className="flex flex-col h-full order-1">
            <h2 className="text-xl font-bold mb-4 text-[#1800ad]">Up Next</h2>
            
            <div className="flex flex-col gap-4 flex-1">
              {isPlaygroundActive ? (
                /* --- STUNNING PLAYGROUND MODE HERO CARD --- */
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -6 }} 
                  onClick={() => navigate('/student/playground')}
                  className="relative bg-[#1800ad] text-[#f6f4ee] p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-between gap-6 overflow-hidden cursor-pointer shadow-xl border-2 border-[#1800ad] flex-1 hover:shadow-2xl transition-all duration-300"
                >
                  {/* Decorative ambient glowing grids representation */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-radial-gradient from-white/10 to-transparent rounded-full blur-2xl pointer-events-none animate-pulse"></div>
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#f6f4ee]/5 rounded-full pointer-events-none transition-transform duration-700 group-hover:scale-125"></div>

                  <div>
                    <div className="flex justify-between items-start z-10 w-full mb-3">
                      <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f6f4ee] text-[#1800ad] rounded-full text-[11px] font-black uppercase tracking-wider shadow">
                        <Sparkles size={13} className="text-amber-500 fill-amber-500 animate-pulse" />
                        Playground Mode Active
                      </div>
                      <span className="text-[10px] bg-white/20 text-[#f6f4ee] font-black px-3 py-1 border border-white/10 rounded-full uppercase tracking-widest font-mono">
                        Explorer rewarded
                      </span>
                    </div>

                    <div className="z-10 mt-3">
                      <p className="text-xl md:text-2xl font-black text-[#f6f4ee] leading-snug">
                        🎉 You've completed everything. Time to explore.
                      </p>
                      <p className="text-xs sm:text-sm text-[#f6f4ee]/70 mt-2 font-medium max-w-[90%] leading-relaxed">
                        No assigned works are currently pending! Deep-dive into unguided Bohr Atom simulations, customized flash assessments, and learning storyboard story reels.
                      </p>
                    </div>
                  </div>

                  {/* Quota visualization */}
                  <div className="z-10 bg-[#f6f4ee]/10 border border-[#f6f4ee]/15 p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs font-bold leading-normal">
                      <span className="opacity-80">PLAYGROUND STRENGTH</span>
                      <span className="font-mono text-amber-300">{quota} / 10 generations used</span>
                    </div>
                    <div className="w-full bg-[#f6f4ee]/10 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${(quota / 10) * 100}%` }}></div>
                    </div>
                    {quota >= 10 ? (
                      <span className="text-[10px] text-amber-300 font-extrabold leading-tight">
                        You've explored a lot this week. Your Playground resets on Monday.
                      </span>
                    ) : (
                      <span className="text-[10px] opacity-60 font-semibold leading-tight">
                        Weekly quota refreshes next Monday at 8:00 AM. Keep inquiring!
                      </span>
                    )}
                  </div>

                  <div className="z-10 mt-2">
                    <button className="flex items-center justify-center gap-2 bg-[#f6f4ee] text-[#1800ad] px-8 py-3.5 rounded-full font-black text-xs hover:bg-white hover:scale-102 transition-all w-full sm:w-auto uppercase tracking-wider">
                      Launch Sandbox
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <motion.div 
                    whileHover={{ y: -4 }} 
                    onClick={() => navigate('/student/task/p1?fromHome=true')}
                    className="bg-[#1800ad] text-[#f6f4ee] p-5 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-between gap-4 md:gap-6 relative overflow-hidden group cursor-pointer shadow-lg border-2 border-[#1800ad] flex-1"
                  >
                    {/* Decorative blob */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#f6f4ee]/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

                    <div>
                      <div className="flex justify-between items-start z-10 w-full mb-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#f6f4ee] text-[#1800ad] rounded-full text-sm font-bold w-fit">
                          <span className="w-2 h-2 rounded-full bg-[#1800ad] animate-pulse"></span>
                          Explain It
                        </div>
                        <div className="px-3 py-1.5 md:px-4 md:py-2 bg-transparent text-[#f6f4ee] rounded-full text-xs md:text-sm font-bold border-2 border-[#f6f4ee]/30">
                          Due Today
                        </div>
                      </div>

                      <div className="z-10 mt-2">
                        <span className="text-[#f6f4ee]/70 font-semibold mb-1 md:mb-2 block tracking-wider uppercase text-xs">Physics • Kinematics</span>
                        <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-[#f6f4ee] leading-tight max-w-[90%]">
                          Laws of Motion & Friction
                        </h3>
                        <p className="text-[#f6f4ee]/80 mt-2 md:mt-3 font-medium max-w-[85%] text-xs md:text-base leading-snug md:leading-relaxed line-clamp-2 sm:line-clamp-none">
                          Teach the concept of static friction to a 10-year old using an everyday example.
                        </p>
                      </div>
                    </div>

                    <div className="z-10 mt-4 md:mt-6 lg:mt-auto">
                      <button className="flex items-center justify-center gap-2 bg-[#f6f4ee] text-[#1800ad] px-6 md:px-8 py-3 rounded-full font-bold text-base hover:bg-white hover:shadow-lg transition-all w-full sm:w-auto">
                        Start Now
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -4 }} 
                    onClick={() => navigate('/student/task/m1?fromHome=true')}
                    className="bg-[#1800ad] text-[#f6f4ee] p-5 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-between gap-4 md:gap-6 relative overflow-hidden group cursor-pointer shadow-lg border-2 border-[#1800ad] flex-1"
                  >
                    {/* Decorative blob */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#f6f4ee]/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

                    <div>
                      <div className="flex justify-between items-start z-10 w-full mb-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#f6f4ee] text-[#1800ad] rounded-full text-sm font-bold w-fit">
                          <span className="w-2 h-2 rounded-full bg-[#1800ad] animate-pulse"></span>
                          Solve It
                        </div>
                        <div className="px-3 py-1.5 md:px-4 md:py-2 bg-transparent text-[#f6f4ee] rounded-full text-xs md:text-sm font-bold border-2 border-[#f6f4ee]/30">
                          Tomorrow
                        </div>
                      </div>

                      <div className="z-10 mt-2">
                        <span className="text-[#f6f4ee]/70 font-semibold mb-1 md:mb-2 block tracking-wider uppercase text-xs">Mathematics • Calculus</span>
                        <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-[#f6f4ee] leading-tight max-w-[90%]">
                          Limits & Derivatives
                        </h3>
                        <p className="text-[#f6f4ee]/80 mt-2 md:mt-3 font-medium max-w-[85%] text-xs md:text-base leading-snug md:leading-relaxed line-clamp-2 sm:line-clamp-none">
                          Evaluate the limits to find the slope of the tangent line. Complete the assigned worksheet.
                        </p>
                      </div>
                    </div>

                    <div className="z-10 mt-4 md:mt-6 lg:mt-auto">
                      <button className="flex items-center justify-center gap-2 bg-[#f6f4ee] text-[#1800ad] px-6 md:px-8 py-3 rounded-full font-bold text-base hover:bg-white hover:shadow-lg transition-all w-full sm:w-auto">
                        Start Now
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </section>

          {/* Right Column (Calendar & CTA) */}
          <aside className="w-full flex flex-col h-fit xl:sticky xl:top-[20px] order-3 xl:order-2 shrink-0">
            
            {/* GitHub Style Calendar */}
            <h2 className="text-xl font-bold text-[#1800ad] mb-4 xl:block">Learning Activity</h2>
            <div className="bg-[#f6f4ee] rounded-[32px] border-2 border-[#1800ad] p-6 lg:p-8 shadow-sm flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-[#1800ad]">Activity Journey</h3>
                  <p className="text-sm text-[#1800ad]/70 font-medium mt-1">1,024 completed</p>
                </div>
                <div className="flex gap-1 text-[#1800ad]">
                  <button className="p-2 hover:bg-[#1800ad]/10 rounded-full transition-colors"><ChevronLeft size={20} /></button>
                  <button className="p-2 hover:bg-[#1800ad]/10 rounded-full transition-colors"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div>
                {/* Month Labels */}
                <div className="flex justify-between text-[10px] md:text-xs font-bold text-[#1800ad]/60 mb-2 uppercase px-1">
                  <span>{new Date().toLocaleString('default', { month: 'long' })}</span>
                </div>

                {/* Contribution Grid */}
                <div className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-[#1800ad]/60 mb-1">
                      {day}
                    </div>
                  ))}
                  {calendarData.map((day, i) => ( 
                    day.value === -1 ? (
                      <div key={i} className="aspect-square" />
                    ) : (
                      <div 
                        key={i} 
                        title={day.value > 0 ? `${day.value} activities` : 'No activity'}
                        className={`aspect-square rounded-sm md:rounded-[4px] relative flex items-center justify-center ${getCellColor(day.value, day.date)} hover:ring-2 hover:ring-offset-1 hover:ring-[#1800ad]/50 transition-all cursor-pointer group/cell`}
                      >
                        <span className="text-[8px] sm:text-[10px] font-bold opacity-0 group-hover/cell:opacity-100 text-[#f6f4ee] bg-[#1800ad]/40 px-1 rounded-sm">{day.dayNumber}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Legend Component */}
              <div className="flex items-center justify-end gap-2 mt-6 text-xs font-medium text-[#1800ad]/70">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-[3px] bg-gray-300"></div>
                    <span>Upcoming</span>
                  </div>
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-[3px] bg-[#1800ad]/10"></div>
                    <div className="w-3 h-3 rounded-[3px] bg-[#1800ad]/30"></div>
                    <div className="w-3 h-3 rounded-[3px] bg-[#1800ad]/50"></div>
                    <div className="w-3 h-3 rounded-[3px] bg-[#1800ad]/70"></div>
                    <div className="w-3 h-3 rounded-[3px] bg-[#1800ad]"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>

          </aside>

          {/* Section: My Progress Strip */}
          <section className="order-2 xl:order-3 xl:col-start-1 xl:col-span-1">
            <h2 className="text-xl font-bold mb-4 text-[#1800ad]">My Progress</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ProgressCard subject="Physics" score={85} />
              <ProgressCard subject="Chemistry" score={72} />
              <ProgressCard subject="Mathematics" score={94} />
              <ProgressCard subject="Biology" score={68} />
            </div>
          </section>

        </div>
        
        {/* Section: Continue Exploring */}
        <div className="mt-8 lg:mt-10">
          <section>
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-bold text-[#1800ad]">Continue Exploring</h2>
               <button className="text-[#1800ad] font-bold text-sm hover:underline opacity-80">View All</button>
            </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                
                <ExploreCard 
                  title="Cellular Respiration" 
                  subject="Biology" 
                  score={82}
                  imgUrl="https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=300"
                />
                <ExploreCard 
                  title="Chemical Bonding" 
                  subject="Chemistry" 
                  score={64}
                  imgUrl="https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=300"
                />
                 <ExploreCard 
                  title="Integral Calculus" 
                  subject="Mathematics" 
                  score={91}
                  imgUrl="https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=300"
                />

              </div>
            </section>
          </div>

        </div>
      </main>

      {/* MODAL: Join Classes */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#f6f4ee] border-2 border-[#1800ad] rounded-[32px] shadow-2xl p-6 md:p-8 max-w-md w-full font-montserrat text-[#1800ad] flex flex-col gap-4 relative max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setIsJoinModalOpen(false)}
                className="absolute top-5 right-5 hover:opacity-75 transition-opacity"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl md:text-2xl font-black text-center uppercase tracking-wide">Join Your Classes</h2>
              <p className="text-xs text-[#1800ad]/70 font-semibold text-center -mt-2">Enter the class codes provided by your teacher</p>

              <div className="flex flex-col gap-2.5 mt-2">
                {joinClassCodes.map((codeItem, index) => (
                  <div key={index} className="flex flex-col gap-1 w-full shrink-0">
                    <input 
                      type="text" 
                      placeholder={`Class Code ${index + 1}`}
                      value={codeItem.value}
                      onChange={(e) => handleClassCodeChange(index, e.target.value)}
                      disabled={isJoining}
                      className="w-full px-6 py-2.5 text-sm bg-transparent border border-[#1800ad] rounded-full text-center text-[#2c2c2c] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1800ad] font-montserrat"
                    />
                    {codeItem.error && (
                      <span className="text-[10px] text-red-600 font-bold text-center px-2">
                        {codeItem.error}
                      </span>
                    )}
                  </div>
                ))}
                
                <button 
                  type="button"
                  onClick={addClassCodeField}
                  disabled={isJoining}
                  className="w-full py-2 border-2 border-dashed border-[#1800ad]/30 text-[#1800ad] hover:border-[#1800ad] rounded-full font-bold text-xs transition-colors flex items-center justify-center gap-1 mt-1 shrink-0"
                >
                  + Add another class
                </button>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="w-1/2 py-3 bg-transparent border-2 border-[#1800ad] hover:bg-[#1800ad]/5 font-bold rounded-full text-center text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleJoinClasses}
                  disabled={isJoining}
                  className="w-1/2 py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] font-bold rounded-full text-center text-sm disabled:opacity-50"
                >
                  {isJoining ? 'Joining...' : 'Join Classes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Class Assignments List */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#f6f4ee] border-2 border-[#1800ad] rounded-[32px] shadow-2xl p-6 md:p-8 max-w-lg w-full font-montserrat text-[#1800ad] flex flex-col gap-4 relative max-h-[85vh]"
            >
              <button 
                onClick={() => setSelectedClass(null)}
                className="absolute top-5 right-5 hover:opacity-75 transition-opacity"
              >
                <X size={20} />
              </button>

              <div>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block mb-0.5">{selectedClass.subject} • Grade {selectedClass.grade}</span>
                <h2 className="text-xl md:text-2xl font-black">{selectedClass.display_name}</h2>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 my-2 pr-1 min-h-[180px]">
                {isLoadingAssignments ? (
                  <div className="m-auto flex flex-col items-center gap-3 py-8">
                    <div className="w-8 h-8 border-4 border-[#1800ad]/20 border-t-[#1800ad] rounded-full animate-spin"></div>
                    <span className="text-xs font-bold text-[#1800ad]/60 animate-pulse">Loading assignments...</span>
                  </div>
                ) : classAssignments.length === 0 ? (
                  <div className="m-auto text-center py-8 text-[#1800ad]/60 font-semibold text-sm leading-relaxed max-w-[80%]">
                     No assignments are queued for this class yet. Enjoy your day!
                  </div>
                ) : (
                  classAssignments.map((assignment) => {
                    const isReady = assignment.status === 'ready';
                    const isPending = assignment.status === 'queued' || assignment.status === 'processing';
                    const isFailed = assignment.status === 'failed';

                    const handleClick = () => {
                      if (!isReady) return;
                      const taskExists = TASKS.some(t => t.id === assignment.assignment_id);
                      if (taskExists) {
                        setSelectedClass(null);
                        navigate(`/student/task/${assignment.assignment_id}`);
                      } else {
                        setSelectedPlaceholderAssignment(assignment);
                      }
                    };

                    return (
                      <div 
                        key={assignment.assignment_id}
                        onClick={handleClick}
                        className={`p-4 rounded-[20px] border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isReady 
                            ? 'border-[#1800ad]/15 hover:border-[#1800ad] bg-[#f6f4ee] cursor-pointer' 
                            : 'border-[#1800ad]/5 bg-[#1800ad]/5 opacity-65'
                        }`}
                      >
                        <div>
                          <span className="text-[9px] font-bold opacity-60 uppercase tracking-wider block mb-0.5">
                            {assignment.assignment_type}
                          </span>
                          <h4 className="font-extrabold text-[#1800ad] text-sm sm:text-base leading-tight">
                            {assignment.title}
                          </h4>
                        </div>
                        <div className="flex items-center shrink-0">
                          {isReady && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                              Ready
                            </span>
                          )}
                          {isPending && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                              Being prepared...
                            </span>
                          )}
                          {isFailed && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-[10px] font-bold uppercase tracking-wider">
                              Not available
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-auto">
                <button 
                  onClick={() => setSelectedClass(null)}
                  className="w-full py-3 bg-[#1800ad] border-2 border-[#1800ad] hover:bg-[#f6f4ee] text-[#f6f4ee] hover:text-[#1800ad] font-bold rounded-full text-center text-sm transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Placeholder Assignment Detail Preview */}
      <AnimatePresence>
        {selectedPlaceholderAssignment && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#f6f4ee] border-2 border-[#1800ad] rounded-[32px] shadow-2xl p-6 md:p-8 max-w-lg w-full font-montserrat text-[#1800ad] flex flex-col gap-5 relative max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedPlaceholderAssignment(null)}
                className="absolute top-5 right-5 hover:opacity-75 transition-opacity"
              >
                <X size={20} />
              </button>

              <div>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block mb-0.5">{selectedPlaceholderAssignment.assignment_type} Preview</span>
                <h2 className="text-xl md:text-2xl font-black leading-tight">{selectedPlaceholderAssignment.title}</h2>
              </div>

              <div className="bg-white border border-[#1800ad]/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center py-10">
                {selectedPlaceholderAssignment.assignment_type === 'quiz' ? (
                  <>
                    <HelpCircle size={48} className="text-[#1800ad] mb-4 animate-bounce" />
                    <h3 className="text-lg font-black text-[#1800ad] mb-2">Quiz Simulator Ready</h3>
                    <p className="text-xs text-[#1800ad]/70 max-w-xs font-semibold leading-relaxed">
                      This is a preview of the generated quiz. In a live environment, this loads active database questions from the class presets.
                    </p>
                  </>
                ) : selectedPlaceholderAssignment.assignment_type === 'simulation' ? (
                  <>
                    <Beaker size={48} className="text-[#1800ad] mb-4 animate-pulse" />
                    <h3 className="text-lg font-black text-[#1800ad] mb-2">Virtual Sandbox Ready</h3>
                    <p className="text-xs text-[#1800ad]/70 max-w-xs font-semibold leading-relaxed">
                      Interact with Virtual parameters and sliders to explore the core properties of the simulation.
                    </p>
                  </>
                ) : (
                  <>
                    <Play size={48} className="text-[#1800ad] mb-4" />
                    <h3 className="text-lg font-black text-[#1800ad] mb-2">Video Player Ready</h3>
                    <p className="text-xs text-[#1800ad]/70 max-w-xs font-semibold leading-relaxed">
                      Watch custom AI concept story reels illustrating physical processes in real-time.
                    </p>
                  </>
                )}
                
                <button 
                  onClick={() => {
                    setSelectedPlaceholderAssignment(null);
                    setSelectedClass(null);
                    navigate('/student/playground');
                  }}
                  className="mt-6 px-6 py-2.5 bg-[#1800ad] text-[#f6f4ee] border-2 border-[#1800ad] rounded-full text-xs font-black hover:bg-white hover:text-[#1800ad] transition-all shadow"
                >
                  Open in Sandbox Playground
                </button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedPlaceholderAssignment(null)}
                  className="w-full py-3 bg-transparent border-2 border-[#1800ad] hover:bg-[#1800ad]/5 font-bold rounded-full text-center text-sm"
                >
                  Back to assignments
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// ------ Helper Components ------

function ProgressCard({ subject, score }: { subject: string, score: number }) {
  return (
    <motion.div whileHover={{ y: -2 }} className="p-4 md:p-5 rounded-3xl border-2 border-[#1800ad]/20 bg-[#f6f4ee] text-[#1800ad] flex flex-col gap-4 cursor-pointer hover:border-[#1800ad] transition-colors group shadow-sm">
      <span className="text-xs font-bold opacity-70 uppercase tracking-wider">{subject}</span>
      <div className="flex items-end justify-between mt-auto">
        <span className="text-4xl font-black group-hover:scale-105 origin-bottom-left transition-transform duration-300">
          {score}<span className="text-xl opacity-60 ml-0.5">%</span>
        </span>
      </div>
      {/* Mini Progress Bar Line */}
      <div className="w-full bg-[#1800ad]/10 h-1.5 rounded-full overflow-hidden mt-1">
        <div className="h-full bg-[#1800ad] rounded-full" style={{ width: `${score}%` }}></div>
      </div>
    </motion.div>
  );
}

function ExploreCard({ title, subject, imgUrl, score }: { title: string, subject: string, imgUrl: string, score: number }) {
  return (
    <motion.div className="w-full shrink-0 bg-[#f6f4ee] rounded-3xl p-3 border-2 border-[#1800ad]/20 cursor-pointer group hover:border-[#1800ad] transition-colors flex flex-col">
      <div className="w-full h-[140px] rounded-[20px] overflow-hidden mb-4 relative">
        <div className="absolute inset-0 bg-[#1800ad]/10 group-hover:bg-transparent transition-colors z-10"></div>
        <img src={imgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        
        {/* Play Icon overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-[#f6f4ee]/90 rounded-full flex items-center justify-center text-[#1800ad] backdrop-blur-sm">
            <Play size={20} className="ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="px-2 pb-2 flex-col flex flex-1 justify-between">
        <div>
          <span className="text-xs font-bold text-[#1800ad]/60 uppercase tracking-wider">{subject}</span>
          <h4 className="text-lg font-bold text-[#1800ad] mt-1 leading-tight">{title}</h4>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#1800ad]/10">
           <span className="text-sm font-bold text-[#1800ad]">Understanding: {score}%</span>
        </div>
      </div>
    </motion.div>
  );
}
