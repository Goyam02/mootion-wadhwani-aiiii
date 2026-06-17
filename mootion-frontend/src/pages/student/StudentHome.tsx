import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, CheckSquare, Compass, User as UserIcon,
  Flame, ArrowRight, HelpCircle, Sparkles, Plus, BookOpen, AlertCircle, RefreshCw
} from 'lucide-react';
import { api } from '../../api';
import { ClassInfo, ChapterInfo, User, StudentTask } from '../../types';

interface StudentHomeProps {
  user: User;
  onLogout: () => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'explore' | 'profile'>('home');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Class code join state
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Doubt flow trigger
  const [doubtOpen, setDoubtOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const cls = await api.getStudentClasses();
        setClasses(cls);
        if (cls.length > 0) {
          const firstClassId = cls[0].class_id;
          localStorage.setItem('active_class_id', firstClassId);
          const [tsk, chaps] = await Promise.all([
            api.getStudentAssignments(firstClassId),
            api.getChapters(firstClassId).catch(() => [] as ChapterInfo[])
          ]);
          setTasks(tsk);
          setChapters(chaps);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;
    setJoining(true);
    setJoinError('');
    try {
      await api.joinClass(joinCode);
      const cls = await api.getStudentClasses();
      setClasses(cls);
      if (cls.length > 0) {
        const tsk = await api.getStudentAssignments(cls[0].class_id);
        setTasks(tsk);
      }
      setJoinCode('');
    } catch (err: any) {
      setJoinError(err.message || 'Invalid code.');
    } finally {
      setJoining(false);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const nextTask = pendingTasks[0]; // Most urgent task

  const getScoreColor = (val: number) => {
    if (val < 1) return 'bg-rose-500 text-white';
    if (val < 2) return 'bg-amber-500 text-white';
    if (val < 2.5) return 'bg-emerald-500 text-white';
    return 'bg-cyan-500 text-white';
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#07070c] relative z-10 text-slate-100">
      <div className="grid-overlay" />
      <div className="ambient-light" />

      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 border-b md:border-r border-slate-800 bg-slate-950/80 backdrop-blur-md p-5 flex flex-row md:flex-col justify-between items-center md:items-stretch z-20 shrink-0">
        <div className="flex flex-col md:w-full gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-600/30">
              M
            </div>
            <span className="text-xl font-bold tracking-tight text-white hidden md:inline">mootion</span>
          </div>

          <div className="flex md:flex-col gap-1 md:w-full">
            {[
              { id: 'home', label: 'Home', icon: HomeIcon },
              { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
              { id: 'explore', label: 'Explore', icon: Compass },
              { id: 'profile', label: 'Profile', icon: UserIcon },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'tasks') {
                      navigate('/student/tasks');
                    } else if (tab.id === 'explore') {
                      navigate('/student/explore');
                    } else if (tab.id === 'profile') {
                      navigate('/student/profile');
                    } else {
                      setActiveTab(tab.id as any);
                    }
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active 
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden md:flex flex-col gap-4 border-t border-slate-800 pt-5">
          <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold">
              {user.full_name[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate">{user.full_name}</span>
              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{user.role}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-450 hover:text-rose-350 hover:bg-rose-500/10 transition-all"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 pb-28 md:pb-8 relative">
        {activeTab === 'home' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Top Greeting and Streak */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold text-slate-200 font-heading">
                  Hey, {user.full_name} 👋
                </h1>
                <p className="text-slate-400 text-xs mt-0.5">Let's practice some science concepts today!</p>
              </div>

              {/* Streak: No backend endpoint available */}
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 text-slate-500 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                <AlertCircle size={12} className="text-slate-600" />
                <span>Streak — No endpoint</span>
              </div>
            </div>

            {/* CLASS JOIN BAR OR NO CLASSES ACTIVE STATE */}
            {classes.length === 0 && (
              <div className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-6 border-violet-500/30 bg-slate-950/70">
                <div className="flex gap-4 items-start max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0 animate-bounce">
                    <BookOpen size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-slate-200 font-heading">Join Your Classroom</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">
                      Enter the unique Class Code shared by your science teacher to load tasks, videos, and playground elements.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleJoinClass} className="flex gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Enter Code (e.g. AB12CD34)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="form-input md:w-56 bg-slate-900 text-xs font-mono uppercase tracking-wider"
                  />
                  <button
                    type="submit"
                    disabled={joining}
                    className="btn-primary py-2 text-xs flex-shrink-0"
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </button>
                </form>
              </div>
            )}

            {/* URGENT UP NEXT TASK / PLAYGROUND CARD */}
            {classes.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  Focus Zone
                </span>

                {nextTask ? (
                  /* Up Next Task Card */
                  <div className="glass-panel p-6 border-l-4 border-l-violet-500 bg-gradient-to-r from-violet-950/10 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                        Up Next: {nextTask.chapter_title}
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-200 font-heading">
                        {nextTask.title}
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
                        {nextTask.instructions || 'Explain this concept to Mootion AI in your own words. It takes 5 minutes.'}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/student/class/${nextTask.class_id}/task/${nextTask.assignment_id}`)}
                      className="btn-primary py-3 px-6 flex-shrink-0 font-bold"
                    >
                      <span>Start Now</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  /* Playground Entry Card */
                  <div className="glass-panel p-6 border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-950/15 to-transparent flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:shadow-cyan-600/5 hover:border-cyan-500/40">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1">
                        <Sparkles size={12} className="text-cyan-400" />
                        Playground Mode Active
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-200 font-heading">
                        You're All Caught Up!
                      </h2>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xl">
                        No pending homework assignments. Generate a new concept video, experiment with simulations, or tinker with science models.
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/student/playground')}
                      className="btn-primary py-3 px-6 bg-gradient-to-r from-cyan-500 to-violet-500 border-none flex-shrink-0 font-bold"
                    >
                      <span>Enter Playground</span>
                      <Sparkles size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* MY PROGRESS STRIP */}
            {classes.length > 0 && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  My Progress
                </span>

                {/* No student-facing progress endpoint available */}
                <div className="glass-panel p-5 flex items-center gap-3 border-dashed border-slate-700">
                  <AlertCircle size={18} className="text-slate-600 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-400">No backend endpoint available</span>
                    <span className="text-[11px] text-slate-600 mt-0.5">Student-facing progress scores require a dedicated API endpoint (e.g. <code className="font-mono text-slate-500">/students/progress</code>).</span>
                  </div>
                </div>
              </div>
            )}

            {/* CONTINUE EXPLORING SECTION */}
            {classes.length > 0 && (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                  Continue Exploring
                </span>

                {chapters.length === 0 ? (
                  <div className="glass-panel p-5 flex items-center gap-3 border-dashed border-slate-700">
                    <AlertCircle size={18} className="text-slate-600 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-400">No data available — no chapters found for your class.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {chapters.slice(0, 6).map(ch => (
                      <div
                        key={ch.chapter_id}
                        onClick={() => navigate('/student/explore')}
                        className="glass-panel p-5 cursor-pointer hover:border-slate-700 hover:scale-[1.01] flex flex-col gap-4"
                      >
                        <div className="w-full aspect-video bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden text-slate-500">
                          <Compass size={32} className="opacity-30" />
                          <div className="absolute top-2 right-2 bg-violet-600/20 text-violet-300 border border-violet-500/20 rounded-full px-2 py-0.5 text-[9px] font-bold">
                            {ch.status === 'active' ? 'Active' : 'Unlocked'}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <h4 className="font-bold text-slate-200 text-sm font-heading">{ch.title}</h4>
                          {ch.description && (
                            <p className="text-slate-400 text-xs leading-relaxed mt-0.5">
                              {ch.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-950 border-t border-slate-800 py-2.5 px-4 flex justify-around items-center md:hidden z-30">
        {[
          { id: 'home', label: 'Home', icon: HomeIcon },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'explore', label: 'Explore', icon: Compass },
          { id: 'profile', label: 'Profile', icon: UserIcon },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'tasks') {
                  navigate('/student/tasks');
                } else if (tab.id === 'explore') {
                  navigate('/student/explore');
                } else if (tab.id === 'profile') {
                  navigate('/student/profile');
                } else {
                  setActiveTab(tab.id as any);
                }
              }}
              className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
                active ? 'text-violet-500' : 'text-slate-500 hover:text-slate-355'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* FLOATING "I'M STUCK" DOUBT FLOW TRIGGER */}
      {classes.length > 0 && (
        <button
          onClick={() => navigate('/student/doubt')}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform z-40 border border-white/10"
          title="Doubt Flow: I'm Stuck!"
        >
          <HelpCircle size={24} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[8px] font-bold flex items-center justify-center text-white">!</span>
          </span>
        </button>
      )}
    </div>
  );
};
