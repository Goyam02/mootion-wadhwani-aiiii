import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, HelpCircle, Check, Play, Mic, X, Send, 
  MessageSquare, User, Clock, AlertCircle, Volume2
} from 'lucide-react';
import { api } from '../../api';
import { DoubtEntry } from '../../types';
import { VideoPlayer } from '../../components/VideoPlayer';

export const DoubtDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState<DoubtEntry[]>([]);
  const [selectedDoubt, setSelectedDoubt] = useState<DoubtEntry | null>(null);
  
  // Response states
  const [responseText, setResponseText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [sendingResponse, setSendingResponse] = useState(false);

  useEffect(() => {
    async function loadDoubts() {
      try {
        const list = await api.getDoubts();
        setDoubts(list);
      } catch (e) {
        console.error(e);
      }
    }
    loadDoubts();
  }, []);

  const handleApproveExplanation = async () => {
    if (!selectedDoubt) return;
    try {
      await api.respondToDoubt(
        selectedDoubt.doubt_id, 
        '', 
        'Explanation approved by teacher.'
      );
      const list = await api.getDoubts();
      setDoubts(list);
    } catch (e) {
      console.error(e);
    }
    setSelectedDoubt(null);
  };

  const handleSendResponse = async () => {
    if (!selectedDoubt || (!responseText && !recordedAudio)) return;
    setSendingResponse(true);

    try {
      await api.respondToDoubt(
        selectedDoubt.doubt_id,
        recordedAudio || 'mock_voice_note_url.mp3',
        responseText || 'Teacher voice message attached.'
      );
      
      const list = await api.getDoubts();
      setDoubts(list);
      setResponseText('');
      setRecordedAudio(null);
      setSelectedDoubt(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSendingResponse(false);
    }
  };


  const startVoiceNote = () => {
    setIsRecording(true);
    setRecordedAudio(null);
  };

  const stopVoiceNote = () => {
    setIsRecording(false);
    setRecordedAudio('mock_recorded_voice_note.mp3');
  };

  // Group doubts by topic/concept (clusters)
  const groupedDoubts = doubts.reduce((acc, doubt) => {
    if (!acc[doubt.topic]) {
      acc[doubt.topic] = [];
    }
    acc[doubt.topic].push(doubt);
    return acc;
  }, {} as Record<string, DoubtEntry[]>);

  return (
    <div className="flex-1 flex flex-col bg-[#07070c] relative z-10 p-6 md:p-8">
      <div className="grid-overlay" />
      <div className="ambient-light" />

      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <button
          onClick={() => navigate('/teacher/home')}
          className="text-slate-400 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 self-start transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-600/30">
            <HelpCircle size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100 font-heading">Doubt Dashboard</h1>
            <p className="text-slate-400 text-xs mt-0.5">Moderate and answer student doubts and generated explanations</p>
          </div>
        </div>
      </div>

      {/* Doubts List / Clusters */}
      <div className="flex-1 flex flex-col gap-6 max-w-4xl w-full mx-auto pb-16">
        {Object.keys(groupedDoubts).length > 0 ? (
          Object.entries(groupedDoubts).map(([topic, items]) => {
            const pendingCount = items.filter(i => i.status === 'pending').length;
            
            return (
              <div key={topic} className="flex flex-col gap-3">
                {/* Cluster Header */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                  <span>Topic: {topic}</span>
                  {pendingCount > 0 && (
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {pendingCount} Pending Doubts
                    </span>
                  )}
                </div>

                {/* Cluster Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((doubt) => (
                    <div
                      key={doubt.doubt_id}
                      onClick={() => setSelectedDoubt(doubt)}
                      className={`glass-panel p-5 cursor-pointer hover:scale-[1.01] hover:border-violet-500/30 flex flex-col justify-between gap-5 relative overflow-hidden ${
                        doubt.status === 'resolved' ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1">
                            <User size={12} className="text-slate-500" />
                            {doubt.student_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} className="text-slate-500" />
                            {new Date(doubt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed font-semibold mt-1">
                          "{doubt.text}"
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 text-[10px] font-bold uppercase tracking-wider">
                        {doubt.status === 'pending' ? (
                          <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                            <AlertCircle size={12} /> Respond
                          </span>
                        ) : (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Check size={12} /> Resolved
                          </span>
                        )}
                        <span className="text-violet-400">Open Doubt &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="glass-panel p-12 flex flex-col items-center justify-center text-center">
            <Check size={48} className="text-emerald-500 mb-3 animate-bounce" />
            <h4 className="font-bold text-slate-300 font-heading">Doubt Feed Clear (No data available)</h4>
            <p className="text-slate-500 text-xs mt-1">Students have not submitted any doubts yet.</p>
          </div>
        )}
      </div>

      {/* DETAIL AND RESPOND DRAWER */}
      {selectedDoubt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl glass-panel p-6 flex flex-col gap-5 relative animate-slide-up">
            <button 
              onClick={() => setSelectedDoubt(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-start gap-3 border-b border-slate-850 pb-4">
              <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center text-sm font-bold font-heading">
                {selectedDoubt.student_name[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-200 font-heading">{selectedDoubt.student_name}</h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Topic: {selectedDoubt.topic}
                </span>
              </div>
            </div>

            {/* Doubt description text */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Student Query
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                "{selectedDoubt.text}"
              </p>
            </div>

            {/* Clarification video player */}
            {selectedDoubt.video_url && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  Mootion AI Clarification Video (60s Explainer)
                </span>
                <div className="w-full aspect-video max-h-56 bg-slate-950 rounded-xl overflow-hidden border border-slate-850 p-1">
                  <VideoPlayer url={null} title="Drift Velocity Clarification" />
                </div>
              </div>
            )}

            {/* Response Section */}
            {selectedDoubt.status === 'pending' ? (
              <div className="flex flex-col gap-4 border-t border-slate-850 pt-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Action</label>
                  <textarea
                    rows={2}
                    placeholder="Type feedback, clarify doubt, or record a voice note..."
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="form-input bg-slate-900 resize-none text-xs"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {isRecording ? (
                      <button
                        onClick={stopVoiceNote}
                        className="btn-secondary py-1.5 px-3 text-xs bg-rose-600/10 border-rose-500/20 text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5 animate-pulse"
                      >
                        <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                        Stop Recording
                      </button>
                    ) : (
                      <button
                        onClick={startVoiceNote}
                        className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1 text-slate-400 hover:text-white"
                      >
                        <Mic size={14} /> Record Voice Note
                      </button>
                    )}

                    {recordedAudio && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <Volume2 size={12} /> Voice note attached
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleApproveExplanation}
                      className="btn-secondary py-2 px-4 text-xs font-bold"
                    >
                      Approve AI Video
                    </button>
                    <button
                      onClick={handleSendResponse}
                      disabled={sendingResponse || (!responseText && !recordedAudio)}
                      className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1"
                    >
                      <Send size={12} /> Send Response
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-850 pt-4 p-3 bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <Check size={16} />
                <span>Response submitted: "{selectedDoubt.response_text}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
