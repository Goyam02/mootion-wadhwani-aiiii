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
export const getSketchfabEmbedUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.includes('/embed')) return url;
  if (url.includes('sketchfab.com')) {
    const parts = url.split('/');
    const filteredParts = parts.filter(Boolean);
    const lastPart = filteredParts[filteredParts.length - 1];
    const uidMatch = lastPart.match(/([a-f0-9]{32})/i);
    if (uidMatch) {
      return `https://sketchfab.com/models/${uidMatch[1]}/embed`;
    }
    if (/^[a-f0-9]{32}$/i.test(lastPart)) {
      return `https://sketchfab.com/models/${lastPart}/embed`;
    }
  }
  return url;
};

export function TeacherTopicSetupPage() {
  const { classId, chapterId, topicId } = useParams<{ classId: string; chapterId: string; topicId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { payload_json?: any, external_url?: string } | null;

  const [resolvedChapter, setResolvedChapter] = useState<any | null>(null);
  const [activeTopic, setActiveTopic] = useState<any | null>(null);
  const [topicAssets, setTopicAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
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
        const topic = data?.topics?.find((t: any) => t.topic_id === topicId);
        if (topic) {
          setActiveTopic(topic);
          const assets = [...(topic.assets || [])].sort((a: any, b: any) => {
            const order = ['concept_video', 'simulation', 'three_d_model'];
            return order.indexOf(a.asset_type) - order.indexOf(b.asset_type);
          });
          setTopicAssets(assets);
          const initialAsset = assets[0] || null;
          setSelectedAssetId(initialAsset?.asset_id || null);
          setActiveAsset(initialAsset);
          console.log("Fetched active topic details in activity subpage:", topic);
        } else if (data && data.assets) {
          const asset = data.assets.find((a: any) => a.asset_id === topicId);
          setActiveTopic(null);
          setTopicAssets([]);
          setSelectedAssetId(asset?.asset_id || null);
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
  const activeTopicTitle = activeTopic ? activeTopic.title : (activeAsset ? activeAsset.title : 'Loading...');
  const activeTopicNumber = activeTopic ? `Topic ${activeTopic.sequence_number + 1}` : (activeAsset ? activeAsset.asset_type.replace('_', ' ') : '01');

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [assignedItemTitle, setAssignedItemTitle] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('2026-06-25');
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
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
      default: return assetType;
    }
  };

  const handlePublishAssignment = async () => {
    if (!classId || !chapterId || !activeAsset) return;
    setPublishing(true);
    setAssignError(null);
    try {
      const assignmentType = mapAssetTypeToAssignmentType(activeAsset.asset_type);
      await api.post(`/teachers/classes/${classId}/assignments`, {
        chapter_id: chapterId,
        assignment_type: assignmentType,
        title: activeAsset.title,
        instructions: assignmentNotes,
      });
      setSuccess(true);
      // Wait 1.5s then navigate back to chapter setup page
      setTimeout(() => {
        setIsSuccessModalOpen(false);
        navigate(`/teacher/chapter-setup/${classId}/${chapterId}`);
      }, 1500);
    } catch (err: any) {
      console.error("Failed to create assignment:", err);
      setAssignError(err?.detail || err?.message || 'Failed to create assignment. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const [regenText, setRegenText] = useState('');
  const [generationEndsAt, setGenerationEndsAt] = useState<number | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isGenerating = generationEndsAt !== null;
  const selectedAsset = activeAsset;

  // Check if payload_json is empty or minimal (scaffolding only)
  const isMinimalOrPlaceholder = 
    !activeTopic && (!activeAsset ||
    !activeAsset.payload_json ||
    Object.keys(activeAsset.payload_json).length === 0 ||
    (activeAsset.generation_status !== 'ready' && activeAsset.payload_json.placeholder === true) ||
    (activeAsset.asset_type === 'quiz' && !activeAsset.payload_json.questions && !activeAsset.payload_json.quiz) ||
    (['explain_it', 'predict_it', 'spot_it', 'connect_it'].includes(activeAsset.asset_type) && !activeAsset.payload_json.instructions));

  const updateTopicAsset = (nextAsset: any) => {
    setSelectedAssetId(nextAsset.asset_id);
    setActiveAsset(nextAsset);
    setGenerationEndsAt(null);
    setGenerationError(null);
    if (activeTopic) {
      setTopicAssets(prev => prev.map(asset => asset.asset_id === nextAsset.asset_id ? nextAsset : asset));
    }
  };

  const handleGenerateSelectedAsset = async () => {
    if (!activeTopic || !selectedAsset || !classId || !chapterId) return;

    setGenerationError(null);
    const estimatedSeconds = selectedAsset.asset_type === 'concept_video' ? 180 : selectedAsset.asset_type === 'simulation' ? 75 : 45;
    setGenerationEndsAt(Date.now() + estimatedSeconds * 1000);

    try {
      const response = await api.post(`/teachers/classes/${classId}/chapters/${chapterId}/topics/${activeTopic.topic_id}/assets/${selectedAsset.asset_id}/generate`, {
        instructions: regenText.trim() || null,
      });
      const generatedAsset = response.asset || response;
      updateTopicAsset(generatedAsset);
      setRegenText('');
      setGenerationEndsAt(null);
    } catch (err: any) {
      console.error('Failed to generate topic asset:', err);
      setGenerationError(err?.detail || err?.message || 'Generation failed.');
      setGenerationEndsAt(null);
    }
  };

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

        {activeTopic && topicAssets.length > 0 && (
          <div className="mb-6 flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#1800ad]/65">Topic Resources</span>
            <div className="flex flex-wrap gap-2">
              {topicAssets.map((asset) => (
                <button
                  key={asset.asset_id}
                  onClick={() => updateTopicAsset(asset)}
                  className={`px-3.5 py-2 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all ${
                    selectedAssetId === asset.asset_id
                      ? 'bg-[#1800ad] text-[#f6f4ee] border-[#1800ad]'
                      : 'bg-white text-[#1800ad] border-[#1800ad]/20 hover:bg-[#1800ad]/5'
                  }`}
                >
                  {asset.title}
                </button>
              ))}
            </div>
          </div>
        )}

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
                  setSuccess(false);
                  setAssignError(null);
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

              {activeTopic && selectedAsset && (
                <div className="bg-[#1800ad]/5 p-4 rounded-[24px] border border-[#1800ad]/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60">Generation Workspace</div>
                      <div className="text-sm font-black text-[#1800ad]">{selectedAsset.title}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${selectedAsset.generation_status === 'ready' ? 'bg-emerald-100 text-emerald-800' : isGenerating ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
                      {selectedAsset.generation_status === 'ready' ? 'Ready' : isGenerating ? 'Generating...' : 'Not set up yet'}
                    </span>
                  </div>

                  <textarea
                    value={regenText}
                    onChange={(e) => setRegenText(e.target.value)}
                    rows={3}
                    placeholder="Optional: add teacher notes, examples, or style guidance..."
                    className="w-full bg-[#f6f4ee] text-[#1800ad] placeholder-[#1800ad]/40 border border-[#1800ad]/20 p-3 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1800ad] resize-none"
                  />

                  {generationError && (
                    <div className="text-[11px] font-bold text-rose-600">{generationError}</div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/65">
                      {isGenerating ? `Expected time left: ${Math.max(0, Math.ceil((generationEndsAt! - now) / 1000))}s` : 'Generation ETA depends on asset type'}
                    </div>
                    <button
                      onClick={handleGenerateSelectedAsset}
                      disabled={isGenerating}
                      className="px-4 py-2 rounded-full bg-[#1800ad] text-[#f6f4ee] text-[11px] font-black uppercase tracking-widest flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? 'Generating...' : selectedAsset.generation_status === 'ready' ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                </div>
              )}
              
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
                      src={getSketchfabEmbedUrl(activeAsset.external_url)}
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
              
              {success ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/40 animate-pulse">
                    <CheckCircle2 size={32} className="stroke-[2.5]" />
                  </div>

                  <h3 className="text-xl font-black tracking-tight text-[#1800ad] text-center mb-1 leading-snug">
                    Material Assigned Successfully!
                  </h3>
                  
                  <p className="text-xs text-center text-[#1800ad]/75 font-semibold mb-6 uppercase tracking-wider">
                    Student group notified on dashboard
                  </p>

                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => {
                        setIsSuccessModalOpen(false);
                        navigate(`/teacher/chapter-setup/${classId}/${chapterId}`);
                      }}
                      className="w-full bg-[#1800ad] hover:bg-amber-300 hover:text-[#1800ad] text-[#f6f4ee] py-3.5 rounded-full text-xs font-extrabold uppercase tracking-widest active:scale-95 transition-all text-center font-montserrat shadow-md"
                    >
                      Return to Chapter Setup
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black tracking-tight text-[#1800ad] mb-2 leading-snug">
                    Assign to Class
                  </h3>
                  <p className="text-xs font-semibold opacity-75 mb-6">
                    Configure assignment details for your students.
                  </p>

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

                  {assignError && (
                    <div className="mb-4 text-xs font-bold text-rose-600">
                      {assignError}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      disabled={publishing}
                      onClick={() => setIsSuccessModalOpen(false)}
                      className="flex-1 py-3.5 border-2 border-[#1800ad] rounded-full text-xs font-black uppercase tracking-wider text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={publishing}
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
                </>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
