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
  ArrowRight,
  BookOpen, 
  LayoutDashboard, 
  BarChart2, 
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Eye,
  Layers
} from 'lucide-react';
import { NavItem } from '../components/NavItem';
import { api } from '../lib/api';

interface ActivityItem {
  id: string;
  asset_type: string;
  title: string;
  desc: string;
  previewText: string;
  lastPrompt?: string;
  showRegenPrompt: boolean;
  active: boolean;
  generation_status: string;
  external_url: string | null;
  payload_json: any;
}

const DIRECT_GENERATION_TYPES = new Set(['concept_video', 'simulation', 'three_d_model']);

const GENERATION_ESTIMATES: Record<string, number> = {
  concept_video: 180,
  simulation: 75,
  three_d_model: 45,
};

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
};

const ASSET_TYPES_ORDER = [
  'concept_video',
  'simulation',
  'three_d_model',
  'quiz',
  'explain_it',
  'predict_it',
  'spot_it',
  'connect_it'
];

export function TeacherChapterSetupPage() {
  const { classId, chapterId } = useParams<{ classId: string, chapterId: string }>();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [deadline, setDeadline] = useState('2026-06-25');
  const [specialNote, setSpecialNote] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resolvedChapter, setResolvedChapter] = useState<any | null>(null);

  // Active custom regenerate instructions
  const [regenText, setRegenText] = useState<Record<string, string>>({});
  const [generationEndsAt, setGenerationEndsAt] = useState<Record<string, number>>({});
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});
  const [now, setNow] = useState(() => Date.now());

  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Fetch chapter details and map assets
  useEffect(() => {
    if (!classId || !chapterId) return;
    const fetchChapterDetails = async () => {
      setIsLoading(true);
      try {
        const data = await api.get(`/teachers/classes/${classId}/chapters/${chapterId}`);
        setResolvedChapter(data);
        console.log("Fetched chapter details on chapter detail page:", data);
        if (data && data.topics && data.topics.length > 0) {
          setActivities(data.topics.map((topic: any) => {
            const assets = [...(topic.assets || [])].sort((a: any, b: any) => {
              return ASSET_TYPES_ORDER.indexOf(a.asset_type) - ASSET_TYPES_ORDER.indexOf(b.asset_type);
            });
            const readyCount = assets.filter((asset: any) => asset.generation_status === 'ready').length;
            return {
              id: topic.topic_id,
              asset_type: 'topic',
              title: topic.title,
              desc: topic.source_text || `Topic in ${data.title}.`,
              previewText: `${readyCount}/${assets.length} resources ready`,
              generation_status: readyCount === assets.length && assets.length > 0 ? 'ready' : 'placeholder',
              external_url: null,
              payload_json: {
                topic_id: topic.topic_id,
                chapter_id: topic.chapter_id,
                chapter_title: data.title,
                topic_title: topic.title,
                topic_source_text: topic.source_text,
                assets,
              },
              showRegenPrompt: false,
              active: true
            };
          }));
        } else if (data && data.assets) {
          const orderedAssets = [...data.assets].sort((a: any, b: any) => {
            return ASSET_TYPES_ORDER.indexOf(a.asset_type) - ASSET_TYPES_ORDER.indexOf(b.asset_type);
          });

          setActivities(orderedAssets.map((asset: any) => ({
            id: asset.asset_id,
            asset_type: asset.asset_type,
            title: asset.title,
            desc: asset.description || `Interactive ${asset.asset_type.replace('_', ' ')} module.`,
            previewText: asset.payload_json?.instructions || asset.payload_json?.previewText || `Outline for ${asset.title}.`,
            generation_status: asset.generation_status,
            external_url: asset.external_url,
            payload_json: asset.payload_json,
            showRegenPrompt: false,
            active: true
          })));
        }
      } catch (err) {
        console.error("Failed to fetch chapter details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChapterDetails();
  }, [classId, chapterId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const clearGenerationState = (assetId: string) => {
    setGenerationEndsAt(prev => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
    setGenerationErrors(prev => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
  };

  const clearGenerationTimer = (assetId: string) => {
    setGenerationEndsAt(prev => {
      const next = { ...prev };
      delete next[assetId];
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider">Ready</span>;
      case 'queued':
      case 'processing':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">Generating...</span>;
      case 'placeholder':
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-[10px] font-black uppercase tracking-wider">Not set up yet</span>;
      case 'failed':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[10px] font-black uppercase tracking-wider">Unavailable</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  const handleToggleActive = (id: string) => {
    setActivities(prev => prev.map(act => act.id === id ? { ...act, active: !act.active } : act));
  };

  const handleToggleRegenPrompt = (id: string) => {
    setActivities(prev => prev.map(act => act.id === id ? { ...act, showRegenPrompt: !act.showRegenPrompt } : act));
  };

  const handleRegenerateSubmit = async (activity: ActivityItem) => {
    const prompt = (regenText[activity.id] || '').trim();

    if (!DIRECT_GENERATION_TYPES.has(activity.asset_type)) {
      if (!prompt) return;

      // Preserve the older interactive fallback for non-generated asset types.
      setActivities(prev => prev.map(act => {
        if (act.id === activity.id) {
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

      setRegenText(prev => ({ ...prev, [activity.id]: '' }));
      return;
    }

    const estimatedSeconds = GENERATION_ESTIMATES[activity.asset_type] ?? 60;
    const generationEnds = Date.now() + estimatedSeconds * 1000;

    clearGenerationState(activity.id);
    setGenerationEndsAt(prev => ({ ...prev, [activity.id]: generationEnds }));
    setGenerationErrors(prev => {
      const next = { ...prev };
      delete next[activity.id];
      return next;
    });
    setActivities(prev => prev.map(act => act.id === activity.id ? { ...act, generation_status: 'processing', showRegenPrompt: false } : act));

    try {
      const response = await api.post(`/teachers/classes/${classId}/chapters/${chapterId}/assets/${activity.id}/generate`, {
        instructions: prompt || null,
      });

      const generatedAsset = response.asset || response;

      setActivities(prev => prev.map(act => {
        if (act.id !== activity.id) return act;

        return {
          ...act,
          title: generatedAsset.title || act.title,
          desc: generatedAsset.description || act.desc,
          previewText: generatedAsset.payload_json?.instructions || generatedAsset.payload_json?.previewText || `Outline for ${generatedAsset.title || act.title}.`,
          lastPrompt: prompt || act.lastPrompt,
          generation_status: generatedAsset.generation_status || 'ready',
          external_url: generatedAsset.external_url || null,
          payload_json: generatedAsset.payload_json || {},
          showRegenPrompt: false,
        };
      }));

      setRegenText(prev => ({ ...prev, [activity.id]: '' }));
      clearGenerationState(activity.id);
    } catch (err: any) {
      const detail = err?.detail || err?.message || 'Generation failed.';
      console.error('Failed to generate chapter asset:', err);
      setGenerationErrors(prev => ({ ...prev, [activity.id]: detail }));
      setActivities(prev => prev.map(act => act.id === activity.id ? { ...act, generation_status: 'failed' } : act));
      clearGenerationTimer(activity.id);
    }
  };

  const [assignError, setAssignError] = useState<string | null>(null);

  const mapAssetTypeToAssignmentType = (assetType: string): string => {
    switch (assetType) {
      case 'concept_video': return 'video';
      case 'simulation': return 'simulation';
      case 'three_d_model': return 'model';
      case 'quiz': return 'quiz';
      case 'explain_it': return 'explain_ai';
      case 'predict_it': return 'predict_ai';
      case 'spot_it': return 'spot_it';
      case 'connect_it': return 'connect_it';
      case 'topic': return 'quiz'; // Default to quiz for topic assignments at chapter level
      default: return assetType;
    }
  };

  const handlePublishAssignment = async () => {
    if (!classId || !chapterId) return;
    setPublishing(true);
    setAssignError(null);
    try {
      const activeActs = activities.filter(a => a.active);
      if (activeActs.length === 0) {
        throw new Error('Please select at least one activity to assign.');
      }
      
      // Make sequential or parallel POST calls to create the assignments
      await Promise.all(
        activeActs.map(async (act) => {
          const assignmentType = mapAssetTypeToAssignmentType(act.asset_type);
          await api.post(`/teachers/classes/${classId}/assignments`, {
            chapter_id: chapterId,
            assignment_type: assignmentType,
            title: act.title,
            instructions: specialNote || null,
          });
        })
      );

      setSuccess(true);
      setTimeout(() => {
        navigate(`/teacher/class/${classId || 'class-8-science'}`);
      }, 1500);
    } catch (err: any) {
      console.error("Failed to publish assignments:", err);
      setAssignError(err?.detail || err?.message || 'Failed to create assignments. Please try again.');
    } finally {
      setPublishing(false);
    }
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
        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-extrabold text-lg">P</span>
        </div>
      </aside>

      {/* Content wrapper */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
        <div className="max-w-[1000px] w-full">
          
          {/* Back Trigger */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => navigate(`/teacher/class/${classId || 'class-8-science'}`)}
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
                    {resolvedChapter ? resolvedChapter.title : 'Loading...'} Chapter Setup
                  </h1>
                  <p className="text-sm font-semibold opacity-75 mt-1">
                    Review or regenerate activities. Customize student assessment logic with specific natural language prompts.
                  </p>
                </div>

                {/* Grid of the 8 activities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activities.map((act) => {
                    console.log("Rendering asset card:", act);
                    const isTopicCard = act.asset_type === 'topic';
                    const isReady = act.generation_status === 'ready';
                    const isDirectGeneratable = DIRECT_GENERATION_TYPES.has(act.asset_type);
                    const endsAt = generationEndsAt[act.id];
                    const isGenerating = typeof endsAt === 'number';
                    const remainingSeconds = isGenerating ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0;
                    const expectedSeconds = GENERATION_ESTIMATES[act.asset_type] ?? 60;
                    return (
                      <div 
                        key={act.id}
                        onClick={() => {
                          if (isTopicCard || isReady) {
                            navigate(`/teacher/topic-setup/${classId}/${chapterId}/${act.id}`, {
                              state: {
                                payload_json: act.payload_json,
                                external_url: act.external_url
                              }
                            });
                          }
                        }}
                        className={`border-2 rounded-[24px] p-5.5 flex flex-col justify-between transition-all bg-[#f6f4ee] shadow-sm ${
                          isTopicCard || isReady 
                            ? 'border-[#1800ad] cursor-pointer hover:shadow-md hover:scale-[1.01]' 
                            : 'border-[#1800ad]/15 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div>
                          {/* Upper row: icon and status badge */}
                          <div className="flex items-center justify-between mb-3.5">
                            <div className="flex items-center gap-2.5">
                              <span className="p-2.5 bg-[#1800ad]/5 rounded-xl border border-[#1800ad]/15 text-[#1800ad]">
                                {act.asset_type === 'concept_video' && <Film size={18} />}
                                {act.asset_type === 'simulation' && <Beaker size={18} />}
                                {act.asset_type === 'three_d_model' && <Layers size={18} />}
                                {act.asset_type === 'topic' && <BookOpen size={18} />}
                                {act.asset_type === 'quiz' && <HelpCircle size={18} />}
                                {act.asset_type === 'explain_it' && <HelpCircle size={18} />}
                                {act.asset_type === 'predict_it' && <Sliders size={18} />}
                                {act.asset_type === 'spot_it' && <AlertCircle size={18} />}
                                {act.asset_type === 'connect_it' && <BookOpen size={18} />}
                              </span>
                              <h3 className="font-black text-sm tracking-tight text-[#1800ad]">
                                {act.title}
                              </h3>
                            </div>

                            {getStatusBadge(act.generation_status)}
                          </div>

                          {/* Description */}
                          <p className="text-xs font-semibold leading-relaxed text-[#1800ad]/80 mb-4">
                            {act.desc}
                          </p>

                          {/* Expandable Preview Section */}
                          <div className="bg-[#f6f4ee] border border-[#1800ad]/10 rounded-2xl p-4.5 mb-4 text-xs font-semibold leading-snug">
                            <div className="text-[9px] font-black uppercase tracking-wider text-[#1800ad] mb-1">{isTopicCard ? 'Topic outline' : 'Preview outline'}</div>
                            {act.previewText}
                            {isDirectGeneratable && (
                              <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${isGenerating ? 'bg-amber-100 text-amber-800' : 'bg-[#1800ad]/8 text-[#1800ad]/65'}`}>
                                {isGenerating ? (
                                  <>
                                    Generating · {remainingSeconds > 0 ? `${formatDuration(remainingSeconds)} left` : 'Finalizing...'}
                                  </>
                                ) : (
                                  <>
                                    Expected generation time · ~{formatDuration(expectedSeconds)}
                                  </>
                                )}
                              </div>
                            )}
                            {generationErrors[act.id] && (
                              <div className="mt-3 text-[10px] font-bold text-rose-600">
                                {generationErrors[act.id]}
                              </div>
                            )}
                          </div>
                        </div>

                          {/* Item Bottom Actions */}
                          <div className="flex flex-col gap-2 border-t border-[#1800ad]/10 pt-3.5 mt-auto">
                          {isTopicCard ? (
                            <div className="flex justify-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/teacher/topic-setup/${classId}/${chapterId}/${act.id}`, {
                                    state: {
                                      payload_json: act.payload_json,
                                      external_url: act.external_url
                                    }
                                  });
                                }}
                                className="px-4 py-2 rounded-full bg-[#1800ad] text-[#f6f4ee] text-[11px] font-black flex items-center gap-1 leading-none transition-all hover:bg-[#1800ad]/90"
                              >
                                Open workspace <ArrowRight size={12} />
                              </button>
                            </div>
                          ) : act.showRegenPrompt ? (
                            <div className="flex flex-col gap-2 mt-1">
                                <textarea 
                                placeholder={isDirectGeneratable ? "Optional: add teacher notes, style guidance, or examples..." : "e.g. Include real-world car braking friction scenarios..."}
                                value={regenText[act.id] || ''}
                                onChange={(e) => setRegenText(prev => ({ ...prev, [act.id]: e.target.value }))}
                                className="w-full text-xs p-3 bg-[#f6f4ee] border border-[#1800ad]/35 rounded-xl font-semibold outline-none focus:border-[#1800ad] text-[#1800ad]"
                                rows={2}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex justify-end gap-2 text-[10px] font-black" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleToggleRegenPrompt(act.id)}
                                  disabled={isGenerating}
                                  className="px-3.5 py-1.5 rounded-full border border-[#1800ad]/30"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleRegenerateSubmit(act)}
                                  disabled={isGenerating}
                                  className="px-4 py-1.5 rounded-full bg-[#1800ad] text-white flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isGenerating ? 'Generating...' : 'Submit'} <Send size={10} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2.5 shrink-0 justify-end">
                              <button
                                type="button"
                                disabled={!isReady || isGenerating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isReady) {
                                    navigate(`/teacher/topic-setup/${classId}/${chapterId}/${act.id}`, {
                                      state: {
                                        payload_json: act.payload_json,
                                        external_url: act.external_url
                                      }
                                    });
                                  }
                                }}
                                className={`px-4 py-2 border rounded-full text-[11px] font-black flex items-center gap-1 leading-none transition-colors ${
                                  isReady ? 'border-[#1800ad]/20 hover:bg-[#1800ad]/5 text-[#1800ad]' : 'border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <Eye size={12} /> Preview
                              </button>
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleRegenPrompt(act.id);
                                }}
                                className={`px-4 py-2 border rounded-full text-[11px] font-black flex items-center gap-1 leading-none transition-all ${
                                  isGenerating
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'border-[#1800ad] bg-[#1800ad] text-[#f6f4ee] hover:bg-white hover:text-[#1800ad]'
                                }`}
                              >
                                <RotateCcw size={12} /> {isGenerating ? 'Generating...' : isDirectGeneratable ? (isReady ? 'Regenerate' : 'Generate') : 'Regenerate'}
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Bottom CTA for Configuration Settings trigger */}
                <div className="mt-8 border-t-2 border-[#1800ad]/15 pt-6 flex justify-end">
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setAssignError(null);
                      setShowConfig(true);
                    }}
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

                      {assignError && (
                        <div className="text-xs font-bold text-rose-600 mt-1">
                          {assignError}
                        </div>
                      )}

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
