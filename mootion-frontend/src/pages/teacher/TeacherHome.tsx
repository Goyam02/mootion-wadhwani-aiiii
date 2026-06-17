import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home as HomeIcon, BookOpen, BarChart3, HelpCircle, Settings as SettingsIcon,
  Bell, Calendar, Users, ChevronRight, LogOut, ShieldAlert, CheckCircle2, UserCheck
} from 'lucide-react';
import { api } from '../../api';
import { ClassInfo, User, Language } from '../../types';

interface TeacherHomeProps {
  user: User;
  onLogout: () => void;
  onLanguageChange: (lang: Language) => void;
}

export const TeacherHome: React.FC<TeacherHomeProps> = ({ user, onLogout, onLanguageChange }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'classes' | 'analytics' | 'doubts' | 'settings'>('home');
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGrade, setNewGrade] = useState('8');
  const [newSubject, setNewSubject] = useState('Physics');
  const [classCreateOpen, setClassCreateOpen] = useState(false);
  const [creatingClass, setCreatingClass] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const cls = await api.getTeacherClasses();
        setClasses(cls);
        if (cls.length > 0) {
          const firstClassId = cls[0].class_id;
          const alr = api.getTeacherAlerts(firstClassId);
          setAlerts(alr);
        }
      } catch (e) {
        console.error('Failed to load classes', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrade || !newSubject) return;
    setCreatingClass(true);
    try {
      const classInfo = await api.createClass(newGrade, newSubject);
      
      // Bootstrap curriculum and chapters
      const currRes = await api.bootstrapCurriculum(classInfo.class_id);
      if (currRes && currRes.curriculum_id) {
        await api.bootstrapChapters(classInfo.class_id, currRes.curriculum_id);
      }

      const updated = await api.getTeacherClasses();
      setClasses(updated);
      setClassCreateOpen(false);
    } catch (e) {
      console.error(e);
      alert('Error creating class.');
    } finally {
      setCreatingClass(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#07070c] relative z-10">
      <div className="grid-overlay" />
      <div className="ambient-light" />
      
      {/* Sidebar Navigation - Scales up on Desktop */}
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
              { id: 'home', label: 'Dashboard', icon: HomeIcon },
              { id: 'classes', label: 'Classes', icon: BookOpen },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'doubts', label: 'Doubts', icon: HelpCircle },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'analytics') {
                      navigate('/teacher/analytics');
                    } else if (tab.id === 'doubts') {
                      navigate('/teacher/doubts');
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

        {/* User Badge / Logout */}
        <div className="hidden md:flex flex-col gap-4 border-t border-slate-800 pt-5">
          <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold">
              {user.full_name[0]}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-200 truncate">{user.full_name}</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{user.role}</span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 pb-24 md:pb-8">
        
        {activeTab === 'home' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {/* Header Greeting */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Calendar size={14} /> {formattedDate}
                </span>
                <h1 className="text-3xl font-extrabold text-slate-100 font-heading">
                  Namaste, {user.full_name} 👋
                </h1>
              </div>
              <button 
                onClick={() => setClassCreateOpen(true)}
                className="btn-primary py-2.5 text-sm"
              >
                + Create New Class
              </button>
            </div>

            {/* Create Class Drawer/Modal */}
            {classCreateOpen && (
              <div className="glass-panel p-6 border-violet-500/30 bg-slate-950/90 flex flex-col gap-4 animate-slide-up">
                <h3 className="font-bold text-slate-200">Create New Class</h3>
                <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Grade</label>
                    <select 
                      value={newGrade} 
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="form-input bg-slate-900"
                    >
                      {['6', '7', '8', '9', '10', '11', '12'].map(g => (
                        <option key={g} value={g}>Class {g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Subject</label>
                    <select 
                      value={newSubject} 
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="form-input bg-slate-900"
                    >
                      {['Physics', 'Mathematics', 'Chemistry', 'Biology', 'Computer Science'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setClassCreateOpen(false)}
                      className="btn-secondary py-2 flex-1"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={creatingClass}
                      className="btn-primary py-2 flex-1"
                    >
                      {creatingClass ? 'Saving...' : 'Add Class'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ALERTS SECTION */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <Bell size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Attention Required</h3>
              </div>

              <div className="glass-panel p-6 flex flex-col items-center justify-center text-center py-8 border-amber-500/20 bg-amber-500/5">
                <ShieldAlert size={28} className="text-amber-500 mb-2" />
                <h4 className="font-bold text-slate-200 text-sm">No backend endpoint available</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Classroom notifications and real-time alert logs are currently not supported by the backend services.
                </p>
              </div>
            </div>

            {/* CLASSES GRID */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-400">
                <BookOpen size={16} />
                <h3 className="text-xs font-bold uppercase tracking-wider">Your Classes</h3>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2].map(i => (
                    <div key={i} className="glass-panel h-40 animate-pulse bg-slate-900/20" />
                  ))}
                </div>
              ) : classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {classes.map(cls => (
                    <div
                      key={cls.class_id}
                      onClick={() => navigate(`/teacher/class/${cls.class_id}`)}
                      className="glass-panel p-5 cursor-pointer hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-600/5 flex flex-col justify-between gap-6"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                          Code: {cls.class_code}
                        </span>
                        <h4 className="text-lg font-bold text-slate-200 font-heading">
                          Class {cls.grade} — {cls.subject}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users size={14} className="text-slate-500" />
                          {cls.students_count ?? 'N/A'} Students
                        </span>
                        <span className="bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-[10px]">
                          Last activity: {cls.last_activity_date ?? 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-10 flex flex-col items-center justify-center text-center">
                  <BookOpen size={42} className="text-slate-600 mb-3" />
                  <h4 className="font-bold text-slate-300">No classes active yet</h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed">
                    Set up your first classroom to begin loading NCERT curriculum roadmaps.
                  </p>
                  <button 
                    onClick={() => setClassCreateOpen(true)}
                    className="btn-primary py-2 px-4 mt-5 text-xs"
                  >
                    Set up Class
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-extrabold text-slate-100 font-heading">Active Classes</h1>
              <button 
                onClick={() => setClassCreateOpen(true)}
                className="btn-primary py-2 text-xs"
              >
                + Add Class
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {classes.map(cls => (
                <div
                  key={cls.class_id}
                  onClick={() => navigate(`/teacher/class/${cls.class_id}`)}
                  className="glass-panel p-5 cursor-pointer hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-600/5 flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider">
                      Class Code: {cls.class_code}
                    </span>
                    <h4 className="text-lg font-bold text-slate-200 font-heading">
                      Class {cls.grade} — {cls.subject}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users size={14} className="text-slate-500" />
                      {cls.students_count ?? 'N/A'} Students
                    </span>
                    <span className="bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800 text-[10px]">
                      Last activity: {cls.last_activity_date ?? 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 animate-fade-in max-w-xl">
            <h1 className="text-2xl font-extrabold text-slate-100 font-heading">Settings</h1>
            
            <div className="glass-panel p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Language Preferences</label>
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  {['english', 'hindi', 'gujarati'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => {
                        onLanguageChange(lang as Language);
                        api.setTeacherPreferences(lang);
                      }}
                      className={`py-2 rounded-md text-xs font-bold uppercase transition-all ${
                        user.preferred_language === lang 
                          ? 'bg-violet-600 text-white shadow-md' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal mt-1">
                  Determines the language in which learning visual assets and assessments are generated.
                </p>
              </div>

              <div className="border-t border-slate-800 pt-5 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-200">Account Safety</span>
                  <span className="text-xs text-slate-500">Manage security settings and active tokens</span>
                </div>
                <button
                  onClick={onLogout}
                  className="btn-outline-primary py-1.5 px-4 text-xs font-bold"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-slate-950 border-t border-slate-800 py-2.5 px-4 flex justify-around items-center md:hidden z-30">
        {[
          { id: 'home', label: 'Home', icon: HomeIcon },
          { id: 'classes', label: 'Classes', icon: BookOpen },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'doubts', label: 'Doubts', icon: HelpCircle },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'analytics') {
                  navigate('/teacher/analytics');
                } else if (tab.id === 'doubts') {
                  navigate('/teacher/doubts');
                } else {
                  setActiveTab(tab.id as any);
                }
              }}
              className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${
                active ? 'text-violet-500' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={18} />
              <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
