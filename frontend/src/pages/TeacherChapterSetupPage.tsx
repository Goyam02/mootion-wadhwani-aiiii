import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  Film, 
  Beaker, 
  HelpCircle, 
  AlertCircle, 
  Sliders, 
  CheckSquare, 
  Calendar, 
  Check, 
  BookOpen, 
  LayoutDashboard, 
  BarChart2, 
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Eye
} from 'lucide-react';
import { NavItem } from '../components/NavItem';

interface ActivityItem {
  id: string;
  type: 'video' | 'simulation' | 'explain' | 'predict' | 'spot' | 'connect';
  title: string;
  desc: string;
  previewText: string;
  lastPrompt?: string;
  showRegenPrompt: boolean;
  active: boolean;
}

export function TeacherChapterSetupPage() {
  const { classId, chapterId } = useParams<{ classId: string, chapterId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [deadline, setDeadline] = useState('2026-06-25');
  const [specialNote, setSpecialNote] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Active custom regenerate instructions
  const [regenText, setRegenText] = useState<Record<string, string>>({});

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: 'act-1',
      type: 'video',
      title: 'Concept Video',
      desc: 'AI-generated 3D interactive lecture video with embedded checkpoints about Static Friction forces.',
      previewText: 'A beautiful animated lesson structure on wet-surface adhesion, surface asperities under extreme zoom, and free body force balances.',
      showRegenPrompt: false,
      active: true
    },
    {
      id: 'act-2',
      type: 'simulation',
      title: 'Interactive Simulation',
      desc: 'Buoyancy & Force displacement widget with adjustable friction coefficients & mass blocks.',
      previewText: 'A sandbox featuring blocks of Slate, Wood, and Copper where students drag force vectors to overcome friction threshold limits.',
      showRegenPrompt: false,
      active: true
    },
    {
      id: 'act-3',
      type: 'explain',
      title: 'Explain It',
      desc: 'Student reasoning checker asking to translate formulas into conversational analogies.',
      previewText: 'Assesses explanation of: "Why rubber soles stick to mountain cliff walls better than pure plastic soles?"',
      showRegenPrompt: false,
      active: true
    },
    {
      id: 'act-4',
      type: 'predict',
      title: 'Predict It',
      desc: 'Dynamic outcome checker. Students predict block status on extreme inclines before clicking Play.',
      previewText: 'Scenario: "With an incline angle of 35 degrees and dry wood on slate, does the block shift or stay stationary?"',
      showRegenPrompt: false,
      active: true
    },
    {
      id: 'act-5',
      type: 'spot',
      title: 'Spot It (Misconception Checker)',
      desc: 'Active error spotting module challenging students to identify falsified statements.',
      previewText: 'A dialogue of 3 classmates where the student has to spot the scientific fallacy: "Friction always works opposite to any motion vector."',
      showRegenPrompt: false,
      active: true
    },
    {
      id: 'act-6',
      type: 'connect',
      title: 'Connect It',
      desc: 'Syllabus cross-link mapping real friction vectors to tire designs or bio-limbs.',
      previewText: 'Interactive exploration: Formula translation connecting kinetic micro-bumping force coefficients to mechanical gear systems.',
      showRegenPrompt: false,
      active: true
    }
  ]);

  // Simulate AI Generation on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleActive = (id: string) => {
    setActivities(prev => prev.map(act => act.id === id ? { ...act, active: !act.active } : act));
  };

  const handleToggleRegenPrompt = (id: string) => {
    setActivities(prev => prev.map(act => act.id === id ? { ...act, showRegenPrompt: !act.showRegenPrompt } : act));
  };

  const handleRegenerateSubmit = (id: string) => {
    const prompt = regenText[id] || '';
    if (!prompt.trim()) return;

    // Simulate item updating
    setActivities(prev => prev.map(act => {
      if (act.id === id) {
        return {
          ...act,
          desc: `Regenerated using: "${prompt}"`,
          previewText: `Rebuilt with natural focus guidelines. Adjusted details to highlight: ${prompt}`,
          showRegenPrompt: false,
          lastPrompt: prompt
        };
      }
      return act;
    }));

    // Clear buffer
    setRegenText(prev => ({ ...prev, [id]: '' }));
  };

  const handlePublishAssignment = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/teacher/class/${classId || 'class-8-physics'}`);
      }, 1500);
    }, 1800);
  };

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-6 py-2.5 flex justify-between items-center z-40 rounded-full border-[2px] border-[#f6f4ee]">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
        <NavItem icon={<BookOpen size={24} />} active onClick={() => navigate(`/teacher/class/${classId}`)} />
        <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
        <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
          <NavItem icon={<BookOpen size={24} />} active onClick={() => navigate(`/teacher/class/${classId}`)} />
          <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
          <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
        </nav>
        <div onClick={() => navigate('/')} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-extrabold text-lg">P</span>
        </div>
      </aside>

      {/* Content wrapper */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
        <div className="max-w-[1000px] w-full">
          
          {/* Back Trigger */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => navigate(`/teacher/class/${classId || 'class-8-physics'}`)}
              className="p-2 border-2 border-[#1800ad] rounded-full text-[#1800ad] hover:bg-[#1800ad]/10 transition-colors"
            >
              <ArrowLeft size={16} className="stroke-[3]" />
            </button>
            <span className="text-xs font-black uppercase tracking-wider font-mono opacity-85">Chapter Workspace Builder</span>
          </div>

          <AnimatePresence mode="wait">
            {isLoading ? (
              /* GORGEOUS SIMULATED GENERATING SCREEN */
              <motion.div 
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4"
              >
                <div className="relative mb-6">
                  {/* Absolute outer orbit circle rotating */}
                  <div className="w-16 h-16 rounded-full border-4 border-t-[#1800ad] border-r-transparent border-b-transparent border-l-transparent animate-spin duration-1000"></div>
                  <Sparkles size={28} className="text-[#1800ad] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce mt-0.5" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#1800ad] tracking-tight">
                  Generating content for Static Friction & Laws...
                </h2>
                <p className="text-xs font-bold text-[#1800ad]/60 uppercase tracking-widest mt-2 animate-pulse font-mono">
                  Synthesizing concept videos, sandboxes & misconceptions
                </p>
                <p className="text-xs font-semibold text-[#1800ad]/70 mt-4 max-w-sm">
                  Aligning curriculum to NCERT Class 8 Physics standards automatically. Please hold on.
                </p>
              </motion.div>
            ) : (
              /* REAL CHAPTER BUILDER PANEL */
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="border-b-2 border-[#1800ad]/15 pb-4 mb-4">
                  <span className="text-xs font-bold font-mono text-[#1800ad]/60 uppercase">NCERT Chapter Structure</span>
                  <h1 className="text-3xl font-black text-[#1800ad] tracking-tight mt-1">
                    Static Friction & Forces Chapter Setup
                  </h1>
                  <p className="text-sm font-semibold opacity-75 mt-1">
                    Review or regenerate activities. Customize student assessment logic with specific natural language prompts.
                  </p>
                </div>

                {/* Grid of the 6 activities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activities.map((act) => (
                    <div 
                      key={act.id}
                      className={`border-2 rounded-[24px] p-5.5 flex flex-col justify-between transition-all bg-[#f6f4ee] shadow-sm ${
                        act.active ? 'border-[#1800ad]' : 'border-[#1800ad]/15 opacity-60'
                      }`}
                    >
                      <div>
                        {/* Upper row: icon and selector */}
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="p-2.5 bg-[#1800ad]/5 rounded-xl border border-[#1800ad]/15 text-[#1800ad]">
                              {act.type === 'video' && <Film size={18} />}
                              {act.type === 'simulation' && <Beaker size={18} />}
                              {act.type === 'explain' && <HelpCircle size={18} />}
                              {act.type === 'predict' && <Sliders size={18} />}
                              {act.type === 'spot' && <AlertCircle size={18} />}
                              {act.type === 'connect' && <BookOpen size={18} />}
                            </span>
                            <h3 className="font-black text-sm tracking-tight text-[#1800ad]">
                              {act.title}
                            </h3>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={act.active} 
                              onChange={() => handleToggleActive(act.id)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-[#1800ad]"></div>
                          </label>
                        </div>

                        {/* Description */}
                        <p className="text-xs font-semibold leading-relaxed text-[#1800ad]/80 mb-4">
                          {act.desc}
                        </p>

                        {/* Expandable Preview Section */}
                        <div className="bg-[#f6f4ee] border border-[#1800ad]/10 rounded-2xl p-4.5 mb-4 text-xs font-semibold leading-snug">
                          <div className="text-[9px] font-black uppercase tracking-wider text-[#1800ad] mb-1">Preview outline</div>
                          {act.previewText}
                        </div>
                      </div>

                      {/* Item Bottom Actions */}
                      <div className="flex flex-col gap-2 border-t border-[#1800ad]/10 pt-3.5 mt-auto">
                        {act.showRegenPrompt ? (
                          <div className="flex flex-col gap-2 mt-1">
                            <textarea 
                              placeholder="e.g. Include real-world car braking friction scenarios..."
                              value={regenText[act.id] || ''}
                              onChange={(e) => setRegenText(prev => ({ ...prev, [act.id]: e.target.value }))}
                              className="w-full text-xs p-3 bg-[#f6f4ee] border border-[#1800ad]/35 rounded-xl font-semibold outline-none focus:border-[#1800ad] text-[#1800ad]"
                              rows={2}
                            />
                            <div className="flex justify-end gap-2 text-[10px] font-black">
                              <button 
                                onClick={() => handleToggleRegenPrompt(act.id)}
                                className="px-3.5 py-1.5 rounded-full border border-[#1800ad]/30"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={() => handleRegenerateSubmit(act.id)}
                                className="px-4 py-1.5 rounded-full bg-[#1800ad] text-white flex items-center gap-1"
                              >
                                Submit <Send size={10} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2.5 shrink-0 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Simulated modal preview of ${act.title}`);
                              }}
                              className="px-4 py-2 border border-[#1800ad]/20 hover:bg-[#1800ad]/5 rounded-full text-[11px] font-black flex items-center gap-1 leading-none transition-colors"
                            >
                              <Eye size={12} /> Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleRegenPrompt(act.id)}
                              className="px-4 py-2 border border-[#1800ad] bg-[#1800ad] text-[#f6f4ee] hover:bg-white hover:text-[#1800ad] rounded-full text-[11px] font-black flex items-center gap-1 leading-none transition-all"
                            >
                              <RotateCcw size={12} /> Regenerate
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>

                {/* Bottom CTA for Configuration Settings trigger */}
                <div className="mt-8 border-t-2 border-[#1800ad]/15 pt-6 flex justify-end">
                  <button
                    onClick={() => setShowConfig(true)}
                    className="bg-[#1800ad] text-[#f6f4ee] py-4 px-10 rounded-full font-black text-sm uppercase tracking-widest hover:scale-102 transition-transform shadow-xl"
                  >
                    Assign To Class
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sliding panel / modal for Assign configurations */}
          <AnimatePresence>
            {showConfig && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#1800ad]/40 z-50 flex items-center justify-center p-4"
              >
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-[#f6f4ee] rounded-[32px] border-2 border-[#1800ad] w-full max-w-lg p-6 sm:p-10 shadow-2xl relative"
                >
                  <h3 className="text-2xl font-black text-[#1800ad] tracking-tight mb-2">
                    Publish Assignment Setup
                  </h3>
                  <p className="text-xs font-semibold opacity-75 mb-6">
                    Configure the final details before sending these generated interactive tasks to all 24 students.
                  </p>

                  {success ? (
                    <div className="flex flex-col items-center py-6 text-center">
                      <div className="w-12 h-12 bg-[#1800ad] text-[#f6f4ee] rounded-full flex items-center justify-center mb-4">
                        <Check size={28} className="stroke-[3.5]" />
                      </div>
                      <h4 className="text-lg font-black">Chapter Assigned Successfully!</h4>
                      <p className="text-xs font-semibold opacity-70 mt-1">
                        Syllabus roadmap status has been changed to "Active Content".
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Select activities preview list */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider opacity-65">Activities Selected</label>
                        <div className="bg-[#f6f4ee] rounded-2xl border border-[#1800ad]/15 p-4 flex flex-wrap gap-2 text-xs font-bold text-[#1800ad]">
                          {activities.filter(a => a.active).map(a => (
                            <span key={a.id} className="bg-[#1800ad]/5 whitespace-nowrap px-3 py-1 rounded-full border border-[#1800ad]/15 flex items-center gap-1">
                              <Check size={12} className="text-[#1800ad] stroke-[3]" />
                              {a.title}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Set Deadline */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider opacity-65">Set Deadline</label>
                        <div className="relative">
                          <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1800ad]" />
                          <input 
                            type="date"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#f6f4ee] border border-[#1800ad]/35 rounded-2xl text-sm font-semibold outline-none focus:border-[#1800ad] text-[#1800ad]"
                          />
                        </div>
                      </div>

                      {/* Add Optional Note */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black uppercase tracking-wider opacity-65">Add optional custom notes for class</label>
                        <textarea 
                          placeholder="e.g. Please finish the Interactive buoyancy simulation sandbox blocks and complete the Spot It quiz questions before Thursday's review lecture!"
                          value={specialNote}
                          onChange={(e) => setSpecialNote(e.target.value)}
                          className="w-full text-xs p-4 bg-[#f6f4ee] border border-[#1800ad]/35 rounded-2xl font-semibold outline-none focus:border-[#1800ad] text-[#1800ad]"
                          rows={3}
                        />
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-4 mt-4">
                        <button
                          type="button"
                          onClick={() => setShowConfig(false)}
                          className="flex-1 py-3.5 border-2 border-[#1800ad] rounded-full text-xs font-black uppercase tracking-wider text-center"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePublishAssignment}
                          className="flex-1 bg-[#1800ad] hover:bg-[#1800ad]/90 text-white rounded-full py-3.5 text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-2"
                        >
                          {publishing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                              <span>Publishing...</span>
                            </>
                          ) : (
                            <span>Publish</span>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
