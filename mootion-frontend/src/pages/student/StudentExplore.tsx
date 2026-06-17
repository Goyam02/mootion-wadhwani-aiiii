import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Compass, Video, Sliders, Clock, ChevronRight, 
  HelpCircle, Sparkles, BookOpen, Volume2, X 
} from 'lucide-react';
import { api } from '../../api';
import { ChapterInfo, ClassInfo } from '../../types';
import { VideoPlayer } from '../../components/VideoPlayer';
import { SimulationPlayer } from '../../components/SimulationPlayer';

export const StudentExplore: React.FC = () => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Detail view state
  const [activeChapter, setActiveChapter] = useState<ChapterInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'simulation' | 'history'>('video');

  useEffect(() => {
    async function loadData() {
      try {
        const cls = await api.getStudentClasses();
        if (cls.length > 0) {
          setClassInfo(cls[0]);
          const chs = await api.getChapters(cls[0].class_id);
          // Only show chapters that are NOT unset (i.e. generated, active, or data_ready)
          const unlocked = chs.filter(c => c.status !== 'unset');
          setChapters(unlocked);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getScoreColor = (val: number) => {
    if (val < 1) return 'bg-rose-500 text-white';
    if (val < 2) return 'bg-amber-500 text-white';
    if (val < 2.5) return 'bg-emerald-500 text-white';
    return 'bg-cyan-500 text-white';
  };

  const getScoreLabel = (score: number) => {
    if (score === 0) return 'Poor';
    if (score === 1) return 'Partial';
    if (score === 2) return 'Strong';
    return 'Mastery';
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#07070c] relative z-10">
        <span className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider animate-pulse">Unlocking Library...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#07070c] relative z-10 p-6 md:p-8">
      <div className="grid-overlay" />
      <div className="ambient-light" />

      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={() => {
            if (activeChapter) {
              setActiveChapter(null);
            } else {
              navigate('/student/home');
            }
          }}
          className="text-slate-400 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start transition-colors"
        >
          <ArrowLeft size={14} />
          <span>{activeChapter ? 'Back to Library' : 'Back to Dashboard'}</span>
        </button>

        <div className="flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest bg-violet-600/10 px-3 py-1 rounded-full border border-violet-500/20">
              Free Exploration
            </span>
            <h1 className="text-2xl font-extrabold text-slate-200 mt-2 font-heading">
              {activeChapter ? activeChapter.title : 'Chapter Library'}
            </h1>
          </div>
        </div>
      </div>

      {/* VIEW 1: UNLOCKED CHAPTERS LIST */}
      {!activeChapter && (
        <div className="flex-1 flex flex-col gap-5 max-w-4xl w-full mx-auto pb-24 animate-fade-in">
          {chapters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {chapters.map((ch) => (
                <div
                  key={ch.chapter_id}
                  onClick={() => setActiveChapter(ch)}
                  className="glass-panel p-5 cursor-pointer hover:border-violet-500/30 hover:scale-[1.01] flex flex-col justify-between gap-6"
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest">
                      {classInfo?.subject || 'Science'}
                    </span>
                    <h3 className="font-bold text-slate-200 text-md font-heading leading-tight">
                      {ch.title}
                    </h3>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-900 pt-4 text-xs font-bold">
                    <span className="flex items-center gap-1 text-slate-500">
                      <Sparkles size={13} className="text-violet-400" />
                      Free Sandbox Play
                    </span>
                    <span className="text-violet-400 flex items-center gap-0.5">
                      Explore &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
              <Compass size={48} className="text-slate-600 mb-3 animate-pulse" />
              <h4 className="font-bold text-slate-350 font-heading">No Chapters Unlocked</h4>
              <p className="text-slate-500 text-xs mt-1 max-w-sm">
                Chapters will appear here once your teacher configures and activates them.
              </p>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: CHAPTER DETAIL FREE PLAY */}
      {activeChapter && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl w-full mx-auto pb-24 animate-fade-in">
          
          {/* Main sandbox layout */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Tab Toggles */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 max-w-xs">
              {[
                { id: 'video', label: 'Concept Video', icon: Video },
                { id: 'simulation', label: 'Simulation Lab', icon: Sliders }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      active ? 'bg-violet-650 text-white shadow-md' : 'text-slate-450 hover:text-slate-250'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sandbox Media Window */}
            <div className="w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-900 p-2 shadow-2xl">
              {activeTab === 'video' ? (
                <VideoPlayer url={null} title={`${activeChapter.title} — Study Rewatch`} />
              ) : (
                <SimulationPlayer title={`${activeChapter.title} — Unstructured Playground`} />
              )}
            </div>
          </div>

          {/* Right column attempt history log */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-cyan-400" />
              Practice History
            </h3>

            {/* List of past attempts */}
            <div className="flex flex-col gap-3">
              <div className="glass-panel p-6 flex flex-col items-center justify-center text-center border-amber-500/20 bg-amber-500/5 mt-2">
                <Clock size={24} className="text-amber-500 mb-1" />
                <h4 className="font-bold text-slate-200 text-xs">No backend endpoint available</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Student-accessible exercise attempt history is not supported by the backend services.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
