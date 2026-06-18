import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Compass,
  Gamepad2,
  Search,
  ArrowRight,
  ChevronRight,
  BookOpen,
  Atom,
  FlaskConical,
  Calculator,
  Leaf,
  Monitor
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

interface Chapter {
  chapter_id: string;
  class_id: string;
  sequence_number: number;
  title: string;
  status: string;
  asset_count: number;
}

interface SimSubject {
  id: string;
  name: string;
  topics: string[];
  icon: string;
}

type ChapterWithClass = Chapter & { subject: string; class_id: string };

// ─── Subject icon helper ──────────────────────────────────────────────────

const SUBJECT_ICON = (subject: string, size = 22) => {
  const s = subject.toLowerCase();
  if (s.includes('physics')) return <Atom size={size} />;
  if (s.includes('chemistry')) return <FlaskConical size={size} />;
  if (s.includes('math')) return <Calculator size={size} />;
  if (s.includes('biology')) return <Leaf size={size} />;
  if (s.includes('computer')) return <Monitor size={size} />;
  return <BookOpen size={size} />;
};

// ─── Component ────────────────────────────────────────────────────────────

export function StudentExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [chaptersByClass, setChaptersByClass] = useState<Record<string, Chapter[]>>({});
  const [simSubjects, setSimSubjects] = useState<SimSubject[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isLoadingSims, setIsLoadingSims] = useState(true);

  // ── Fetch classes then chapters ──
  const loadData = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const classData: StudentClass[] = await api.get('/students/classes');
      setClasses(classData);

      if (classData.length > 0) {
        setIsLoadingChapters(true);
        const chapterResults = await Promise.allSettled(
          classData.map(cls =>
            api.get(`/teachers/classes/${cls.class_id}/chapters`).then((chs: Chapter[]) => ({
              class_id: cls.class_id,
              chapters: chs,
            }))
          )
        );
        const byClass: Record<string, Chapter[]> = {};
        chapterResults.forEach(r => {
          if (r.status === 'fulfilled') {
            byClass[r.value.class_id] = r.value.chapters.sort(
              (a, b) => a.sequence_number - b.sequence_number
            );
          }
        });
        setChaptersByClass(byClass);
        setIsLoadingChapters(false);
      }
    } catch (err: any) {
      console.error('Failed to load explore data:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, []);

  // ── Fetch simulation subjects ──
  const loadSimSubjects = useCallback(async () => {
    setIsLoadingSims(true);
    try {
      const data: SimSubject[] = await api.get('/simulations/supported-subjects');
      setSimSubjects(data);
    } catch {
      setSimSubjects([]);
    } finally {
      setIsLoadingSims(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadSimSubjects();
  }, [loadData, loadSimSubjects]);

  // ── Filtered chapters grouped by subject ──
  const filteredGroups: { cls: StudentClass; chapters: Chapter[] }[] = classes.map(cls => {
    const chapters = (chaptersByClass[cls.class_id] ?? []).filter(ch => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return ch.title.toLowerCase().includes(q) || cls.subject.toLowerCase().includes(q);
    });
    return { cls, chapters };
  }).filter(g => g.chapters.length > 0);

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      <ChatbotFab context="User is browsing the Chapter Learning catalog on the Explore page." />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-8 py-2.5 flex justify-between items-center z-40 rounded-full shadow-[0_10px_40px_rgba(24,0,173,0.25)] border-[2px] border-[#f6f4ee]">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
        <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
        <NavItem icon={<Compass size={24} />} active onClick={() => navigate('/student/explore')} />
        <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
      </nav>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} active onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
        </nav>
        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] relative">
          <span className="text-[#1800ad] font-bold text-lg">S</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
        <div className="max-w-[1300px] w-full h-full">

          {/* Header */}
          <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-8 lg:mb-10 w-full relative">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1800ad]">Explore</h1>
              <p className="text-[#1800ad]/70 font-semibold mt-1">Browse all chapters assigned by your teacher.</p>
            </div>
            <div className="relative w-[calc(100%+16px)] -ml-2 translate-y-1.5 xl:translate-y-0 xl:ml-0 xl:w-[380px]">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={18} className="text-[#1800ad]/60" />
              </div>
              <input
                type="text"
                placeholder="Search chapters and topics..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-transparent border-2 border-[#1800ad]/30 rounded-full text-sm outline-none focus:border-[#1800ad] focus:ring-4 focus:ring-[#1800ad]/10 transition-all placeholder:text-[#1800ad]/50 font-semibold text-[#1800ad]"
              />
            </div>
          </header>

          {/* Chapters by Subject */}
          {isLoadingClasses ? (
            <div className="flex flex-col gap-12">
              {[1, 2].map(s => (
                <section key={s} className="flex flex-col gap-5">
                  <div className="h-8 w-48 bg-[#1800ad]/10 rounded-full animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-72 rounded-[40px] bg-[#1800ad]/10 animate-pulse border-2 border-[#1800ad]/10"></div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : classes.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
              <BookOpen size={64} className="text-[#1800ad] mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-[#1800ad]">No classes yet</h3>
              <p className="text-[#1800ad] mt-1">Join a class on the home page to start exploring.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-12 pb-10">
              {/* If loading chapters for the first time */}
              {isLoadingChapters && classes.every(c => !chaptersByClass[c.class_id]) ? (
                <div className="py-16 flex items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#1800ad]/20 border-t-[#1800ad] rounded-full animate-spin"></div>
                  <span className="text-sm font-bold text-[#1800ad]/60 animate-pulse">Loading chapters...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
                  <BookOpen size={64} className="text-[#1800ad] mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-[#1800ad]">No chapters found</h3>
                  <p className="text-[#1800ad] mt-1">Your teacher hasn't set up chapters yet, or nothing matches your search.</p>
                </div>
              ) : (
                filteredGroups.map(({ cls, chapters }) => (
                  <section key={cls.class_id} className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b-2 border-[#1800ad]/10 pb-3">
                      <h2 className="text-xl md:text-2xl font-black text-[#1800ad]">{cls.subject}</h2>
                      <span className="text-xs font-semibold text-[#1800ad]/60 bg-[#1800ad]/10 px-2.5 py-0.5 rounded-full">
                        {cls.display_name} · Grade {cls.grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                      {chapters.map(ch => (
                        <motion.div
                          key={ch.chapter_id}
                          whileHover={{ y: -4 }}
                          onClick={() => navigate(`/student/playground?class_id=${cls.class_id}&chapter_id=${ch.chapter_id}`)}
                          className="bg-[#1800ad] text-[#f6f4ee] p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-between gap-5 relative overflow-hidden group cursor-pointer shadow-lg border-2 border-[#1800ad] h-72"
                        >
                          <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#f6f4ee]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

                          <div className="flex flex-col h-full z-10 justify-between">
                            <div className="flex justify-between items-start w-full">
                              <span className="text-[#f6f4ee]/70 font-semibold uppercase tracking-widest text-xs md:text-sm">
                                Chapter {ch.sequence_number}
                              </span>
                              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                                ch.status === 'data_ready' ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' :
                                ch.status === 'active' ? 'bg-blue-400/20 text-blue-300 border-blue-400/30' :
                                'bg-[#f6f4ee]/15 text-[#f6f4ee]/80 border-[#f6f4ee]/20'
                              }`}>
                                {ch.asset_count} assets
                              </span>
                            </div>

                            <div className="mt-2 flex-grow">
                              <h3 className="text-xl md:text-2xl font-bold text-[#f6f4ee] leading-tight group-hover:text-amber-300 transition-colors">
                                {ch.title}
                              </h3>
                            </div>

                            <div className="mt-auto pt-4 border-t border-[#f6f4ee]/10 flex items-center justify-between w-full">
                              <span className="text-xs text-[#f6f4ee]/80 font-bold uppercase tracking-wider">
                                {ch.status}
                              </span>
                              <div className="flex items-center gap-1 text-[#f6f4ee] font-bold text-xs">
                                <span>Enter Chapter</span>
                                <ChevronRight size={14} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                ))
              )}

              {/* Simulation Subjects Row */}
              <section className="flex flex-col gap-5">
                <div className="flex items-center justify-between border-b-2 border-[#1800ad]/10 pb-3">
                  <h2 className="text-xl md:text-2xl font-black text-[#1800ad]">Interactive Simulations</h2>
                  <button
                    onClick={() => navigate('/student/playground')}
                    className="text-sm font-bold text-[#1800ad]/70 hover:text-[#1800ad] flex items-center gap-1 transition-colors"
                  >
                    Open Playground <ArrowRight size={14} />
                  </button>
                </div>

                {isLoadingSims ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-32 rounded-[28px] bg-[#1800ad]/10 animate-pulse border-2 border-[#1800ad]/10"></div>
                    ))}
                  </div>
                ) : simSubjects.length === 0 ? null : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {simSubjects.map(sub => (
                      <motion.div
                        key={sub.id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        onClick={() => navigate(`/student/playground`)}
                        className="p-5 rounded-[28px] border-2 border-[#1800ad]/20 bg-[#f6f4ee] text-[#1800ad] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#1800ad] transition-all group shadow-sm min-h-[120px] text-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#1800ad]/10 flex items-center justify-center text-[#1800ad] group-hover:bg-[#1800ad] group-hover:text-[#f6f4ee] transition-all">
                          {SUBJECT_ICON(sub.name)}
                        </div>
                        <span className="text-sm font-black uppercase tracking-wide">{sub.name}</span>
                        <span className="text-[10px] font-semibold text-[#1800ad]/60">{sub.topics?.length ?? 0} topics</span>
                      </motion.div>
                    ))}

                    {/* Open Playground CTA tile */}
                    <motion.div
                      whileHover={{ y: -4, scale: 1.02 }}
                      onClick={() => navigate('/student/playground')}
                      className="p-5 rounded-[28px] border-2 border-dashed border-[#1800ad]/30 bg-transparent text-[#1800ad] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#1800ad] hover:bg-[#1800ad]/5 transition-all min-h-[120px] text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#1800ad]/10 flex items-center justify-center text-[#1800ad]">
                        <ArrowRight size={22} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-wide">Open Playground</span>
                      <span className="text-[10px] font-semibold text-[#1800ad]/60">Free exploration</span>
                    </motion.div>
                  </div>
                )}
              </section>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
