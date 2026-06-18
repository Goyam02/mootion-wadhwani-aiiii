import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  BookOpen, 
  BarChart2, 
  MessageSquare,
  CheckCircle2, 
  Loader2, 
  Flame, 
  Calendar,
  FileText
} from 'lucide-react';
import { NavItem } from '../components/NavItem';
import { api } from '../lib/api';

export function TeacherTopicSetupPage() {
  const { classId, chapterId, topicId } = useParams<{ classId: string; chapterId: string; topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { payload_json?: any, external_url?: string } | null;

  const [resolvedChapter, setResolvedChapter] = useState<any | null>(null);
  const [isLoadingChapter, setIsLoadingChapter] = useState(true);
  const [activeAsset, setActiveAsset] = useState<any | null>(() => {
    // If state is passed via navigate, initialize activeAsset immediately for smoother transitions
    if (state && (state.payload_json !== undefined || state.external_url !== undefined)) {
      return {
        asset_id: topicId,
        asset_type: '', // Will be updated by API response
        title: 'Loading...',
        description: 'Loading details...',
        generation_status: 'ready',
        external_url: state.external_url || null,
        payload_json: state.payload_json || {}
      };
    }
    return null;
  });

  useEffect(() => {
    if (!classId || !chapterId || !topicId) return;
    const loadChapterAndAsset = async () => {
      setIsLoadingChapter(true);
      try {
        const data = await api.get(`/teachers/classes/${classId}/chapters/${chapterId}`);
        setResolvedChapter(data);
        console.log("Fetched chapter details in activity subpage:", data);
        if (data && data.assets) {
          const asset = data.assets.find((a: any) => a.asset_id === topicId);
          setActiveAsset(asset);
          console.log("Fetched active asset details in activity subpage:", asset);
        }
      } catch (err) {
        console.error("Failed to fetch chapter/asset details:", err);
      } finally {
        setIsLoadingChapter(false);
      }
    };
    loadChapterAndAsset();
  }, [classId, chapterId, topicId]);

  // Console log asset render
  if (activeAsset) {
    console.log("Rendering asset details on activity subpage:", activeAsset);
  }

  const activeChapterName = resolvedChapter ? resolvedChapter.title : 'Loading...';
  const activeChapterNumber = resolvedChapter ? `Ch-${resolvedChapter.sequence_number}` : 'Ch-01';
  const activeTopicTitle = activeAsset ? activeAsset.title : 'Loading...';
  const activeTopicNumber = activeAsset ? activeAsset.asset_type.replace('_', ' ') : '01';

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [assignedItemTitle, setAssignedItemTitle] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('2026-06-25');

  // Check if payload_json is empty or minimal (scaffolding only)
  const isMinimalOrPlaceholder = 
    !activeAsset ||
    !activeAsset.payload_json ||
    Object.keys(activeAsset.payload_json).length === 0 ||
    (activeAsset.generation_status !== 'ready' && activeAsset.payload_json.placeholder === true) ||
    (activeAsset.asset_type === 'quiz' && !activeAsset.payload_json.questions && !activeAsset.payload_json.quiz) ||
    (['explain_it', 'predict_it', 'spot_it', 'connect_it'].includes(activeAsset.asset_type) && !activeAsset.payload_json.instructions);

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30 font-montserrat">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-montserrat font-black text-3xl leading-none tracking-widest">M</span>
        </div>

        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
          <NavItem icon={<BookOpen size={24} />} active onClick={() => navigate(`/teacher/class/${classId}`)} />
          <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
          <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
        </nav>

        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-montserrat font-black text-lg">P</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-24 relative flex flex-col h-full font-montserrat">
        
        {/* Back Link Header */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <button 
            onClick={() => navigate(`/teacher/chapter-setup/${classId}/${chapterId}`)}
            className="p-2 border-2 border-[#1800ad] rounded-full text-[#1800ad] hover:bg-[#1800ad]/10 transition-all font-montserrat flex items-center justify-center"
          >
            <ArrowLeft size={16} className="stroke-[3]" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider opacity-85">
            Back to Chapter Setup
          </span>
        </div>

        {/* Dynamic Topic Context Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b-2 border-[#1800ad]/15 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#1800ad] text-[#f6f4ee] px-3 py-1 rounded-full">
                {activeChapterNumber} • {activeTopicNumber}
              </span>
              <span className="text-[10px] font-bold text-[#1800ad] bg-[#1800ad]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                {activeChapterName}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#1800ad] tracking-tight">
              {activeTopicTitle}
            </h1>
          </div>
        </div>

        {isLoadingChapter || !activeAsset ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#1800ad] flex-1">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Loading activity details...</span>
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col gap-6">
            
            {/* Header / Meta */}
            <div className="bg-[#1800ad]/5 p-6 rounded-[28px] border-2 border-[#1800ad]/15 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60 mb-1.5 block animate-pulse font-mono">
                  {activeAsset.asset_type.replace('_', ' ')} Resource
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#1800ad] leading-tight">
                  {activeAsset.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#1800ad]/80 font-semibold mt-2 leading-relaxed">
                  {activeAsset.description}
                </p>
              </div>
              <button
                onClick={() => {
                  setAssignedItemTitle(activeAsset.title);
                  setAssignmentNotes(`Hey students! Please complete this interactive topic resource on "${activeAsset.title}".`);
                  setIsSuccessModalOpen(true);
                }}
                className="shrink-0 bg-[#1800ad] text-[#f6f4ee] hover:bg-amber-300 hover:text-[#1800ad] px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-1.5 h-fit self-end sm:self-start"
              >
                <CheckCircle2 size={13} className="stroke-[3]" /> Assign to Class
              </button>
            </div>

            {/* Content Section */}
            <div className="bg-white p-6 rounded-[28px] border-2 border-[#1800ad]/15 flex flex-col gap-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#1800ad] border-b border-[#1800ad]/10 pb-2">
                Content
              </h3>
              
              {isMinimalOrPlaceholder ? (
                <p className="text-xs sm:text-sm text-[#1800ad]/60 font-semibold italic">
                  Content is being prepared by your teacher.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Detailed renderer for Quiz payload */}
                  {activeAsset.asset_type === 'quiz' && (activeAsset.payload_json.questions || activeAsset.payload_json.quiz) && (
                    <div className="flex flex-col gap-4">
                      <p className="text-xs text-[#1800ad]/80 font-bold uppercase tracking-wider">Generated Assessment Questions:</p>
                      {(activeAsset.payload_json.questions || activeAsset.payload_json.quiz).map((q: any, i: number) => (
                        <div key={i} className="bg-[#1800ad]/5 p-4 rounded-xl border border-[#1800ad]/10 flex flex-col gap-2">
                          <span className="text-xs font-black text-[#1800ad]">Question {i + 1}: {q.question || q.questionText}</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {q.options && q.options.map((opt: string, optIdx: number) => (
                              <div 
                                key={optIdx} 
                                className={`px-4 py-2 border rounded-full text-xs font-semibold ${
                                  optIdx === q.correctAnswer || opt === q.correctAnswer
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                                    : 'border-[#1800ad]/20 text-[#1800ad]/80'
                                }`}
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Detailed renderer for explain_it, predict_it, spot_it, connect_it */}
                  {['explain_it', 'predict_it', 'spot_it', 'connect_it'].includes(activeAsset.asset_type) && (
                    <div className="text-xs text-[#1800ad]/85 font-semibold leading-relaxed flex flex-col gap-3">
                      {activeAsset.payload_json.instructions ? (
                        <div className="bg-[#1800ad]/5 p-4 rounded-xl border border-[#1800ad]/10">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60 mb-1">Pedagogical Instructions:</span>
                          <p className="text-xs sm:text-sm text-[#1800ad] whitespace-pre-wrap">{activeAsset.payload_json.instructions}</p>
                        </div>
                      ) : (
                        Object.keys(activeAsset.payload_json).filter(k => k !== 'placeholder' && k !== 'chapter_id' && k !== 'asset_type' && k !== 'provider' && k !== 'integration_target').map((key) => {
                          const val = activeAsset.payload_json[key];
                          if (typeof val === 'object') return null;
                          return (
                            <div key={key} className="flex justify-between items-center border-b border-[#1800ad]/5 py-1">
                              <span className="capitalize font-bold text-[#1800ad]/60">{key.replace('_', ' ')}:</span>
                              <span className="text-[#1800ad] font-extrabold">{String(val)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* General payload fallback list for other asset types if any */}
                  {!['quiz', 'explain_it', 'predict_it', 'spot_it', 'connect_it'].includes(activeAsset.asset_type) && (
                    <div className="text-xs text-[#1800ad]/85 font-semibold leading-relaxed flex flex-col gap-3">
                      {Object.keys(activeAsset.payload_json).filter(k => k !== 'placeholder' && k !== 'chapter_id' && k !== 'asset_type' && k !== 'provider' && k !== 'integration_target').map((key) => {
                        const val = activeAsset.payload_json[key];
                        if (typeof val === 'object') return null;
                        return (
                          <div key={key} className="flex justify-between items-center border-b border-[#1800ad]/5 py-1">
                            <span className="capitalize font-bold text-[#1800ad]/60">{key.replace('_', ' ')}:</span>
                            <span className="text-[#1800ad] font-extrabold">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Embedded Viewport / Link Section */}
            {activeAsset.external_url && (
              <div className="bg-white p-6 rounded-[28px] border-2 border-[#1800ad]/15 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1800ad]/10 pb-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#1800ad]">
                    Interactive Live Preview
                  </h3>
                  <a 
                    href={activeAsset.external_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs font-bold text-[#1800ad] hover:underline flex items-center gap-1"
                  >
                    Open in new tab &rarr;
                  </a>
                </div>

                <div className="w-full bg-[#1800ad]/5 rounded-2xl overflow-hidden relative border-2 border-[#1800ad] shadow-inner animate-fadeIn" style={{ height: '450px' }}>
                  {activeAsset.asset_type === 'concept_video' ? (
                    activeAsset.external_url.includes('youtube.com') || activeAsset.external_url.includes('youtu.be') ? (
                      <iframe
                        src={activeAsset.external_url.replace('watch?v=', 'embed/')}
                        title="Video Player"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <video 
                        src={activeAsset.external_url} 
                        controls 
                        className="w-full h-full object-contain bg-black" 
                      />
                    )
                  ) : activeAsset.asset_type === 'simulation' ? (
                    <iframe
                      src={activeAsset.external_url}
                      title="Simulation Embed"
                      allowFullScreen
                      className="w-full h-full border-0"
                      style={{ background: '#ffffff' }}
                    />
                  ) : activeAsset.asset_type === 'three_d_model' ? (
                    <iframe
                      src={activeAsset.external_url.includes('sketchfab.com') && !activeAsset.external_url.includes('/embed')
                        ? activeAsset.external_url + '/embed'
                        : activeAsset.external_url}
                      title="3D Model Viewer"
                      allowFullScreen
                      className="w-full h-full border-0"
                      style={{ background: '#ffffff' }}
                    />
                  ) : (
                    <iframe
                      src={activeAsset.external_url}
                      title="Asset Viewport"
                      allowFullScreen
                      className="w-full h-full border-0"
                      style={{ background: '#ffffff' }}
                    />
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* SUCCESS CELEBRATION ASSIGNMENT MODAL WITH CONFIG NOTES */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 bg-[#1800ad]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#f6f4ee] rounded-[32px] p-6 lg:p-8 max-w-lg w-full border-2 border-[#1800ad] text-[#1800ad] font-montserrat relative shadow-2xl"
            >
              
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/40 animate-pulse">
                <CheckCircle2 size={32} className="stroke-[2.5]" />
              </div>

              <h3 className="text-xl font-black tracking-tight text-[#1800ad] text-center mb-1 leading-snug">
                Material Assigned Successfully!
              </h3>
              
              <p className="text-xs text-center text-[#1800ad]/75 font-semibold mb-6 uppercase tracking-wider">
                Student group notified on dashboard
              </p>

              {/* ASSIGNMENT SPECS SUMMARY BOX */}
              <div className="bg-[#1800ad]/5 rounded-2xl p-4 flex flex-col gap-3.5 mb-6 border border-[#1800ad]/10">
                <div className="flex items-center gap-2">
                  <Flame className="text-[#1800ad] stroke-[2.5] shrink-0" size={16} />
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest leading-none text-[#1800ad]/60">Assigned Resource</span>
                    <span className="block text-xs font-extrabold text-[#1800ad] mt-0.5">{assignedItemTitle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-[#1800ad]/10 pt-3">
                  <Calendar className="text-[#1800ad] stroke-[2.5] shrink-0" size={18} />
                  <div className="flex-1">
                    <span className="block text-[9px] font-black uppercase tracking-widest leading-none text-[#1800ad]/60 mb-1">Set Assessment Deadline</span>
                    <input
                      type="date"
                      value={assignmentDeadline}
                      onChange={(e) => setAssignmentDeadline(e.target.value)}
                      className="bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad]/25 hover:border-[#1800ad] focus:border-[#1800ad] px-3 py-1.5 text-xs font-bold rounded-lg focus:outline-none w-full font-montserrat"
                    />
                  </div>
                </div>

                <div className="border-t border-[#1800ad]/10 pt-3">
                  <span className="block text-[9px] font-black uppercase tracking-widest leading-none text-[#1800ad]/60 mb-1.5 flex items-center gap-1">
                    <FileText size={11} /> Teacher Instructions Notes
                  </span>
                  <textarea
                    rows={2.5}
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    className="w-full bg-[#f6f4ee] text-[#1800ad] placeholder-[#1800ad]/40 border border-[#1800ad]/20 p-2.5 rounded-lg text-[11px] font-semibold focus:outline-none focus:border-[#1800ad] font-montserrat resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setIsSuccessModalOpen(false)}
                  className="w-full bg-[#1800ad] hover:bg-amber-300 hover:text-[#1800ad] text-[#f6f4ee] py-3.5 rounded-full text-xs font-extrabold uppercase tracking-widest active:scale-95 transition-all text-center font-montserrat shadow-md"
                >
                  Save and return
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
