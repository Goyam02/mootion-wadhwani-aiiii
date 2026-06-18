import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Compass, 
  Gamepad2, 
  Search, 
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Beaker,
  FileQuestion,
  Pencil,
  Film,
  Box,
  Brain
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { NavItem } from '../components/NavItem';
import { ChatbotFab } from '../components/ChatbotFab';

// ─── Types ────────────────────────────────────────────────────────────────

interface StudentClass {
  class_id: string;
  class_code: string;
  display_name: string;
  grade: string;
  subject: string;
}

interface StudentAssignment {
  assignment_id: string;
  class_id: string;
  chapter_id: string;
  assignment_type: string;
  title: string;
  status: string;
  job_count: number;
}

type FlatAssignment = StudentAssignment & { subject: string; display_name: string };

// ─── Label Maps ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  explain_ai: 'Explain It',
  predict_ai: 'Predict It',
  spot_it: 'Spot It',
  connect_it: 'Connect It',
  quiz: 'Quiz',
  video: 'Watch',
  simulation: 'Simulation',
  model: '3D Model',
};

const TYPE_ICON = (type: string) => {
  switch (type) {
    case 'video': return <Film size={16} />;
    case 'simulation': return <Beaker size={16} />;
    case 'quiz': return <FileQuestion size={16} />;
    case 'model': return <Box size={16} />;
    case 'explain_ai': case 'predict_ai': case 'spot_it': case 'connect_it': return <Brain size={16} />;
    default: return <Pencil size={16} />;
  }
};

// ─── Component ───────────────────────────────────────────────────────────

