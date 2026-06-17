import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Award, Globe, Shield, Bell, 
  ChevronRight, Volume2, BookOpen, Activity, AlertCircle
} from 'lucide-react';
import { api } from '../../api';
import { User, Language } from '../../types';

interface StudentProfileProps {
  user: User;
  onLogout: () => void;
  onLanguageChange: (lang: Language) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({ user, onLogout, onLanguageChange }) => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col bg-[#07070c] relative z-10 p-6 md:p-8">
      <div className="grid-overlay" />
      <div className="ambient-light" />

      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 border-b border-slate-900 pb-4">
        <button
          onClick={() => navigate('/student/home')}
          className="text-slate-400 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold">
                {user.full_name[0]}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-100 font-heading">{user.full_name}</h1>
                <p className="text-slate-500 text-xs mt-0.5">Student</p>
              </div>
            </div>

            {/* Streak: No backend endpoint available */}
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 text-slate-500 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle size={12} className="text-slate-600" />
              <span>Streak — No endpoint</span>
            </div>
          </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl w-full mx-auto pb-24">
        
        {/* Left progress column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Subject progress section */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="font-bold text-slate-200 text-sm font-heading flex items-center gap-1.5">
              <BookOpen size={16} className="text-violet-400" />
              Academic Progress Card
            </h3>

            {/* No student-facing progress endpoint available */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/30">
              <AlertCircle size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-400">No backend endpoint available</span>
                <span className="text-[11px] text-slate-600 leading-relaxed">Per-student academic scores are not yet exposed via a student-facing API. A <code className="font-mono text-slate-500">/students/me/progress</code> endpoint is needed.</span>
              </div>
            </div>
          </div>

          {/* Milestones timeline */}
          <div className="glass-panel p-5 flex flex-col gap-4">
            <h3 className="font-bold text-slate-200 text-sm font-heading flex items-center gap-1.5">
              <Award size={16} className="text-cyan-400" />
              Achievements & Milestones
            </h3>

            {/* No milestones/achievements endpoint available */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/30">
              <AlertCircle size={16} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-400">No backend endpoint available</span>
                <span className="text-[11px] text-slate-600 leading-relaxed">Milestones and badge tracking require a dedicated endpoint (e.g. <code className="font-mono text-slate-500">/students/me/achievements</code>).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right settings column */}
        <div className="flex flex-col gap-6">
          
          {/* Language progression ratio & nudge */}
          <div className="glass-panel p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />

            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Language Progression
            </h3>

            {/* No language analytics endpoint available */}
            <div className="flex items-start gap-3 p-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/30">
              <AlertCircle size={14} className="text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold text-slate-400">No backend endpoint available</span>
                <span className="text-[10px] text-slate-600 leading-relaxed">Language usage ratio requires a <code className="font-mono text-slate-500">/students/me/language-stats</code> endpoint.</span>
              </div>
            </div>
          </div>

          {/* Quick Settings Panel */}
          <div className="glass-panel p-5 flex flex-col gap-5">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
              Interface Settings
            </h3>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Language Preferred</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {['english', 'hindi', 'gujarati'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => {
                      onLanguageChange(lang as Language);
                      api.setStudentLanguage(lang);
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
            </div>

            <div className="border-t border-slate-900 pt-4 flex flex-col gap-2">
              <button
                onClick={onLogout}
                className="w-full btn-secondary py-2 text-xs font-bold"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