export function StudentTasksPage() {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [assignments, setAssignments] = useState<FlatAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ready' | 'queued' | 'failed'>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const classData: StudentClass[] = await api.get('/students/classes');
      setClasses(classData);

      if (classData.length === 0) {
        setAssignments([]);
        return;
      }

      const results = await Promise.allSettled(
        classData.map(cls =>
          api.get(`/students/classes/${cls.class_id}/assignments`).then(
            (list: StudentAssignment[]) =>
              list.map(a => ({
                ...a,
                subject: cls.subject,
                display_name: cls.display_name,
              }))
          )
        )
      );

      const flat: FlatAssignment[] = [];
      results.forEach(r => {
        if (r.status === 'fulfilled') flat.push(...r.value);
      });
      setAssignments(flat);
    } catch (err: any) {
      console.error('Failed to load tasks:', err);
      if (err.status === 401 || err.status === 403) {
        navigate('/login/student');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtering ──
  const filtered = assignments.filter(a => {
    const matchSearch = searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus =
      statusFilter === 'all' ||
      a.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // ── Group by class/subject ──
  const grouped: Record<string, FlatAssignment[]> = {};
  filtered.forEach(a => {
    const key = `${a.subject}__${a.class_id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(a);
  });

  const groupKeys = Object.keys(grouped);

  const handleStart = (a: FlatAssignment) => {
    if (a.status !== 'ready') return;
    navigate(`/student/playground?assignment_id=${a.assignment_id}&class_id=${a.class_id}`);
  };

  const statusBadge = (status: string) => {
    if (status === 'ready') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 size={10} /> Ready
        </span>
      );
    }
    if (status === 'queued' || status === 'processing') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={10} /> Being prepared...
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-700 border border-red-200">
          <XCircle size={10} /> Unavailable
        </span>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      <ChatbotFab />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-8 py-2.5 flex justify-between items-center z-40 rounded-full shadow-[0_10px_40px_rgba(24,0,173,0.25)] border-[2px] border-[#f6f4ee]">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
        <NavItem icon={<CheckSquare size={24} />} active onClick={() => navigate('/student/tasks')} />
        <NavItem icon={<Compass size={24} />} onClick={() => navigate('/student/explore')} />
        <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
      </nav>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} active onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
        </nav>
        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-opacity duration-300 shadow-sm relative">
          <span className="text-[#1800ad] font-bold text-lg transition-colors duration-300">S</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
        <div className="max-w-[1300px] w-full h-full">

          {/* Top Header */}
          <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-8 lg:mb-10 w-full relative">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#1800ad]">My Tasks</h1>
              <p className="text-[#1800ad]/70 font-medium mt-1">View and manage all assigned learning activities.</p>
            </div>
            <div className="relative w-[calc(100%+16px)] -ml-2 translate-y-1.5 xl:translate-y-0 xl:ml-0 xl:w-[380px]">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={18} className="text-[#1800ad]/60" />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-transparent border-2 border-[#1800ad]/30 rounded-full text-sm outline-none focus:border-[#1800ad] focus:ring-4 focus:ring-[#1800ad]/10 transition-all placeholder:text-[#1800ad]/50 font-medium text-[#1800ad]"
              />
            </div>
          </header>

          {/* Status Filters */}
          <div className="flex overflow-x-auto custom-scrollbar pb-2 mb-8 gap-3 items-center">
            {([
              { value: 'all', label: 'All' },
              { value: 'ready', label: 'Ready' },
              { value: 'queued', label: 'Preparing' },
              { value: 'failed', label: 'Unavailable' },
            ] as const).map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                  statusFilter === opt.value
                    ? 'bg-[#1800ad] text-[#f6f4ee] border-[#1800ad] shadow-md'
                    : 'bg-transparent text-[#1800ad]/70 border-[#1800ad]/20 hover:border-[#1800ad]/50 hover:text-[#1800ad]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col gap-12">
              {[1, 2].map(s => (
                <section key={s} className="flex flex-col gap-5">
                  <div className="h-8 w-48 bg-[#1800ad]/10 rounded-full animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-[220px] rounded-[32px] bg-[#1800ad]/5 animate-pulse border-2 border-[#1800ad]/10"></div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : groupKeys.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
              <CheckSquare size={64} className="text-[#1800ad] mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-[#1800ad]">
                {assignments.length === 0 ? 'No tasks assigned yet.' : 'No tasks found'}
              </h3>
              <p className="text-[#1800ad] mt-1">
                {assignments.length === 0 ? 'Your teacher will assign work here soon.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-12 pb-10">
              {groupKeys.map(key => {
                const groupAssignments = grouped[key];
                const sample = groupAssignments[0];
                return (
                  <section key={key} className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b-2 border-[#1800ad]/10 pb-3">
                      <h2 className="text-xl md:text-2xl font-black text-[#1800ad]">{sample.subject}</h2>
                      <span className="text-xs font-semibold text-[#1800ad]/60 bg-[#1800ad]/10 px-2.5 py-0.5 rounded-full">
                        {sample.display_name}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                      {groupAssignments.map(a => {
                        const isReady = a.status === 'ready';
                        const isPreparing = a.status === 'queued' || a.status === 'processing';
                        const isFailed = a.status === 'failed';

                        return (
                          <motion.div
                            key={a.assignment_id}
                            whileHover={isReady ? { y: -4 } : {}}
                            onClick={() => handleStart(a)}
                            className={`relative rounded-[32px] md:rounded-[40px] p-5 md:p-8 flex flex-col justify-between gap-4 md:gap-6 overflow-hidden border-2 transition-all h-full ${
                              isReady
                                ? 'bg-[#1800ad] text-[#f6f4ee] border-[#1800ad] shadow-lg cursor-pointer'
                                : isPreparing
                                ? 'bg-[#1800ad]/5 text-[#1800ad] border-[#1800ad]/20 cursor-default'
                                : 'bg-[#1800ad]/5 text-[#1800ad]/50 border-[#1800ad]/10 cursor-default'
                            }`}
                          >
                            {isReady && (
                              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#f6f4ee]/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
                            )}

                            <div className="flex flex-col h-full z-10">
                              <div className="flex justify-between items-start w-full mb-2">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold w-fit ${
                                  isReady ? 'bg-[#f6f4ee] text-[#1800ad]' : 'bg-[#1800ad]/10 text-[#1800ad]'
                                }`}>
                                  {TYPE_ICON(a.assignment_type)}
                                  <span>{TYPE_LABELS[a.assignment_type] ?? a.assignment_type}</span>
                                </div>
                                {statusBadge(a.status)}
                              </div>

                              <div className="mt-2 flex-grow">
                                <h3 className={`text-xl md:text-2xl font-bold leading-tight max-w-[90%] ${
                                  isReady ? 'text-[#f6f4ee]' : isFailed ? 'text-[#1800ad]/40' : 'text-[#1800ad]'
                                }`}>
                                  {a.title}
                                </h3>
                              </div>

                              <div className={`mt-4 md:mt-6 pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                isReady ? 'border-[#f6f4ee]/10' : 'border-[#1800ad]/10'
                              }`}>
                                {isReady ? (
                                  <button className="flex items-center justify-center gap-2 bg-[#f6f4ee] text-[#1800ad] px-6 md:px-8 py-3 rounded-full font-bold text-base hover:bg-white hover:shadow-lg transition-all w-full sm:w-auto mt-2 sm:mt-0">
                                    Start <ArrowRight size={18} />
                                  </button>
                                ) : isPreparing ? (
                                  <span className="text-xs text-[#1800ad]/60 font-semibold">Being prepared by your teacher...</span>
                                ) : (
                                  <span className="text-xs text-red-500/70 font-semibold flex items-center gap-1">
                                    <AlertCircle size={12} /> Content unavailable
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
