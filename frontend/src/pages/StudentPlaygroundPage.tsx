import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Compass, 
  Gamepad2, 
  Search, 
  ArrowRight,
  Flame,
  ChevronLeft, 
  ChevronRight,
  HelpCircle,
  Menu,
  X,
  Play,
  Send,
  Plus,
  Mic,
  Film,
  Sparkles,
  Info,
  Beaker,
  Globe,
  Settings,
  XCircle,
  FolderOpen,
  ArrowUp,
  User,
  GraduationCap,
  MessageSquare,
  AlertCircle,
  RotateCcw,
  Check,
  Award,
  Volume2,
  Layers,
  Bot,
  ArrowLeft,
  Paperclip,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  getStoredTasks, 
  getPlaygroundQuota, 
  incrementPlaygroundQuota, 
  setPlaygroundQuota, 
  getTeacherAssignedNew, 
  setTeacherAssignedNew 
} from '../data/taskStore';
import { NavItem } from '../components/NavItem';
import { getSketchfabEmbedUrl } from './TeacherTopicSetupPage';

interface ChatMessage {
  id: string;
  sender: 'student' | 'mootion';
  text: string;
  timestamp: string;
  commandExecuted?: string;
  payload?: {
    type: 'video' | 'simulation' | 'universe' | 'quiz' | 'subject_picker' | 'three_d_model' | 'video_loading' | 'simulation_loading';
    title: string;
    // Specific metadata
    video?: {
      storyboard: { step: number; title: string; description: string; duration: string; illustration: string }[];
      topic: string;
      chapters: string[];
      url?: string;
    };
    simulation?: {
      objectDensity: number; // kg/m^3
      fluidDensity: number; // kg/m^3
      objectVolume: number; // m^3
    };
    universe?: {
      subject: string;
      systemType: 'solar' | 'atom' | 'cell';
    };
    three_d_model?: {
      embedUrl: string;
      viewerUrl?: string;
    };
    quiz?: {
      currentQuestionIdx: number;
      questions: {
        id: number;
        question: string;
        options: string[];
        correctAnswerIdx: number;
        userAnswerIdx?: number | null;
        feedbackCorrect: string;
        feedbackIncorrect: string;
      }[];
      score: number;
      isCompleted: boolean;
    };
  };
}

interface PreSavedSession {
  id: string;
  title: string;
  lastMsg: string;
  timestamp: string;
}

interface InteractiveQuizCardProps {
  payload: any;
}

export function VideoLoadingCard() {
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = ((120 - Math.max(0, timeLeft)) / 120) * 100;

  return (
    <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 sm:p-6 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-4 font-montserrat">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center animate-pulse">
          <Film size={16} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad]">Generating Video</h4>
          <p className="text-xs text-[#1800ad]/70 font-semibold mt-1">
            {timeLeft > 0 ? `Generating your concept video... ${formatTime(timeLeft)} remaining` : "Still generating, almost there..."}
          </p>
        </div>
      </div>
      
      <div className="w-full bg-[#1800ad]/10 h-1.5 rounded-full overflow-hidden mt-1">
        <div 
          className="bg-[#1800ad] h-full rounded-full transition-all duration-1000 ease-linear relative overflow-hidden" 
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export function SimulationLoadingCard({ payload }: { payload: any }) {
  const state = payload.state || 'searching';
  
  return (
    <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 sm:p-6 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-4 font-montserrat animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center">
          <Beaker size={16} className="animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad]">Simulation Engine</h4>
          <p className="text-xs text-[#1800ad]/70 font-semibold mt-1">
            {state === 'generating' ? "Generating a custom simulation for you..." : "Searching for the optimal simulation..."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function InteractiveQuizCard({ payload }: InteractiveQuizCardProps) {
  const quizState = payload.quiz;
  const questions = quizState.questions;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  const currentQuestion = questions[currentIdx];
  const selectOption = userAnswers[currentIdx];
  const showsFeedback = selectOption !== undefined;

  // Timer Countdown Effect
  useEffect(() => {
    if (isCompleted || showsFeedback) return;
    if (timeLeft <= 0) {
      handleAnswerSelect(-1); // Timeout
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(p => p - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, currentIdx, isCompleted, showsFeedback]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(10);
  }, [currentIdx]);

  const handleAnswerSelect = (optionIdx: number) => {
    if (showsFeedback || isCompleted) return;
    
    setUserAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));
    
    if (optionIdx === currentQuestion.correctAnswerIdx) {
      setScore(s => s + 50); 
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRetry = () => {
    setUserAnswers({});
    setScore(0);
    setCurrentIdx(0);
    setIsCompleted(false);
    setTimeLeft(10);
  };

  const finalScorePercent = Math.round((score / (questions.length * 50)) * 100);

  return (
    <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 sm:p-6 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-4 font-montserrat">
      <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3 font-montserrat">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center">
            <HelpCircle size={16} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad] font-montserrat">{payload.title}</h4>
            <p className="text-[10px] text-[#1800ad]/70 font-semibold font-montserrat">10-Second Speed Quiz</p>
          </div>
        </div>
        {/* Circular countdown only */}
        {!isCompleted && !showsFeedback && (
          <div className="relative w-9 h-9 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1800ad" strokeOpacity="0.1" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke={timeLeft <= 3 ? '#ef4444' : '#f59e0b'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(timeLeft / 10) * 94.2} 94.2`}
                className="transition-all duration-1000"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black font-montserrat ${timeLeft <= 3 ? 'text-red-500' : 'text-[#1800ad]'}`}>
              {timeLeft}
            </span>
          </div>
        )}
        {isCompleted && (
          <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black uppercase tracking-wide font-montserrat">Done</span>
        )}
      </div>

      {!isCompleted ? (
        <div className="flex flex-col gap-4 font-montserrat">
          <div className="relative">
            <div className="p-4 bg-[#1800ad]/5 rounded-2xl border border-[#1800ad]/15 text-xs sm:text-sm font-bold leading-relaxed text-[#1800ad] font-montserrat">
              {currentQuestion.question}
            </div>
            {!showsFeedback && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent overflow-hidden rounded-b-2xl">
                <div 
                  className={`h-full transition-all duration-1000 ${timeLeft <= 3 ? 'bg-red-500' : 'bg-amber-400'}`} 
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 font-montserrat">
            {currentQuestion.options.map((option: string, oIdx: number) => {
              const isSelected = selectOption === oIdx;
              const isCorrect = oIdx === currentQuestion.correctAnswerIdx;
              
              let btnStyle = "bg-[#1800ad]/5 hover:bg-[#1800ad]/10 border-[#1800ad]/20 text-[#1800ad]";
              if (showsFeedback) {
                if (isSelected) {
                  btnStyle = isCorrect ? "bg-emerald-500 text-white border-emerald-500 font-bold" : "bg-rose-500 text-white border-rose-500 font-bold";
                } else if (isCorrect) {
                  btnStyle = "bg-emerald-500/80 text-white border-emerald-400";
                }
              }

              return (
                <button
                  key={oIdx}
                  onClick={() => handleAnswerSelect(oIdx)}
                  disabled={showsFeedback}
                  className={`p-3.5 sm:p-4 rounded-xl text-left text-xs transition border flex items-start gap-2 disabled:cursor-not-allowed font-montserrat ${btnStyle}`}
                >
                  <span className="font-extrabold uppercase select-none opacity-60 font-montserrat">{String.fromCharCode(65 + oIdx)}.</span>
                  <span className="font-semibold">{option}</span>
                </button>
              );
            })}
          </div>

          {showsFeedback && (
            <div className={`p-4 rounded-xl text-xs font-semibold font-montserrat ${selectOption === currentQuestion.correctAnswerIdx ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' : 'bg-rose-50 text-rose-800 border border-rose-250'}`}>
              <div className="mb-2">
                {selectOption === -1 ? (
                  <span className="font-bold text-rose-700 block mb-1">Time is up! You didn't reply within 10 seconds.</span>
                ) : selectOption === currentQuestion.correctAnswerIdx ? (
                  <span className="font-bold text-emerald-700 block mb-1">Correct!</span>
                ) : (
                  <span className="font-bold text-rose-700 block mb-1">Incorrect.</span>
                )}
                <span className="opacity-90">{selectOption === currentQuestion.correctAnswerIdx ? currentQuestion.feedbackCorrect : currentQuestion.feedbackIncorrect}</span>
              </div>
              
              <button 
                onClick={handleNext}
                className="mt-3 w-full py-2 bg-[#1800ad] hover:bg-[#1800ad]/90 text-[#f6f4ee] rounded-lg font-extrabold transition-all tracking-wider uppercase text-[10px] font-montserrat"
              >
                {currentIdx < questions.length - 1 ? "Next Question" : "Complete Challenge"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-[#1800ad]/5 border border-[#1800ad]/15 rounded-2xl gap-4 font-montserrat">
          <div className="w-16 h-16 bg-[#1800ad] text-[#f6f4ee] rounded-full flex items-center justify-center shadow">
            <Award size={32} />
          </div>
          <div>
            <h5 className="font-black text-lg text-[#1800ad] font-montserrat">Quiz Practice Finalized!</h5>
            <p className="text-xs text-[#1800ad]/75 mt-1 font-montserrat">Excellent attempts making continuous progress.</p>
          </div>
          
          <div className="text-4xl font-black text-amber-600 tracking-wider font-montserrat">
            {finalScorePercent}% <span className="text-xs text-[#1800ad] opacity-60">SCORE</span>
          </div>

          <button
            onClick={handleRetry}
            className="flex items-center gap-1 bg-[#1800ad] text-[#f6f4ee] hover:bg-[#1800ad]/90 px-6 py-2.5 rounded-full font-extrabold text-xs uppercase font-montserrat"
          >
            <RotateCcw size={12} /> Retry Assessment
          </button>
        </div>
      )}
    </div>
  );
}

const cleanText = (text: string): string => {
  if (!text) return "";
  // Strip emojis (using Unicode Extended Pictographic and basic emoji ranges)
  let cleaned = text.replace(/\p{Extended_Pictographic}/gu, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '');
  // Strip asterisks
  cleaned = cleaned.replace(/\*/g, '');
  return cleaned.trim();
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64 = base64data.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const transcribeAudioWithGemini = async (blob: Blob): Promise<string> => {
  const base64 = await blobToBase64(blob);
  const apiKey = "AIzaSyDJWjudoaGxCVLbHo-PdjzVoirvM1r-oqg";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: blob.type || 'audio/webm',
              data: base64
            }
          },
          {
            text: "Transcribe the spoken audio exactly. Do not add any extra commentary or conversational filler. Output only the transcribed text."
          }
        ]
      }]
    })
  });
  
  if (!response.ok) {
    throw new Error(`Gemini transcription error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
};

// ─── Helper: convert backend messages to ChatMessage ──────────────────────
function backendMsgToChatMsg(msg: any): ChatMessage[] {
  const msgs: ChatMessage[] = [];

  if (msg.role === 'user') {
    msgs.push({
      id: msg.message_id,
      sender: 'student',
      text: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  } else if (msg.role === 'assistant') {
    const assistantMsg: ChatMessage = {
      id: msg.message_id,
      sender: 'mootion',
      text: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Try to parse generated_assets from asset_json
    const assets = msg.asset_json?.generated_assets ?? [];
    if (assets.length > 0) {
      const asset = assets[0];
      assistantMsg.payload = buildPayloadFromAsset(asset);
    }
    msgs.push(assistantMsg);
  }
  // Skip 'tool' role messages — they are surfaced via assistant's asset_json
  return msgs;
}

function buildPayloadFromAsset(asset: any): ChatMessage['payload'] | undefined {
  const type = asset.asset_type;
  if (!type) return undefined;

  if (type === 'simulation') {
    const url = asset.external_url ?? asset.payload_json?.url ?? '';
    return {
      type: 'simulation',
      title: asset.title ?? 'Simulation',
      simulation: {
        objectDensity: asset.payload_json?.objectDensity ?? 500,
        fluidDensity: asset.payload_json?.fluidDensity ?? 1000,
        objectVolume: asset.payload_json?.objectVolume ?? 0.1,
        _phetUrl: url,
      } as any,
    };
  }

  if (type === 'video' || type === 'concept_video') {
    return {
      type: 'video',
      title: asset.title ?? 'Video',
      video: {
        topic: asset.title ?? 'Educational Video',
        chapters: ['Introduction', 'Core Concepts', 'Summary'],
        storyboard: [
          { step: 1, title: 'Introduction', description: asset.description ?? '', duration: '0:35', illustration: '🎬' },
        ],
        url: asset.external_url ?? asset.payload_json?.video_url ?? '',
      } as any,
    };
  }

  if (type === 'quiz') {
    const rawQs = asset.payload_json?.questions ?? [];
    const mappedQs = rawQs.map((q: any, i: number) => ({
      id: i + 1,
      question: q.question ?? `Question ${i + 1}`,
      options: q.options ?? [],
      correctAnswerIdx: typeof q.correctAnswer === 'number'
        ? q.correctAnswer
        : (q.options ?? []).indexOf(q.correctAnswer),
      feedbackCorrect: q.explanation ?? 'Correct!',
      feedbackIncorrect: q.explanation ?? 'Not quite — review this concept!',
    }));
    if (mappedQs.length === 0) return undefined;
    return {
      type: 'quiz',
      title: asset.title ?? 'Quiz',
      quiz: {
        currentQuestionIdx: 0,
        score: 0,
        isCompleted: false,
        questions: mappedQs,
      },
    };
  }

  if (type === 'model' || type === 'three_d_model') {
    const url = asset.external_url ?? asset.payload_json?.embedUrl ?? asset.payload_json?.viewerUrl ?? '';
    return {
      type: 'three_d_model',
      title: asset.title ?? '3D Model',
      three_d_model: {
        embedUrl: url,
        viewerUrl: asset.payload_json?.viewerUrl ?? '',
      },
    };
  }

  return undefined;
}

export function StudentPlaygroundPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── Parse URL query params for context ─────────────────────────────────
  const searchParams = new URLSearchParams(location.search);
  const urlAssignmentId = searchParams.get('assignment_id');
  const urlChapterId = searchParams.get('chapter_id');
  const urlClassId = searchParams.get('class_id');

  // State Management
  const [tasks, setTasks] = useState(() => getStoredTasks());
  const [quota, setQuota] = useState(() => getPlaygroundQuota());
  const [quotaMax, setQuotaMax] = useState(10);
  const [teacherAssigned, setTeacherAssigned] = useState(() => getTeacherAssignedNew());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isDesktopHistoryOpen, setIsDesktopHistoryOpen] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [chatSessions, setChatSessions] = useState<PreSavedSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [hiddenSummoners, setHiddenSummoners] = useState<string[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [assignmentContext, setAssignmentContext] = useState<any>(null);

  // Conversation state — starts empty, populated from API
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const mirrorDivRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback(() => {
    if (chatInputRef.current && mirrorDivRef.current) {
      mirrorDivRef.current.scrollLeft = chatInputRef.current.scrollLeft;
    }
  }, []);

  const focusAndMoveCursorToEnd = useCallback((newVal: string) => {
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
        const len = newVal.length;
        chatInputRef.current.setSelectionRange(len, len);
        chatInputRef.current.scrollLeft = chatInputRef.current.scrollWidth;
        if (mirrorDivRef.current) {
          mirrorDivRef.current.scrollLeft = chatInputRef.current.scrollWidth;
        }
      }
    }, 50);
  }, []);

  useEffect(() => {
    const timer = setTimeout(syncScroll, 0);
    return () => clearTimeout(timer);
  }, [textInput, syncScroll]);

  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    const regex = /(\/(?:video|model|universe|playground|simulation|quiz|ask-teacher|ask_teacher))\b/gi;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (part.match(/^\/(?:video|model|universe|playground|simulation|quiz|ask-teacher|ask_teacher)$/i)) {
        return (
          <span
            key={index}
            style={{
              backgroundColor: '#1800ad',
              color: '#ffffff',
              padding: '2px 4px',
              margin: '0 -4px',
              borderRadius: '9999px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: '1',
              fontWeight: 600,
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Teacher doubt tab states
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'mootion' | 'teacher'>('mootion');
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);
  const [studentDoubts, setStudentDoubts] = useState<any[]>([]);
  const [followUpTexts, setFollowUpTexts] = useState<Record<string, string>>({});
  const [submittingFollowUpIds, setSubmittingFollowUpIds] = useState<Record<string, boolean>>({});
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [newDoubtText, setNewDoubtText] = useState('');
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [subjectQuery, setSubjectQuery] = useState('');
  const [isSubmittingDoubt, setIsSubmittingDoubt] = useState(false);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  // Voice capture & speech-to-text
  const [isFollowUpRecording, setIsFollowUpRecording] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified Doubt Modal and Selection States
  const [isNewDoubtModalOpen, setIsNewDoubtModalOpen] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatTopic, setNewChatTopic] = useState('');
  const [newDoubtClassId, setNewDoubtClassId] = useState('');
  const [newDoubtTopic, setNewDoubtTopic] = useState('');
  const [newDoubtDescription, setNewDoubtDescription] = useState('');
  const [selectedDoubtId, setSelectedDoubtId] = useState<string | null>(null);
  const [showReopenConfirmId, setShowReopenConfirmId] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all'); // 'all', 'open', 'resolved'

  // Gemini Speech-to-Text States
  const [isDoubtRecording, setIsDoubtRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const loadStudentData = async () => {
    try {
      const classesData = await api.get('/students/classes');
      setJoinedClasses(classesData);
      if (classesData.length > 0) {
        if (!selectedClassId) {
          setSelectedClassId(classesData[0].class_id);
        }
        setNewDoubtClassId(classesData[0].class_id);
      }
      
      const doubtsData = await api.get('/students/doubts');
      setStudentDoubts(doubtsData);
    } catch (err) {
      console.error("Failed to load student data for doubts:", err);
    }
  };

  // Re-sync doubts automatically to ensure first doubt selection and latest content
  useEffect(() => {
    if (activeWorkspaceTab === 'teacher' && selectedClassId && !selectedDoubtId) {
      const activeDoubts = studentDoubts.filter(d => d.class_id === selectedClassId);
      if (activeDoubts.length > 0) {
        setSelectedDoubtId(activeDoubts[0].doubt_id);
      }
    }
  }, [studentDoubts, selectedClassId, activeWorkspaceTab]);

  const handleCreateNewDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtClassId || !newDoubtTopic.trim() || !newDoubtDescription.trim()) {
      alert("Please fill in all fields.");
      return;
    }
    setIsSubmittingDoubt(true);
    try {
      const response = await api.post('/students/doubts', {
        class_id: newDoubtClassId,
        topic: newDoubtTopic.trim(),
        query_text: newDoubtDescription.trim(),
        tried_before: false,
        attempt_text: null
      });

      // Clear fields and close modal
      setNewDoubtTopic('');
      setNewDoubtDescription('');
      setIsNewDoubtModalOpen(false);

      // Refresh doubts from database
      const doubtsData = await api.get('/students/doubts');
      setStudentDoubts(doubtsData);

      // Select this class and doubt and switch to teacher tab
      setSelectedClassId(newDoubtClassId);
      setSelectedDoubtId(response.doubt_id);
      setActiveWorkspaceTab('teacher');
    } catch (err: any) {
      console.error("Failed to submit doubt:", err);
      alert(`Error submitting doubt: ${err.detail || err.message}`);
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  const handleReopenDoubt = async (doubtId: string) => {
    try {
      const updated = await api.post(`/students/doubts/${doubtId}/reopen`);
      setStudentDoubts(prev => prev.map(d => d.doubt_id === doubtId ? { ...d, status: updated.status, messages: updated.messages } : d));
      setShowReopenConfirmId(null);
    } catch (err: any) {
      console.error("Failed to reopen doubt:", err);
      alert(`Failed to reopen: ${err.detail || err.message}`);
    }
  };

  const toggleFollowUpVoiceRecording = async (doubtId: string) => {
    if (isFollowUpRecording[doubtId]) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsFollowUpRecording(prev => ({ ...prev, [doubtId]: false }));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudioWithGemini(audioBlob);
            if (transcription) {
              setFollowUpTexts(prev => ({
                ...prev,
                [doubtId]: (prev[doubtId] || '') + ' ' + transcription
              }));
            }
          } catch (err) {
            console.error("Transcription error:", err);
            alert("Failed to transcribe voice. Make sure microphone permission is enabled.");
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsFollowUpRecording(prev => ({ ...prev, [doubtId]: true }));
      } catch (err) {
        console.error("Recording failed to start:", err);
        alert("Failed to access microphone.");
      }
    }
  };

  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>, doubtId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileName = e.target.files[0].name;
      setFollowUpTexts(prev => ({
        ...prev,
        [doubtId]: (prev[doubtId] || '') + ` [Attached file: ${fileName}]`
      }));
    }
  };

  const [isModalVoiceRecording, setIsModalVoiceRecording] = useState(false);
  
  const toggleModalVoiceRecording = async () => {
    if (isModalVoiceRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsModalVoiceRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudioWithGemini(audioBlob);
            if (transcription) {
              setNewDoubtDescription(prev => (prev || '') + ' ' + transcription);
            }
          } catch (err) {
            console.error("Transcription error:", err);
            alert("Failed to transcribe voice. Make sure microphone permission is enabled.");
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsModalVoiceRecording(true);
      } catch (err) {
        console.error("Recording failed to start:", err);
        alert("Failed to access microphone.");
      }
    }
  };

  const getStatusPill = (status: string) => {
    let text = status.toUpperCase();
    if (text === 'PENDING') text = 'OPEN';

    let bg = 'bg-blue-50/50';
    let border = 'border-blue-200/60';
    let textColor = 'text-blue-700';

    if (text === 'RESOLVED') {
      bg = 'bg-emerald-50/50';
      border = 'border-emerald-200/60';
      textColor = 'text-emerald-700';
    } else if (text === 'RESPONDED') {
      bg = 'bg-purple-50/50';
      border = 'border-purple-200/60';
      textColor = 'text-purple-700';
    } else if (text === 'ACTIVE') {
      bg = 'bg-amber-50/50';
      border = 'border-amber-200/60';
      textColor = 'text-amber-700';
    } else if (text === 'OPEN') {
      bg = 'bg-blue-50/50';
      border = 'border-blue-200/60';
      textColor = 'text-blue-700';
    }

    return (
      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold tracking-wider uppercase select-none ${bg} ${border} ${textColor}`}>
        {text}
      </span>
    );
  };

  const renderUnifiedSidebarContents = (isMobile: boolean) => {
    // Show all teacher doubts (no class or status filtering)
    const filteredTeacherDoubts = studentDoubts;

    const handleDoubtClick = (doubtId: string) => {
      setSelectedDoubtId(doubtId);
      setActiveWorkspaceTab('teacher');
      if (isMobile) {
        setIsMobileHistoryOpen(false);
      }
    };

    const handleSessionClick = (sess: PreSavedSession) => {
      handlePreSessionOpen(sess);
      setActiveWorkspaceTab('mootion');
      if (isMobile) {
        setIsMobileHistoryOpen(false);
      }
    };

    const triggerNewDoubtModal = () => {
      if (joinedClasses.length > 0 && !newDoubtClassId) {
        setNewDoubtClassId(joinedClasses[0].class_id);
      }
      setIsNewDoubtModalOpen(true);
      if (isMobile) {
        setIsMobileHistoryOpen(false);
      }
    };

    const triggerNewChatModal = () => {
      setNewChatTopic('');
      setIsNewChatModalOpen(true);
      if (isMobile) {
        setIsMobileHistoryOpen(false);
      }
    };

    return (
      <div className="flex flex-col h-full font-montserrat justify-between">
        <div className="flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3 select-none">
            <span className="font-black text-xs text-[#1800ad] uppercase tracking-widest">Doubts & History</span>
          </div>

          {/* Mode Selector Toggle Segmented rounded pill */}
          <div className="bg-[#1800ad]/5 rounded-2xl p-1 border border-[#1800ad]/15 flex items-center relative overflow-hidden select-none">
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('mootion')}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeWorkspaceTab === 'mootion'
                  ? 'bg-[#1800ad] text-[#f6f4ee] shadow-sm'
                  : 'text-[#1800ad]/60 hover:text-[#1800ad]'
              }`}
            >
              Mootion AI
            </button>
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('teacher')}
              className={`flex-1 text-center py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeWorkspaceTab === 'teacher'
                  ? 'bg-[#1800ad] text-[#f6f4ee] shadow-sm'
                  : 'text-[#1800ad]/60 hover:text-[#1800ad]'
              }`}
            >
              Teacher
            </button>
          </div>

          {/* Contextual Action Button */}
          <div className="relative overflow-hidden shrink-0">
            {activeWorkspaceTab === 'mootion' ? (
              <button 
                type="button"
                onClick={handleStartNewSession}
                className="w-full bg-[#1800ad] hover:opacity-95 text-[#f6f4ee] uppercase font-montserrat font-black text-xs py-4 rounded-[18px] transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 border border-[#1800ad] tracking-wider"
              >
                <Plus size={16} /> New Chat
              </button>
            ) : (
              <button 
                type="button"
                onClick={triggerNewDoubtModal}
                className="w-full bg-[#1800ad] hover:opacity-95 text-[#f6f4ee] uppercase font-montserrat font-black text-xs py-4 rounded-[18px] transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 border border-[#1800ad] tracking-wider"
              >
                <Plus size={16} /> New Doubt
              </button>
            )}
          </div>
        </div>

        {/* Unified Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 relative custom-scrollbar min-h-0">
          <AnimatePresence mode="wait">
            {activeWorkspaceTab === 'mootion' ? (
              <motion.div
                key="mootion-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                {chatSessions.map((sess) => {
                  const isActive = activeSessionId === sess.id && activeWorkspaceTab === 'mootion';
                  return (
                    <button
                      key={sess.id}
                      onClick={() => handleSessionClick(sess)}
                      className={`p-3 rounded-xl text-left transition-all border text-xs flex flex-col gap-0.5 relative overflow-hidden ${
                        isActive 
                          ? 'bg-[#1800ad] border-transparent text-[#f6f4ee] font-extrabold shadow-sm' 
                          : 'bg-white border-[#1800ad]/10 hover:border-[#1800ad]/25 text-[#1800ad]'
                      }`}
                    >
                      <div className="font-black truncate uppercase tracking-wide">{sess.title}</div>
                      <div className={`text-[10px] truncate ${isActive ? 'text-[#f6f4ee]/75' : 'text-[#1800ad]/60'}`}>
                        {sess.lastMsg}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="teacher-list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-2"
              >
                {filteredTeacherDoubts.length === 0 ? (
                  <div className="py-8 flex flex-col items-center justify-center text-[#1800ad]/30 select-none text-center px-2">
                    <span className="text-[10px] font-black tracking-wider leading-relaxed">
                      No doubts found
                    </span>
                  </div>
                ) : (
                  filteredTeacherDoubts.map((doubt) => {
                    const isActive = selectedDoubtId === doubt.doubt_id && activeWorkspaceTab === 'teacher';
                    const doubtClass = joinedClasses.find(c => c.class_id === doubt.class_id);
                    const isResolved = doubt.status.toLowerCase() === 'resolved';
                    const isResponded = doubt.status.toLowerCase() === 'responded';
                    
                    const msgs = doubt.messages || [];
                    const lastMsg = msgs[msgs.length - 1];
                    let unreadCount = 0;
                    if (!isActive) {
                      for (let idx = msgs.length - 1; idx >= 0; idx--) {
                        if (msgs[idx].sender === 'teacher') {
                          unreadCount++;
                        } else {
                          break;
                        }
                      }
                    }
                    const hasUnread = unreadCount > 0;

                    let statusText = 'OPEN';
                    if (isResolved) statusText = 'RESOLVED';
                    else if (isResponded) statusText = 'RESPONDED';

                    let pillBg = 'bg-blue-50/50';
                    let pillBorder = 'border-blue-200/60';
                    let pillText = 'text-blue-700';

                    if (statusText === 'RESOLVED') {
                      pillBg = 'bg-emerald-50/50';
                      pillBorder = 'border-emerald-200/60';
                      pillText = 'text-emerald-700';
                    } else if (statusText === 'RESPONDED') {
                      pillBg = 'bg-purple-50/50';
                      pillBorder = 'border-purple-200/60';
                      pillText = 'text-purple-700';
                    }

                    const teacherName = doubt.teacher_name || "Assigned Teacher";
                    const subject = doubt.subject || (doubtClass ? doubtClass.subject : "Science");

                    return (
                      <button
                        key={doubt.doubt_id}
                        onClick={() => handleDoubtClick(doubt.doubt_id)}
                        className={`p-3.5 rounded-2xl text-left transition-all border text-xs flex flex-col gap-1.5 relative overflow-hidden ${
                          isActive 
                            ? 'bg-[#1800ad] border-transparent text-[#f6f4ee] font-extrabold shadow-md' 
                            : 'bg-white border-[#1800ad]/10 hover:border-[#1800ad]/25 text-[#1800ad]'
                        }`}
                      >
                        <div className="flex items-center justify-between pr-4">
                          <span className="font-black truncate uppercase tracking-wider text-[11px] max-w-[85%]">
                            {doubt.topic || doubt.query_text}
                          </span>
                        </div>

                        <div className={`text-[10px] font-bold ${isActive ? 'text-[#f6f4ee]/80' : 'text-[#1800ad]/60'}`}>
                          {teacherName} • {subject}
                        </div>

                        <p className={`text-[10px] truncate ${isActive ? 'text-[#f6f4ee]/70' : 'text-[#1800ad]/50'} italic`}>
                          {lastMsg ? lastMsg.text : doubt.query_text}
                        </p>

                        <div className="flex items-center justify-between mt-1 text-[9px] font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase ${pillBg} ${pillBorder} ${pillText}`}>
                              {statusText}
                            </span>
                            {hasUnread && (
                              <span className="text-[8px] font-extrabold text-red-655 tracking-wider">
                                {unreadCount} UNREAD
                              </span>
                            )}
                          </div>
                          <span className={`font-mono text-[8px] ${isActive ? 'text-[#f6f4ee]/50' : 'text-[#1800ad]/40'}`}>
                            {new Date(doubt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  // ─── Load quotas from backend ──────────────────────────────────────────────
  useEffect(() => {
    api.get('/students/quotas').then((q: any) => {
      const used = q.playground_items_used_week ?? q.playground_items_used ?? 0;
      const max = q.playground_items_max ?? 10;
      setQuota(used);
      setQuotaMax(max);
    }).catch(() => {});
  }, []);

  // ─── Load chat sessions from backend ──────────────────────────────────────
  const loadChatSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const threads: any[] = await api.get('/chat-with-ai/chats');
      const mapped: PreSavedSession[] = threads.map(t => ({
        id: t.chat_id,
        title: t.title ?? 'New Chat',
        lastMsg: t.last_message_preview ?? '',
        timestamp: new Date(t.updated_at ?? t.created_at).toLocaleDateString(),
      }));
      setChatSessions(mapped);
      return mapped;
    } catch {
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // ─── Load history for a specific chat thread ───────────────────────────────
  const loadChatHistory = useCallback(async (chatId: string) => {
    try {
      const msgs: any[] = await api.get(`/chat-with-ai/chats/${chatId}/messages`);
      const flatMsgs: ChatMessage[] = msgs.flatMap(m => backendMsgToChatMsg(m));
      setMessages(flatMsgs);
    } catch {
      setMessages([]);
    }
  }, []);

  const createNewChat = async (contextBody: any = {}, overrideTitle?: string) => {
    try {
      const thread: any = await api.post('/chat-with-ai/chats', contextBody);
      const chatId = thread.chat_id;
      
      const newSession: PreSavedSession = {
        id: chatId,
        title: overrideTitle || thread.title || 'New Chat',
        lastMsg: contextBody.assignment_title 
                 ? `👋 Starting "${contextBody.assignment_title}"...` 
                 : 'What concept are we exploring?',
        timestamp: 'Just now',
      };
      
      setChatSessions(prev => {
        if (prev.some(s => s.id === chatId)) return prev;
        return [newSession, ...prev];
      });
      setActiveChatId(chatId);
      setActiveSessionId(chatId);
      sessionStorage.setItem('mootion_chat_id', chatId);
      
      // Update assignment context based on thread context
      const ctx = thread.context_json ?? {};
      if (ctx.assignment_title || ctx.chapter_title) {
        setAssignmentContext({
          assignmentTitle: ctx.assignment_title,
          chapterTitle: ctx.chapter_title,
          subject: ctx.subject ?? ctx.class_display_name,
          type: ctx.assignment_type,
        });
      } else {
        setAssignmentContext(null);
      }
      
      return { chatId, ctx };
    } catch (err) {
      console.error('Failed to create new chat:', err);
      return null;
    }
  };

  const handleStartNewSession = async () => {
    const welcomeMsg = 'What concept are we exploring? Type "/" to summon virtual tools: video narrations, 3D orbits, sandbox simulations, or custom quizzes.';
    const result = await createNewChat({});
    if (result) {
      setMessages([{
        id: `msg-welcome-${Date.now()}`,
        sender: 'mootion',
        text: welcomeMsg,
        timestamp: 'Just now',
      }]);
    } else {
      // Fallback: local only session
      const newId = `local-${Date.now()}`;
      setChatSessions(prev => [{ id: newId, title: 'New Chat', lastMsg: '', timestamp: 'Just now' }, ...prev]);
      setActiveSessionId(newId);
      setActiveChatId(null);
      setAssignmentContext(null);
      setMessages([{
        id: `msg-welcome-${Date.now()}`,
        sender: 'mootion',
        text: welcomeMsg,
        timestamp: 'Just now',
      }]);
    }
  };

  // ─── Create or open context-aware chat thread on mount ───────────────────
  useEffect(() => {
    const init = async () => {
      const sessions = await loadChatSessions();

      // If we have URL context params, create a new context-aware thread
      if (urlAssignmentId || urlChapterId || urlClassId) {
        const body: any = {};
        if (urlAssignmentId) body.assignment_id = urlAssignmentId;
        if (urlChapterId) body.chapter_id = urlChapterId;
        if (urlClassId) body.class_id = urlClassId;

        const result = await createNewChat(body);
        if (result) {
          const { ctx } = result;
          // Add welcome message
          const welcomeText = ctx.assignment_title
            ? `👋 Starting "${ctx.assignment_title}". Ask me anything or type "/" to use tools like /quiz, /simulation, /video!`
            : ctx.chapter_title
            ? `📖 Opened "${ctx.chapter_title}". Ask me anything about this chapter!`
            : `What concept are we exploring? Type "/" to summon virtual tools: video narrations, 3D orbits, sandbox simulations, or custom quizzes.`;

          setMessages([{
            id: `welcome-${Date.now()}`,
            sender: 'mootion',
            text: welcomeText,
            timestamp: 'Just now',
          }]);
        }
      } else {
        const storedChatId = sessionStorage.getItem('mootion_chat_id');
        const found = storedChatId ? sessions.find(s => s.id === storedChatId) : null;
        if (found) {
          setActiveChatId(found.id);
          setActiveSessionId(found.id);
          await loadChatHistory(found.id);
        } else {
          // No stored session or not found — create a new context-free chat
          await createNewChat({});
          setMessages([{
            id: `welcome-${Date.now()}`,
            sender: 'mootion',
            text: 'What concept are we exploring? Type "/" to summon virtual tools: video narrations, 3D orbits, sandbox simulations, or custom quizzes.',
            timestamp: 'Just now',
          }]);
        }
      }
    };

    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayAudio = (url: string) => {
    if (playingAudioUrl === url && currentAudio) {
      currentAudio.pause();
      setPlayingAudioUrl(null);
      setCurrentAudio(null);
    } else {
      if (currentAudio) {
        currentAudio.pause();
      }
      const audio = new Audio(url);
      audio.play().catch(e => console.error("Audio playback error:", e));
      setPlayingAudioUrl(url);
      setCurrentAudio(audio);
      audio.onended = () => {
        setPlayingAudioUrl(null);
        setCurrentAudio(null);
      };
    }
  };

  const submitDoubtApi = async (classId: string, queryText: string) => {
    setIsSubmittingDoubt(true);
    
    try {
      // Create the doubt
      await api.post('/students/doubts', {
        class_id: classId,
        query_text: queryText,
        tried_before: false,
        attempt_text: null
      });
      
      // Add success message
      setMessages(prev => [
        ...prev,
        {
          id: `msg-mootion-success-${Date.now()}`,
          sender: 'mootion',
          text: `📤 **Doubt Dispatched to Teacher!**\n\nYour question has been added directly to your teacher's doubts dashboard.`,
          timestamp: 'Just now'
        }
      ]);
      
      // Refresh doubts
      const doubtsData = await api.get('/students/doubts');
      setStudentDoubts(doubtsData);
      
      // Auto-switch to Teacher tab
      setActiveWorkspaceTab('teacher');
      
      // Set the selected subject selector to the one we just submitted to
      setSelectedClassId(classId);
      
      // Wait for DOM update, then scroll to the bottom of the doubt list or elements
      setTimeout(() => {
        const doubtsListEl = document.getElementById('student-doubts-list-container');
        if (doubtsListEl) {
          doubtsListEl.scrollTop = doubtsListEl.scrollHeight;
        }
      }, 300);

    } catch (err: any) {
      console.error("Failed to submit student doubt:", err);
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: `msg-mootion-err-${Date.now()}`,
          sender: 'mootion',
          text: `❌ **Failed to submit doubt:** ${err.detail || err.message}`,
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  const handleCreateDoubtFromTab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoubtText.trim() || !selectedClassId) return;
    
    setIsSubmittingDoubt(true);
    try {
      await api.post('/students/doubts', {
        class_id: selectedClassId,
        query_text: newDoubtText.trim(),
        tried_before: false,
        attempt_text: null
      });
      
      setNewDoubtText('');
      
      // Refresh doubts
      const doubtsData = await api.get('/students/doubts');
      setStudentDoubts(doubtsData);
      
      // Scroll to bottom of doubts list
      setTimeout(() => {
        const doubtsListEl = document.getElementById('student-doubts-list-container');
        if (doubtsListEl) {
          doubtsListEl.scrollTop = doubtsListEl.scrollHeight;
        }
      }, 200);
    } catch (err: any) {
      console.error("Failed to submit student doubt from tab:", err);
      alert(`Error submitting doubt: ${err.detail || err.message}`);
    } finally {
      setIsSubmittingDoubt(false);
    }
  };

  const handleResolveDoubt = async (doubtId: string) => {
    try {
      const updated = await api.post(`/students/doubts/${doubtId}/resolve`);
      setStudentDoubts(prev => prev.map(d => d.doubt_id === doubtId ? { ...d, status: updated.status, messages: updated.messages } : d));
    } catch (err: any) {
      console.error("Failed to resolve doubt:", err);
      alert(`Failed to resolve: ${err.detail || err.message}`);
    }
  };

  const handleSendFollowUp = async (doubtId: string) => {
    const text = followUpTexts[doubtId]?.trim();
    if (!text) return;
    setSubmittingFollowUpIds(prev => ({ ...prev, [doubtId]: true }));
    try {
      const updated = await api.post(`/students/doubts/${doubtId}/reply`, {
        response_text: text
      });
      setFollowUpTexts(prev => ({ ...prev, [doubtId]: '' }));
      setStudentDoubts(prev => prev.map(d => d.doubt_id === doubtId ? { ...d, status: updated.status, messages: updated.messages } : d));
    } catch (err: any) {
      console.error("Failed to send follow up message:", err);
      alert(`Failed to send message: ${err.detail || err.message}`);
    } finally {
      setSubmittingFollowUpIds(prev => ({ ...prev, [doubtId]: false }));
    }
  };

  const selectSubject = (subjectName: string) => {
    const match = textInput.match(/^(\/ask[-_]teacher\s+\/)/i);
    if (match) {
      const newVal = match[1] + subjectName + ' ';
      setTextInput(newVal);
      focusAndMoveCursorToEnd(newVal);
    } else {
      chatInputRef.current?.focus();
    }
    setShowSubjectSuggestions(false);
  };

  const renderSubjectPickerCard = (payload: any) => {
    return (
      <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-3 font-montserrat">
        <span className="text-xs font-black uppercase tracking-wider text-[#1800ad] font-montserrat">Target Subject</span>
        <div className="flex flex-wrap gap-2">
          {joinedClasses.map((cls) => (
            <button
              key={cls.class_id}
              onClick={() => submitDoubtApi(cls.class_id, payload.queryText)}
              disabled={isSubmittingDoubt}
              className="px-4 py-2 bg-[#1800ad] hover:bg-[#1800ad]/90 text-[#f6f4ee] rounded-full text-xs font-black uppercase transition-all tracking-wider font-montserrat flex items-center gap-1.5 disabled:opacity-50"
            >
              {cls.subject} ({cls.display_name})
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Command selections
  const COMMAND_OPTIONS = [
    { cmd: '/video', label: 'Generate educational video storyboard' },
    { cmd: '/simulation', label: 'Create an interactive physics sandbox' },
    { cmd: '/universe', label: 'Explore a 3D orbital interactive system' },
    { cmd: '/quiz', label: 'Attempt unlimited custom concept practices' },
    { cmd: '/ask-teacher', label: 'Ask a direct question to your teacher' },
  ];

  // Auto-scroll inside chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check dynamically for updated teacher replies in simulated local database
  useEffect(() => {
    const handleCheckTeacherReplies = () => {
      const doubtsRaw = localStorage.getItem('mootion_doubts_store');
      if (!doubtsRaw) return;
      try {
        const currentStore = JSON.parse(doubtsRaw);
        const printedReplies = JSON.parse(localStorage.getItem('mootion_printed_replies') || '[]');
        let updatedPrinted = [...printedReplies];
        let hasNewMessage = false;

        currentStore.forEach((doubt: any) => {
          // Look for replies or messages from teacher
          const teacherMsgs = doubt.messages?.filter((msg: any) => msg.sender === 'teacher') || [];
          teacherMsgs.forEach((tm: any) => {
            const printKey = `${doubt.id}_${tm.id}`;
            if (!updatedPrinted.includes(printKey)) {
              setMessages(prev => [
                ...prev,
                {
                  id: `reply-${printKey}`,
                  sender: 'mootion',
                  text: `🔔 **Response from Teacher on "${doubt.topicTitle || 'Your Doubt'}":**\n\n"${tm.text}"`,
                  timestamp: tm.timestamp || 'Just now'
                }
              ]);
              updatedPrinted.push(printKey);
              hasNewMessage = true;
            }
          });

          if (doubt.status === 'responded' && doubt.customText) {
            const customKey = `${doubt.id}_custom_notes`;
            if (!updatedPrinted.includes(customKey)) {
              setMessages(prev => [
                ...prev,
                {
                  id: `reply-${customKey}`,
                  sender: 'mootion',
                  text: `🔔 **Response from Teacher on "${doubt.topicTitle || 'Your Doubt'}":**\n\n"${doubt.customText}"`,
                  timestamp: 'Just now'
                }
              ]);
              updatedPrinted.push(customKey);
              hasNewMessage = true;
            }
          }
        });

        if (hasNewMessage) {
          localStorage.setItem('mootion_printed_replies', JSON.stringify(updatedPrinted));
        }
      } catch (e) {
        console.error("Doubt processing polling error:", e);
      }
    };

    handleCheckTeacherReplies();
    const interval = setInterval(handleCheckTeacherReplies, 2500);
    return () => clearInterval(interval);
  }, []);

  // Handle key inputs for slash command menu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextInput(val);

    const isAskTeacherCommand = val.startsWith('/ask-teacher') || val.startsWith('/ask_teacher');
    if (isAskTeacherCommand) {
      // Check if it has a slash after the command: e.g. "/ask-teacher /" or "/ask_teacher /"
      const match = val.match(/^\/ask[-_]teacher\s+\/(.*)$/i);
      if (match) {
        setShowSubjectSuggestions(true);
        setSubjectQuery(match[1].toLowerCase());
        setShowCommands(false);
      } else {
        setShowSubjectSuggestions(false);
        if (val.startsWith('/') && !val.includes(' ')) {
          setShowCommands(true);
          setCommandQuery(val.toLowerCase());
        } else {
          setShowCommands(false);
        }
      }
    } else {
      setShowSubjectSuggestions(false);
      if (val.startsWith('/') && !val.includes(' ')) {
        setShowCommands(true);
        setCommandQuery(val.toLowerCase());
      } else {
        setShowCommands(false);
      }
    }
  };

  const selectCommand = (cmd: string) => {
    const newVal = cmd + ' ';
    setTextInput(newVal);
    setShowCommands(false);
    focusAndMoveCursorToEnd(newVal);
  };

  const triggerTeacherSimulateToggle = () => {
    const nextVal = !teacherAssigned;
    setTeacherAssigned(nextVal);
    setTeacherAssignedNew(nextVal);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isSendingMessage) return;

    if (quota >= quotaMax) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-usr-${Date.now()}`,
          sender: 'student',
          text: textInput,
          timestamp: 'Just now'
        },
        {
          id: `msg-warn-${Date.now()}`,
          sender: 'mootion',
          text: `You have reached your weekly limit of ${quotaMax} generations. The playground resets next Monday.`,
          timestamp: 'Just now'
        }
      ]);
      setTextInput('');
      return;
    }

    const userInput = textInput.trim();
    setTextInput('');
    setShowCommands(false);

    const normalizedInput = userInput.toLowerCase();

    // ── Intercept /ask-teacher command (local handling, no API call needed) ──
    const isAskTeacher = normalizedInput.startsWith('/ask-teacher') || normalizedInput.startsWith('/ask_teacher');
    if (isAskTeacher) {
      let queryText = '';
      let targetSubjectName = '';

      const commandPattern = /^\/ask[-_]teacher\s*/i;
      const cleanedInput = userInput.replace(commandPattern, '').trim();

      if (cleanedInput.startsWith('/')) {
        const parts = cleanedInput.substring(1).split(/\s+/);
        targetSubjectName = parts[0];
        queryText = parts.slice(1).join(' ').trim();
      } else {
        queryText = cleanedInput;
      }

      if (!queryText) {
        setMessages(prev => [
          ...prev,
          { id: `msg-usr-${Date.now()}`, sender: 'student', text: userInput, timestamp: 'Just now' },
          { id: `msg-mootion-help-${Date.now()}`, sender: 'mootion', text: `Please provide a question. Example: /ask-teacher /Science Why is water wet?`, timestamp: 'Just now' },
        ]);
        return;
      }

      let targetClass: any = null;
      if (targetSubjectName) {
        targetClass = joinedClasses.find(c =>
          c.subject.toLowerCase() === targetSubjectName.toLowerCase() ||
          c.display_name.toLowerCase() === targetSubjectName.toLowerCase()
        );
        if (!targetClass) {
          setMessages(prev => [
            ...prev,
            { id: `msg-usr-${Date.now()}`, sender: 'student', text: userInput, timestamp: 'Just now' },
            { id: `msg-mootion-err-${Date.now()}`, sender: 'mootion', text: `Subject "${targetSubjectName}" not found. You are joined in: ${joinedClasses.map(c => c.subject).join(', ')}.`, timestamp: 'Just now' },
          ]);
          return;
        }
      }

      if (!targetClass) {
        if (joinedClasses.length === 1) {
          targetClass = joinedClasses[0];
        } else if (joinedClasses.length > 1) {
          setMessages(prev => [
            ...prev,
            { id: `msg-usr-${Date.now()}`, sender: 'student', text: userInput, timestamp: 'Just now' },
            {
              id: `msg-picker-${Date.now()}`,
              sender: 'mootion',
              text: 'You are enrolled in multiple classes. Please select which subject this doubt is for:',
              timestamp: 'Just now',
              payload: { type: 'subject_picker', title: 'Select Subject', queryText } as any
            },
          ]);
          return;
        } else {
          setMessages(prev => [
            ...prev,
            { id: `msg-usr-${Date.now()}`, sender: 'student', text: userInput, timestamp: 'Just now' },
            { id: `msg-mootion-err-${Date.now()}`, sender: 'mootion', text: 'You are not enrolled in any classes. Please join a class on the home page first.', timestamp: 'Just now' },
          ]);
          return;
        }
      }

      setMessages(prev => [
        ...prev,
        { id: `msg-usr-${Date.now()}`, sender: 'student', text: userInput, timestamp: 'Just now' },
      ]);
      submitDoubtApi(targetClass.class_id, queryText);
      return;
    }

    const isSimulation = normalizedInput.startsWith('/simulation');
    if (isSimulation) {
      const topic = userInput.replace(/^\/simulation\s*/i, '').trim() || 'physics';
      
      if (quota >= quotaMax) {
        setMessages(prev => [
          ...prev,
          { id: `msg-usr-${Date.now()}`, sender: 'student', text: userInput, timestamp: 'Just now' },
          { id: `msg-warn-${Date.now()}`, sender: 'mootion', text: `You have reached your weekly limit of ${quotaMax} generations.`, timestamp: 'Just now' }
        ]);
        return;
      }

      const loadingSimId = `msg-sim-loading-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        { id: `msg-usr-${Date.now()}`, sender: 'student', text: userInput, timestamp: 'Just now' },
        { 
          id: loadingSimId, 
          sender: 'mootion', 
          text: '', 
          timestamp: 'Just now',
          payload: { type: 'simulation_loading', state: 'searching' } as any
        }
      ]);
      setIsSendingMessage(true);

      try {
        let minWaitResolved = false;
        const minWaitPromise = new Promise(resolve => setTimeout(() => {
            minWaitResolved = true;
            resolve(true);
        }, 5000));

        // Start the API call
        const apiPromise = api.post('/simulations/resolve', { topic });
        
        // Update state if the API call succeeds before minWaitPromise
        apiPromise.then((res: any) => {
            if (res && res.type !== 'failed') {
                setMessages(prev => prev.map(m => m.id === loadingSimId ? {
                    ...m,
                    payload: { 
                        type: 'simulation_loading', 
                        state: res.type === 'ai' ? 'generating' : 'searching' 
                    } as any
                } : m));
            }
        }).catch(() => {
            // Do nothing here, it will be caught by the main catch block
        });

        const res: any = await apiPromise;

        if (!minWaitResolved && res && !res.error && res.type !== 'failed') {
            await minWaitPromise;
        }

        if (res && (res.error || res.type === 'failed')) {
            throw new Error('Simulation generation failed');
        }

        const newQuota = incrementPlaygroundQuota();
        setQuota(newQuota);

        const assistantMsg: ChatMessage = {
          id: `msg-sim-${Date.now()}`,
          sender: 'mootion',
          text: `Here is the simulation for ${topic}.`,
          timestamp: 'Just now',
          payload: {
            type: 'simulation',
            title: res.title || topic,
            simulation: { _phetUrl: res.url } as any
          }
        };
        setMessages(prev => prev.map(m => m.id === loadingSimId ? assistantMsg : m));
      } catch (err: any) {
        console.error('Failed to resolve simulation:', err);
        setMessages(prev => prev.map(m => m.id.startsWith('msg-sim-loading') ? { ...m, text: `Sorry, I couldn't generate the simulation right now.`, payload: undefined } : m));
      } finally {
        setIsSendingMessage(false);
      }
      return;
    }

    // ── Add student's message immediately (optimistic) ──
    const studentMsgId = `msg-usr-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: studentMsgId, sender: 'student', text: userInput, timestamp: 'Just now' }
    ]);

    // ── Add loading indicator ──
    const isVideo = normalizedInput.startsWith('/video');
    const loadingMsgId = isVideo ? `msg-vid-loading-${Date.now()}` : `msg-loading-${Date.now()}`;
    
    setMessages(prev => [
      ...prev,
      { 
        id: loadingMsgId, 
        sender: 'mootion', 
        text: isVideo ? '' : '...', 
        timestamp: 'Just now',
        payload: isVideo ? { type: 'video_loading' } as any : undefined
      }
    ]);

    setIsSendingMessage(true);

    try {
      // Ensure we have an active chat thread
      let chatId = activeChatId;
      if (!chatId) {
        const result = await createNewChat({}, userInput.slice(0, 60));
        chatId = result?.chatId ?? null;
      }

      // Send the message
      const response: any = await api.post(`/chat-with-ai/chats/${chatId}/messages`, { content: userInput });

      // Update quota from response
      const newQuota = incrementPlaygroundQuota();
      setQuota(newQuota);

      // Build the assistant message
      const assistantRaw = response.assistant_message;
      const generatedAssets: any[] = response.generated_assets ?? [];

      let assistantPayload: ChatMessage['payload'] | undefined;
      if (generatedAssets.length > 0) {
        assistantPayload = buildPayloadFromAsset(generatedAssets[0]);
      }

      const assistantMsg: ChatMessage = {
        id: assistantRaw?.message_id ?? `msg-ai-${Date.now()}`,
        sender: 'mootion',
        text: assistantRaw?.content ?? 'Here is what I found for you.',
        timestamp: 'Just now',
        payload: assistantPayload,
      };

      setMessages(prev => prev.map(m => m.id === loadingMsgId ? assistantMsg : m));

      // Update session list preview
      setChatSessions(prev => prev.map(s =>
        s.id === chatId
          ? { ...s, lastMsg: (assistantRaw?.content ?? '').slice(0, 60), timestamp: 'Just now' }
          : s
      ));
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.map(m =>
        m.id === loadingMsgId
          ? { ...m, text: `Sorry, I couldn't get a response right now. Please try again.` }
          : m
      ));
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Speech recording functions using MediaRecorder and Gemini Speech-to-Text
  const toggleChatVoiceRecording = async () => {
    if (isVoiceRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsVoiceRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudioWithGemini(audioBlob);
            if (transcription) {
              setTextInput(prev => {
                const newVal = (prev || '') + ' ' + transcription;
                focusAndMoveCursorToEnd(newVal);
                return newVal;
              });
            }
          } catch (err) {
            console.error("Transcription error:", err);
            alert("Failed to transcribe voice. Make sure microphone permission is enabled.");
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsVoiceRecording(true);
      } catch (err) {
        console.error("Recording failed to start:", err);
        alert("Failed to access microphone.");
      }
    }
  };

  const toggleDoubtVoiceRecording = async () => {
    if (isDoubtRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsDoubtRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsTranscribing(true);
          try {
            const transcription = await transcribeAudioWithGemini(audioBlob);
            if (transcription) {
              setNewDoubtText(prev => (prev || '') + ' ' + transcription);
            }
          } catch (err) {
            console.error("Transcription error:", err);
            alert("Failed to transcribe voice. Make sure microphone permission is enabled.");
          } finally {
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        setIsDoubtRecording(true);
      } catch (err) {
        console.error("Recording failed to start:", err);
        alert("Failed to access microphone.");
      }
    }
  };

  const handlePreSessionOpen = async (sess: PreSavedSession) => {
    setActiveSessionId(sess.id);
    setActiveChatId(sess.id);
    sessionStorage.setItem('mootion_chat_id', sess.id);
    setMessages([]);
    setAssignmentContext(null);
    await loadChatHistory(sess.id);
    setIsMobileHistoryOpen(false);
  };



  // Render video payload inline in message
  const renderVideoCard = (payload: any) => {
    const topicTitle = payload.video?.topic || payload.title || "Educational Video";
    return (
      <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 sm:p-6 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-4 font-montserrat">
        <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3 font-montserrat">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center animate-pulse">
              <Film size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad] font-montserrat">{payload.title}</h4>
              <p className="text-[10px] text-[#1800ad]/70 font-semibold font-montserrat">{topicTitle}</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 bg-[#1800ad]/15 text-[#1800ad] rounded-full font-bold uppercase font-montserrat">
            Chapter Unlocked
          </span>
        </div>

        {/* Real Playable HTML5 Video Player */}
        <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-[#1800ad]/20 flex flex-col shadow-inner">
          <video 
            src={payload.video?.url || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} 
            controls 
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-[11px] text-[#1800ad]/80 font-medium leading-relaxed bg-[#1800ad]/5 p-3 rounded-xl border border-[#1800ad]/15 font-montserrat">
          {cleanText(`Topic Storyboard Concept: This visual presentation highlights key steps of ${topicTitle}. Play the interactive video timeline to watch the illustrated scientific guide!`)}
        </div>
      </div>
    );
  };

  // Render sandbox buoyancy simulation inline
  const renderSimulationCard = (payload: any) => {
    const topicTitle = payload.title || "Forces & Motion Sandbox";
    
    // Helper function to resolve topic to modern PhET simulation URL
    const getPhETUrl = (topic: string): string => {
      const t = topic.toLowerCase().trim();
      const slugPattern = /^[a-z0-9\-]+$/;
      
      // If it looks like a direct slug already, check if we can reconstruct it
      if (slugPattern.test(t)) {
        return `https://phet.colorado.edu/sims/html/${t}/latest/${t}_all.html`;
      }

      const formattedSlug = t.replace(/[\s_]+/g, '-');
      if (slugPattern.test(formattedSlug)) {
        const verifiedSims = [
          "forces-and-motion-basics", "buoyancy", "balancing-act", "gravity-and-orbits", 
          "energy-skate-park-basics", "under-pressure", "wave-on-a-string", "color-vision", 
          "john-travoltage", "balloons-and-static-electricity", "charges-and-fields", 
          "resistance-in-a-wire", "ohms-law", "circuit-construction-kit-dc", "ph-scale", 
          "states-of-matter-basics", "gas-properties", "molecule-shapes", "reactants-products-and-leftovers", 
          "concentration", "rutherford-scattering", "build-an-atom", "bending-light",
          "projectile-motion", "wave-interference", "gravity-force-lab-basics", "hookes-law",
          "generator", "faradays-law", "balloons-and-buoyancy", "acid-base-solutions"
        ];
        if (verifiedSims.includes(formattedSlug)) {
          return `https://phet.colorado.edu/sims/html/${formattedSlug}/latest/${formattedSlug}_all.html`;
        }
      }

      // Keyword matching fallbacks
      if (t.includes("buoyancy") || t.includes("buoyant") || t.includes("fluid") || t.includes("water") || t.includes("sink") || t.includes("float") || t.includes("liquid") || t.includes("density")) {
        return "https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy_all.html";
      }
      if (t.includes("balance") || t.includes("balancing") || t.includes("act") || t.includes("lever") || t.includes("torque") || t.includes("see-saw")) {
        return "https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act_all.html";
      }
      if (t.includes("gravity") || t.includes("orbit") || t.includes("space") || t.includes("planetary") || t.includes("sun") || t.includes("moon")) {
        return "https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html";
      }
      if (t.includes("skate") || t.includes("projectile") || t.includes("kinetic") || t.includes("potential") || t.includes("energy")) {
        if (t.includes("projectile")) {
          return "https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html";
        }
        return "https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_all.html";
      }
      if (t.includes("pressure") || t.includes("depth") || t.includes("under pressure")) {
        return "https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html";
      }
      if (t.includes("wave") || t.includes("string") || t.includes("oscillation") || t.includes("amplitude") || t.includes("frequency") || t.includes("interference")) {
        if (t.includes("string")) {
          return "https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html";
        }
        return "https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_all.html";
      }
      if (t.includes("color") || t.includes("vision") || t.includes("light") || t.includes("filter") || t.includes("rgb") || t.includes("laser")) {
        return "https://phet.colorado.edu/sims/html/color-vision/latest/color-vision_all.html";
      }
      if (t.includes("travoltage") || t.includes("john") || t.includes("static electricity")) {
        return "https://phet.colorado.edu/sims/html/john-travoltage/latest/john-travoltage_all.html";
      }
      if (t.includes("balloon") || t.includes("sweater") || t.includes("static")) {
        return "https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_all.html";
      }
      if (t.includes("charges") || t.includes("field") || t.includes("equipotential")) {
        return "https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_all.html";
      }
      if (t.includes("ohm") || t.includes("current") || t.includes("voltage") || t.includes("resistance") || t.includes("wire") || t.includes("resistivity")) {
        if (t.includes("wire") || t.includes("resistivity")) {
          return "https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire_all.html";
        }
        return "https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html";
      }
      if (t.includes("circuit") || t.includes("dc") || t.includes("battery") || t.includes("bulb")) {
        return "https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html";
      }
      if (t.includes("molecule") || t.includes("shape") || t.includes("vsepr") || t.includes("geometry")) {
        return "https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_all.html";
      }
      if (t.includes("reactant") || t.includes("product") || t.includes("stoichiometry") || t.includes("leftover") || t.includes("reaction")) {
        return "https://phet.colorado.edu/sims/html/reactants-products-and-leftovers/latest/reactants-products-and-leftovers_all.html";
      }
      if (t.includes("rutherford") || t.includes("alpha") || t.includes("gold foil")) {
        return "https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_all.html";
      }
      if (t.includes("ph") || t.includes("acid") || t.includes("base") || t.includes("alkaline") || t.includes("dilution") || t.includes("concentration")) {
        if (t.includes("concentration")) {
          return "https://phet.colorado.edu/sims/html/concentration/latest/concentration_all.html";
        }
        return "https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_all.html";
      }
      if (t.includes("state") || t.includes("solid") || t.includes("gas") || t.includes("boiling") || t.includes("melting") || t.includes("matter")) {
        if (t.includes("gas") && (t.includes("pressure") || t.includes("property") || t.includes("volume") || t.includes("temperature"))) {
          return "https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html";
        }
        return "https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_all.html";
      }
      if (t.includes("atom") || t.includes("proton") || t.includes("neutron") || t.includes("electron") || t.includes("isotope") || t.includes("element")) {
        return "https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html";
      }
      if (t.includes("bend") || t.includes("refraction") || t.includes("reflection") || t.includes("prism") || t.includes("snell")) {
        return "https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html";
      }
      if (t.includes("hooke") || t.includes("spring") || t.includes("elastic")) {
        return "https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_all.html";
      }

      return "https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html";
    };

    const phetUrl = payload.simulation?._phetUrl || getPhETUrl(topicTitle);

    return (
      <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-3 font-montserrat">
        <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-2 font-montserrat">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center animate-pulse">
              <Beaker size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad] font-montserrat">{topicTitle}</h4>
              <p className="text-[10px] text-[#1800ad]/70 font-semibold font-montserrat">PhET Interactive Laboratory Simulation</p>
            </div>
          </div>
          <span className="text-[9px] px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full font-bold uppercase font-montserrat">
            Live Lab Active
          </span>
        </div>

        {/* Live PhET Interactive Iframe */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-[#1800ad]/20 bg-white">
          <iframe 
            src={phetUrl} 
            className="w-full h-full border-0"
            title={topicTitle}
            allowFullScreen
          />
        </div>

        <div className="text-[10px] text-[#1800ad]/75 font-medium leading-relaxed bg-[#1800ad]/5 p-2.5 rounded-xl border border-[#1800ad]/15 font-montserrat">
          {cleanText("Click and interact directly in the sandbox to run variables simulations in real-time. Use full-screen toggle to enlarge!")}
        </div>
      </div>
    );
  };

  // Render inline interactive 3D universe world orbit viewer
  const renderUniverseOrbitalCard = (payload: any) => {
    const [subTopic, setSubTopic] = useState<'atom' | 'solar'>(payload.universe.systemType);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    
    return (
      <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 sm:p-6 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-4 font-montserrat">
        <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3 font-montserrat">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center">
              <Globe size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad] font-montserrat">{payload.title}</h4>
              <p className="text-[10px] text-[#1800ad]/70 font-semibold font-montserrat">Adaptive 3D Orbits Simulator</p>
            </div>
          </div>
          <div className="flex bg-[#1800ad]/5 rounded-lg p-0.5 border border-[#1800ad]/20 text-[10px] font-bold font-montserrat">
            <button 
              onClick={() => setSubTopic('solar')}
              className={`px-2.5 py-1 rounded-md transition-all font-montserrat ${subTopic === 'solar' ? 'bg-[#1800ad] text-[#f6f4ee]' : 'text-[#1800ad]'}`}
            >
              Solar System
            </button>
            <button 
              onClick={() => setSubTopic('atom')}
              className={`px-2.5 py-1 rounded-md transition-all font-montserrat ${subTopic === 'atom' ? 'bg-[#1800ad] text-[#f6f4ee]' : 'text-[#1800ad]'}`}
            >
              Bohr Atom
            </button>
          </div>
        </div>

        {/* Orbit animations inside simulated 3D canvas viewport */}
        <div className="aspect-video relative rounded-2xl bg-black/90 overflow-hidden border border-[#1800ad]/30 flex items-center justify-center p-4">
          <div className="absolute top-3 left-3 bg-[#1800ad]/85 border border-[#1800ad]/20 px-2.5 py-1.5 rounded-lg text-[9px] font-montserrat leading-relaxed max-w-[180px] text-[#f6f4ee]">
            <span className="font-bold text-white block uppercase mb-0.5 font-montserrat">Orbital State</span>
            <span className="font-montserrat">Speed: {speedMultiplier}x rate</span>
            <br />
            <span className="font-montserrat">Gravity Centripetal Equilibrium: Active</span>
          </div>

          {subTopic === 'solar' ? (
            <div className="relative w-full h-full flex items-center justify-center font-montserrat">
              {/* Sun */}
              <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-extrabold text-amber-950 shadow-[0_0_30px_#f59e0b] animate-pulse z-10 border border-amber-300 font-montserrat">SUN</div>
              
              {/* Orbits representation */}
              <div 
                className="absolute border border-dashed border-white/20 rounded-full animate-spin flex items-center justify-end"
                style={{ width: '120px', height: '120px', animationDuration: `${12 / speedMultiplier}s` }}
              >
                <div className="w-4 h-4 rounded-full bg-blue-400 border border-white/40 -mr-2 flex items-center justify-center text-[7px] text-white select-none font-bold font-montserrat" title="Earth">E</div>
              </div>

              <div 
                className="absolute border border-dashed border-white/20 rounded-full animate-spin flex items-center justify-start"
                style={{ width: '190px', height: '190px', animationDuration: `${20 / speedMultiplier}s` }}
              >
                <div className="w-5 h-5 rounded-full bg-orange-400 border border-white/40 -ml-2.5 flex items-center justify-center text-[8px] text-white select-none font-bold font-montserrat" title="Mars">M</div>
              </div>

              <div 
                className="absolute border border-dashed border-white/20 rounded-full animate-spin flex items-center justify-end"
                style={{ width: '60px', height: '60px', animationDuration: `${7 / speedMultiplier}s` }}
              >
                <div className="w-3 h-3 rounded-full bg-gray-500 border border-white/40 -mr-1.5 flex items-center justify-center text-[6px] text-white select-none font-bold font-montserrat" title="Mercury">Me</div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center font-montserrat">
              {/* Nucleus protons/neutrons */}
              <div className="w-10 h-10 rounded-full bg-[#1800ad] border-2 border-[#f6f4ee] flex flex-wrap gap-0.5 p-1 items-center justify-center z-10 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-[#f6f4ee]"></span>
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span className="w-2 h-2 rounded-full bg-[#f6f4ee]"></span>
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
              </div>

              {/* Electron Shell s1 */}
              <div 
                className="absolute border border-white/25 rounded-full animate-spin"
                style={{ width: '90px', height: '90px', animationDuration: `${5 / speedMultiplier}s` }}
              >
                <div className="w-3 h-3 rounded-full bg-emerald-400 border border-white shadow-md absolute top-0 left-1/2 -translate-x-1/2"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400 border border-white shadow-md absolute bottom-0 left-1/2 -translate-x-1/2"></div>
              </div>

              {/* Electron Shell s2 */}
              <div 
                className="absolute border border-white/15 rounded-full animate-spin"
                style={{ width: '180px', height: '180px', animationDuration: `${8 / speedMultiplier}s` }}
              >
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-md absolute -top-1.5 left-1/2 -translate-x-1/2"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400 border border-white shadow-md absolute top-1/2 -left-1.5 -translate-y-1/2"></div>
              </div>
            </div>
          )}
        </div>

        {/* Speed Adjustment and interaction Panel */}
        <div className="flex items-center justify-between bg-[#1800ad]/5 p-3 rounded-2xl border border-[#1800ad]/15 font-montserrat">
          <span className="text-xs font-montserrat">Velocity Multiplier:</span>
          <div className="flex gap-2 font-montserrat">
            {[0.5, 1, 1.5, 2.5].map((speed) => (
              <button 
                key={speed}
                onClick={() => setSpeedMultiplier(speed)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all font-montserrat ${speedMultiplier === speed ? 'bg-[#1800ad] text-[#f6f4ee]' : 'bg-[#1800ad]/10 hover:bg-[#1800ad]/15 text-[#1800ad]'}`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render inline interactive Sketchfab 3D model viewer
  const renderThreeDModelCard = (payload: any) => {
    const title = payload.title || "Interactive 3D Model";
    const embedUrl = payload.three_d_model?.embedUrl || '';
    
    return (
      <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-3 font-montserrat">
        <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-2 font-montserrat">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center">
              <Layers size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad] font-montserrat">{title}</h4>
              <p className="text-[10px] text-[#1800ad]/70 font-semibold font-montserrat">Sketchfab Interactive 3D Model</p>
            </div>
          </div>
          <span className="text-[9px] px-2.5 py-1 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full font-bold uppercase font-montserrat">
            3D Viewer Active
          </span>
        </div>

        {/* Live Sketchfab 3D Iframe */}
        <div className="w-full aspect-video rounded-2xl overflow-hidden border-2 border-[#1800ad]/20 bg-white" style={{ minHeight: '350px' }}>
          {embedUrl ? (
            <iframe 
              src={getSketchfabEmbedUrl(embedUrl)} 
              className="w-full h-full border-0"
              title={title}
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-[#1800ad]/50 italic">
              No 3D model URL available.
            </div>
          )}
        </div>

        <div className="text-[10px] text-[#1800ad]/75 font-medium leading-relaxed bg-[#1800ad]/5 p-2.5 rounded-xl border border-[#1800ad]/15 font-montserrat">
          Interact directly with the 3D canvas (drag to rotate, scroll to zoom, right-click to pan) to inspect the model.
        </div>
      </div>
    );
  };

  // Render practice Quiz payload card
  const renderQuizCard = (payload: any, messageIdx: number) => {
    const quizState = payload.quiz;
    const currentQuestion = quizState.questions[quizState.currentQuestionIdx];

    const handleAnswerSelect = (optionIdx: number) => {
      if (quizState.isCompleted) return;

      const updatedMessages = [...messages];
      const targetQuiz = updatedMessages[messageIdx].payload?.quiz;
      if (!targetQuiz) return;

      const q = targetQuiz.questions[targetQuiz.currentQuestionIdx];
      q.userAnswerIdx = optionIdx;

      // Update intermediate score
      if (optionIdx === q.correctAnswerIdx) {
        targetQuiz.score += 50; // Each worth 50 points
      }

      setMessages(updatedMessages);
    };

    const handleNext = () => {
      const updatedMessages = [...messages];
      const targetQuiz = updatedMessages[messageIdx].payload?.quiz;
      if (!targetQuiz) return;

      if (targetQuiz.currentQuestionIdx < targetQuiz.questions.length - 1) {
        targetQuiz.currentQuestionIdx += 1;
      } else {
        targetQuiz.isCompleted = true;
      }
      setMessages(updatedMessages);
    };

    return (
      <div className="w-full bg-[#f6f4ee] text-[#1800ad] border-2 border-[#1800ad] rounded-3xl p-4 sm:p-6 mt-3 max-w-full overflow-hidden shadow-md flex flex-col gap-4 font-montserrat">
        <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3 font-montserrat">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center">
              <HelpCircle size={16} />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-[#1800ad] font-montserrat">{payload.title}</h4>
              <p className="text-[10px] text-[#1800ad]/70 font-semibold font-montserrat">AI Generated Adaptive Challenge</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 bg-[#1800ad]/15 text-[#1800ad] rounded-full font-bold font-montserrat">
            {quizState.isCompleted ? "Completed" : `Question ${quizState.currentQuestionIdx + 1} of ${quizState.questions.length}`}
          </span>
        </div>

        {!quizState.isCompleted ? (
          <div className="flex flex-col gap-4 font-montserrat">
            <div className="p-4 bg-[#1800ad]/5 rounded-2xl border border-[#1800ad]/15 text-xs sm:text-sm font-bold leading-relaxed text-[#1800ad] font-montserrat">
              {currentQuestion.question}
            </div>

            <div className="flex flex-col gap-2 font-montserrat">
              {currentQuestion.options.map((option: string, oIdx: number) => {
                const isSelected = currentQuestion.userAnswerIdx === oIdx;
                const isCorrect = oIdx === currentQuestion.correctAnswerIdx;
                const showsFeedback = currentQuestion.userAnswerIdx !== undefined && currentQuestion.userAnswerIdx !== null;
                
                let btnStyle = "bg-[#1800ad]/5 hover:bg-[#1800ad]/10 border-[#1800ad]/20 text-[#1800ad]";
                if (isSelected) {
                  btnStyle = isCorrect ? "bg-emerald-500 text-white border-emerald-500 font-bold" : "bg-rose-500 text-white border-rose-500 font-bold";
                } else if (showsFeedback && isCorrect) {
                  btnStyle = "bg-emerald-500/80 text-white border-emerald-400";
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerSelect(oIdx)}
                    disabled={showsFeedback}
                    className={`p-3.5 sm:p-4 rounded-xl text-left text-xs transition-all border flex items-start gap-2 disabled:cursor-not-allowed font-montserrat ${btnStyle}`}
                  >
                    <span className="font-extrabold uppercase select-none opacity-60 font-montserrat">{String.fromCharCode(65 + oIdx)}.</span>
                    <span className="font-semibold">{option}</span>
                  </button>
                );
              })}
            </div>

            {currentQuestion.userAnswerIdx !== undefined && currentQuestion.userAnswerIdx !== null && (
              <div className={`p-4 rounded-xl text-xs font-semibold font-montserrat ${currentQuestion.userAnswerIdx === currentQuestion.correctAnswerIdx ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                {currentQuestion.userAnswerIdx === currentQuestion.correctAnswerIdx ? currentQuestion.feedbackCorrect : currentQuestion.feedbackIncorrect}
                
                <button 
                  onClick={handleNext}
                  className="mt-3 w-full py-2 bg-[#1800ad] text-[#f6f4ee] hover:bg-[#1800ad]/90 rounded-lg font-extrabold transition-all tracking-wider uppercase text-[10px] font-montserrat"
                >
                  {quizState.currentQuestionIdx < quizState.questions.length - 1 ? "Next Question" : "Complete Challenge"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-[#1800ad]/5 border border-[#1800ad]/15 rounded-2xl gap-4 font-montserrat">
            <div className="w-16 h-16 bg-[#1800ad] text-[#f6f4ee] rounded-full flex items-center justify-center shadow">
              <Award size={32} />
            </div>
            <div>
              <h5 className="font-black text-lg text-[#1800ad] font-montserrat">Quiz Practice Finalized!</h5>
              <p className="text-xs text-[#1800ad]/75 mt-1 font-montserrat">Excellent attempts making continuous progress.</p>
            </div>
            
            <div className="text-4xl font-black text-amber-600 tracking-wider font-montserrat">
              {quizState.score}% <span className="text-xs text-[#1800ad] opacity-60">SCORE</span>
            </div>

            <button
              onClick={() => {
                const updatedMessages = [...messages];
                const quiz = updatedMessages[messageIdx].payload?.quiz;
                if (quiz) {
                  quiz.currentQuestionIdx = 0;
                  quiz.score = 0;
                  quiz.isCompleted = false;
                  quiz.questions.forEach((q: any) => q.userAnswerIdx = null);
                }
                setMessages(updatedMessages);
              }}
              className="flex items-center gap-1 bg-[#1800ad] text-[#f6f4ee] hover:bg-[#1800ad]/90 px-6 py-2.5 rounded-full font-extrabold text-xs uppercase font-montserrat"
            >
              <RotateCcw size={12} /> Retry Assessment
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#f6f4ee] font-montserrat text-[#1800ad] overflow-hidden relative select-none">
      
      {/* Desktop Left Sidebar - same as other student pages */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} active onClick={() => navigate('/student/playground')} />
        </nav>
        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-bold text-lg">P</span>
        </div>
      </aside>

      {/* Main content wrapper - offset for desktop sidebar */}
      <div className="flex flex-col flex-1 md:ml-[80px] lg:ml-[100px] h-[100dvh] overflow-hidden">

      {/* 1. Top Header bar */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-[#f6f4ee] shrink-0 select-none border-b border-[#1800ad]/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/student/home')}
            className="w-8 h-8 rounded-full border border-[#1800ad] flex items-center justify-center hover:bg-[#1800ad]/10 text-[#1800ad] hover:scale-105 active:scale-95 transition-all"
            title="Go Back"
          >
            <ArrowLeft size={15} />
          </button>
          <span className="text-[#1800ad] font-black text-sm sm:text-base tracking-widest font-montserrat uppercase">Interactive Playground</span>
        </div>
        <div className="flex flex-col items-end gap-0.5 select-none">
          <div className="text-[9px] font-black uppercase tracking-wider font-montserrat text-[#1800ad]">
            Quota: <span className="font-black text-[#1800ad]">{quota}/{quotaMax}</span>
          </div>
          <div className="w-16 bg-[#1800ad]/10 h-1 rounded-full overflow-hidden border border-[#1800ad]/15">
            <div className="h-full bg-[#1800ad] rounded-full" style={{ width: `${Math.min((quota / quotaMax) * 100, 100)}%` }}></div>
          </div>
        </div>
      </header>

      {/* Assignment Context Banner */}
      {assignmentContext && (
        <div className="mx-4 md:mx-6 mt-2 px-4 py-2.5 bg-[#1800ad]/10 border border-[#1800ad]/20 rounded-2xl flex items-center justify-between gap-3 font-montserrat">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#1800ad] flex items-center justify-center shrink-0">
              <BookOpen size={12} className="text-[#f6f4ee]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#1800ad]/60 uppercase tracking-wider truncate">{assignmentContext.subject}</p>
              <p className="text-xs font-black text-[#1800ad] truncate">{assignmentContext.assignmentTitle ?? assignmentContext.chapterTitle}</p>
            </div>
          </div>
          <button onClick={handleStartNewSession} className="shrink-0 hover:opacity-70 transition-opacity">
            <X size={14} className="text-[#1800ad]" />
          </button>
        </div>
      )}

      {/* Mobile Drawer Navigation (Collapsible LHS Panel for Sessions) */}
      <AnimatePresence>
        {isMobileHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileHistoryOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            ></motion.div>
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 bottom-0 left-0 w-[320px] bg-[#f6f4ee] border-r border-[#1800ad]/30 text-[#1800ad] p-5 z-50 flex flex-col justify-between font-montserrat"
            >
              {renderUnifiedSidebarContents(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Three-Column Main Arena */}
      <div className="flex-1 flex gap-4 overflow-hidden pt-1 px-3 pb-3 lg:pt-1.5 lg:px-5 lg:pb-5 bg-[#f6f4ee] relative">
        
        {/* ========================================================
            COLUMN 1 (LHS): Unified Previous Sessions & Doubts List
           ======================================================== */}
        {isDesktopHistoryOpen && (
          <section className="hidden lg:flex w-[320px] border-2 border-[#1800ad] rounded-[28px] p-5 flex-col shrink-0 bg-[#f6f4ee] justify-between h-full font-montserrat">
            {renderUnifiedSidebarContents(false)}
          </section>
        )}

        {/* ========================================================
            COLUMN 2 (CENTER): Main Conversational play arena
           ======================================================== */}
        <section className="flex-1 flex flex-col border-2 border-[#1800ad] rounded-[28px] bg-[#f6f4ee] p-4 h-full overflow-hidden relative justify-between font-montserrat">
          
          {/* Unified Chat Header */}
          <div className="border-b border-[#1800ad]/20 pb-3 flex items-center justify-between bg-[#f6f4ee] font-montserrat shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
                className="lg:hidden p-1.5 text-[#1800ad] hover:bg-[#1800ad]/10 transition-all flex items-center justify-center mr-1"
                title="Toggle Sessions History"
              >
                <Menu size={16} />
              </button>
              
              {activeWorkspaceTab === 'mootion' ? (() => {
                const currentSession = chatSessions.find(s => s.id === activeSessionId);
                const titleText = currentSession ? currentSession.title : "Mootion Workspace";
                return (
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[#1800ad] uppercase tracking-wide leading-tight">
                      {titleText.toUpperCase()}
                    </h4>
                    <span className="text-[9px] font-bold text-[#1800ad]/50 uppercase tracking-wider leading-none mt-0.5 block">
                      Mootion AI Conversation
                    </span>
                  </div>
                );
              })() : (() => {
                const selectedDoubt = studentDoubts.find(d => d.doubt_id === selectedDoubtId);
                if (!selectedDoubt) return null;
                const teacherName = selectedDoubt.teacher_name || "Assigned Teacher";
                const subject = selectedDoubt.subject || "Science";
                return (
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[#1800ad] uppercase tracking-wide leading-tight">
                      {(selectedDoubt.topic || selectedDoubt.query_text).toUpperCase()}
                    </h4>
                    <span className="text-[9px] font-bold text-[#1800ad]/50 uppercase tracking-wider leading-none mt-0.5 block">
                      {teacherName} • {subject}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Right side of header: Status badge (if Teacher selected) */}
            {activeWorkspaceTab === 'teacher' && (() => {
              const selectedDoubt = studentDoubts.find(d => d.doubt_id === selectedDoubtId);
              if (!selectedDoubt) return null;
              return getStatusPill(selectedDoubt.status);
            })()}
          </div>

          {activeWorkspaceTab === 'mootion' ? (
            <>
              {/* Active Homework Alert Banner */}
              {teacherAssigned && (
                <div className="bg-[#1800ad]/5 border border-[#1800ad]/20 px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 z-25 mt-2.5 text-[#1800ad]">
                  <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#1800ad]">
                    <AlertCircle size={16} className="text-[#1800ad]" />
                    <span>Scheduled tasks from your teacher are pending!</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => navigate('/student/tasks')}
                      className="px-3 py-1 bg-[#1800ad] text-[#f6f4ee] hover:opacity-90 rounded-full font-black text-[9px] uppercase tracking-wider transition-all"
                    >
                      Start
                    </button>
                    <button 
                      onClick={() => { setTeacherAssigned(false); setTeacherAssignedNew(false); }}
                      className="text-[#1800ad]/50 hover:text-[#1800ad] px-2 py-1 text-[10px] font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className={`flex-1 overflow-y-auto my-3 pr-1.5 flex flex-col gap-4 custom-scrollbar font-montserrat ${quota >= 10 ? 'justify-center items-center' : ''}`}>
                
                {quota >= 10 ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto bg-[#f6f4ee] border-2 border-[#1800ad] rounded-[32px] shadow-lg gap-4 my-auto font-montserrat">
                    <div>
                      <h4 className="font-montserrat text-xs font-black uppercase tracking-wider block mb-1">Playground Quota Reached</h4>
                      <p className="text-xs font-semibold leading-relaxed font-montserrat">
                        You've explored a lot...... and reached your 10 / 10 limit this week! To keep your curiosity thriving, Playground resets next Monday at 8:00 AM UTC.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setQuota(0); setPlaygroundQuota(0); }}
                      className="px-5 py-2.5 bg-[#1800ad] text-[#f6f4ee] hover:opacity-90 rounded-full font-black text-[10px] uppercase tracking-wider transition-all shadow-md mt-1 font-montserrat"
                    >
                      Reset Quota
                    </button>
                  </div>
                ) : (
                  messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#1800ad]/35 gap-2 my-auto font-montserrat">
                      <span className="font-montserrat text-xs font-black tracking-widest text-[#1800ad]/55 uppercase text-center block max-w-md">Start a new science exploration below!</span>
                    </div>
                  ) : (
                    messages.map((m, idx) => (
                      <div key={m.id} className={`flex flex-col gap-1.5 ${m.sender === 'student' ? 'items-end' : 'items-start'}`}>
                        
                        <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest opacity-65 font-montserrat text-[#1800ad]">
                          {m.sender === 'student' ? 'Student Unit' : 'Mootion Engine v1.0'}
                        </div>

                        {m.text && (
                          <div className={`p-4 rounded-[22px] text-xs sm:text-sm font-semibold max-w-[85%] leading-relaxed ${
                            m.sender === 'student' 
                              ? 'bg-[#1800ad] text-[#f6f4ee] rounded-tr-none' 
                              : 'bg-[#f6f4ee] text-[#1800ad] rounded-tl-none border-2 border-[#1800ad]/30'
                          }`}>
                            {m.text === '...' ? (
                              <span className="flex items-center gap-1 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1800ad]/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1800ad]/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1800ad]/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </span>
                            ) : cleanText(m.text)}
                          </div>
                        )}

                        {m.payload && (
                          <div className="w-full max-w-[95%]">
                            {m.payload.type === 'video' && renderVideoCard(m.payload)}
                            {m.payload.type === 'video_loading' && <VideoLoadingCard />}
                            {m.payload.type === 'simulation' && renderSimulationCard(m.payload)}
                            {m.payload.type === 'simulation_loading' && <SimulationLoadingCard payload={m.payload} />}
                            {(m.payload.type === 'universe' || m.payload.type === 'three_d_model') && renderThreeDModelCard(m.payload)}
                            {m.payload.type === 'quiz' && <InteractiveQuizCard payload={m.payload} />}
                            {m.payload.type === 'subject_picker' && renderSubjectPickerCard(m.payload)}
                          </div>
                        )}

                      </div>
                    ))
                  )
                )}

                {isVoiceRecording && (
                  <div className="flex flex-col items-end gap-1.5 select-none">
                    <span className="text-[9px] font-black text-[#1800ad]/60 animate-pulse font-montserrat flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1800ad] animate-ping"></span> Live Capturing...
                    </span>
                    <div className="bg-[#1800ad]/15 rounded-2xl px-5 py-4 flex gap-1 items-end h-11 border border-[#1800ad]/15">
                      {[1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 2, 1].map((h, i) => (
                        <span key={i} className="w-0.5 bg-[#1800ad] rounded-full animate-bounce" style={{ height: `${h * 5}px`, animationDelay: `${i * 0.08}s` }}></span>
                      ))}
                    </div>
                  </div>
                )}

                {isTranscribing && (
                  <div className="flex flex-col items-end gap-1.5 select-none animate-pulse">
                    <span className="text-[9px] font-black text-amber-600 font-montserrat flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span> Gemini Transcribing...
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Form input matched to the custom circle style from screenshot */}
              <div className="pt-3 border-t border-[#1800ad]/20 bg-[#f6f4ee] relative">
                <input 
                  type="file" 
                  id="playground-file-upload" 
                  className="hidden" 
                  accept="image/*,application/pdf,text/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMessages(prev => [
                        ...prev,
                        {
                          id: `msg-attach-${Date.now()}`,
                          sender: 'student',
                          text: `Attached Worksheet: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
                          timestamp: 'Just now'
                        },
                        {
                          id: `msg-mootion-reply-${Date.now()}`,
                          sender: 'mootion',
                          text: `💡 Perfect! I have attached and analyzed '${file.name}'. You can launch simulations or ask questions about this document!`,
                          timestamp: 'Just now'
                        }
                      ]);
                    }
                  }}
                />

                <AnimatePresence>
                  {showCommands && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-1 right-1 bg-[#f6f4ee] border-2 border-[#1800ad] rounded-2xl shadow-2xl overflow-hidden z-30 mb-3 flex flex-col text-xs font-montserrat"
                    >
                      <div className="px-4 py-2 bg-[#1800ad] border-b border-[#1800ad]/10 font-black uppercase text-[9px] tracking-wider text-[#f6f4ee] font-montserrat">
                        Sandbox Commands Menu
                      </div>
                      {COMMAND_OPTIONS.filter(o => o.cmd.startsWith(commandQuery) || commandQuery === '/').map((opt) => (
                        <button
                          key={opt.cmd}
                          onClick={() => selectCommand(opt.cmd)}
                          className="px-4 py-3 text-left font-black text-[#1800ad] hover:bg-[#1800ad]/5 border-b border-[#1800ad]/15 transition-colors flex items-center justify-between font-montserrat"
                        >
                          <span>{opt.cmd}</span>
                          <span className="opacity-70 text-[10px] font-montserrat font-semibold text-[#1800ad]/70">{opt.label}</span>
                        </button>
                      ))}

                      {!textInput.startsWith('/') && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowCommands(false);
                            document.getElementById('playground-file-upload')?.click();
                          }}
                          className="px-4 py-3.5 text-left font-black text-[#1800ad] bg-[#f6f4ee] hover:bg-[#1800ad]/5 transition-all flex items-center justify-between font-montserrat border-t border-[#1800ad]/15"
                        >
                          <span>Normal Upload a file</span>
                          <span className="opacity-70 text-[10px] font-montserrat text-[#1800ad]/70" style={{fontFamily: 'Montserrat'}}>Workspace worksheets or figures</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showSubjectSuggestions && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-1 right-1 bg-[#f6f4ee] border-2 border-[#1800ad] rounded-2xl shadow-2xl overflow-hidden z-30 mb-3 flex flex-col text-xs font-montserrat"
                    >
                      <div className="px-4 py-2 bg-[#1800ad] border-b border-[#1800ad]/10 font-black uppercase text-[9px] tracking-wider text-[#f6f4ee] font-montserrat">
                        Select Class/Subject
                      </div>
                      {joinedClasses
                        .filter(c => c.subject.toLowerCase().includes(subjectQuery) || c.display_name.toLowerCase().includes(subjectQuery))
                        .map((cls) => (
                          <button
                            key={cls.class_id}
                            type="button"
                            onClick={() => selectSubject(cls.subject)}
                            className="px-4 py-3 text-left font-black text-[#1800ad] hover:bg-[#1800ad]/5 border-b border-[#1800ad]/15 transition-colors flex items-center justify-between font-montserrat"
                          >
                            <span>{cls.subject}</span>
                            <span className="opacity-70 text-[10px] font-montserrat font-semibold text-[#1800ad]/70">{cls.display_name}</span>
                          </button>
                        ))}
                      {joinedClasses.filter(c => c.subject.toLowerCase().includes(subjectQuery) || c.display_name.toLowerCase().includes(subjectQuery)).length === 0 && (
                        <div className="px-4 py-3 text-[#1800ad]/50 font-semibold text-center">
                          No matching classes found
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSendMessage} className="flex gap-3 items-center relative">
                  
                  <div className="relative flex-1 flex items-center bg-[#f6f4ee] border-2 border-[#1800ad] rounded-full px-4 py-3.5 shadow-lg">
                    {/* LHS Plus '+' Button inside the input bubble */}
                    <button 
                      type="button"
                      onClick={() => setShowCommands(!showCommands)}
                      className="p-1 hover:bg-[#1800ad]/10 text-[#1800ad] rounded-full transition-all mr-2"
                      title="Summon Commands"
                    >
                      <Plus size={18} />
                    </button>
                    
                    <div className="relative flex-1 min-w-0 flex items-center h-full">
                      <div
                        ref={mirrorDivRef}
                        className="absolute inset-0 pointer-events-none whitespace-pre overflow-hidden flex items-center text-xs sm:text-sm text-[#1800ad] font-semibold font-montserrat select-none px-2"
                        style={{
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }}
                      >
                        {renderHighlightedText(textInput)}
                      </div>
                      <input
                        ref={chatInputRef}
                        type="text"
                        value={textInput}
                        onChange={handleInputChange}
                        onScroll={syncScroll}
                        onKeyUp={syncScroll}
                        onKeyDown={syncScroll}
                        placeholder={isTranscribing ? "Transcribing voice using Gemini..." : "Ask anything..."}
                        disabled={isTranscribing}
                        className="w-full bg-transparent text-xs sm:text-sm text-transparent caret-[#1800ad] placeholder:text-[#1800ad]/40 focus:outline-none font-semibold font-montserrat relative z-10 px-2"
                        style={{
                          caretColor: '#1800ad'
                        }}
                      />
                    </div>

                    {/* RHS Mic trigger inside input bubble */}
                    <button
                      type="button"
                      onClick={toggleChatVoiceRecording}
                      disabled={isTranscribing}
                      className={`p-1 hover:bg-[#1800ad]/10 rounded-full transition-all ml-2 shrink-0 ${isVoiceRecording ? 'text-red-650 animate-pulse bg-red-50 border border-red-200' : 'text-[#1800ad]/60 hover:text-[#1800ad]'}`}
                      title={isVoiceRecording ? "Stop recording" : "Speak live concept query"}
                    >
                      <Mic size={18} />
                    </button>
                  </div>

                  {/* Outside Send arrow circular button */}
                  <button 
                    type="submit" 
                    disabled={!textInput.trim() && quota >= 10}
                    className="bg-[#1800ad] hover:opacity-95 text-[#f6f4ee] rounded-full p-4 hover:scale-[1.03] active:scale-95 transition-all outline-none border border-transparent shadow"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (() => {
            // Find selected doubt
            const selectedDoubt = studentDoubts.find(d => d.doubt_id === selectedDoubtId);
            
            if (!selectedDoubt) {
              // Empty state
              return (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[#1800ad]">
                  <div className="w-20 h-20 bg-[#1800ad]/5 border-2 border-dashed border-[#1800ad]/30 rounded-full flex items-center justify-center text-[#1800ad]/40 mb-4 animate-pulse">
                    <MessageSquare size={36} />
                  </div>
                  <h3 className="font-extrabold text-base uppercase tracking-wider">Ask your teacher anything</h3>
                  <p className="text-xs font-medium text-[#1800ad]/60 max-w-xs leading-relaxed mt-1 mb-5">
                    Start a doubt to get personalized, direct feedback from your class teacher.
                  </p>
                  <button
                    onClick={() => {
                      if (joinedClasses.length > 0) {
                        setNewDoubtClassId(joinedClasses[0].class_id);
                      }
                      setIsNewDoubtModalOpen(true);
                    }}
                    className="px-6 py-3 bg-[#1800ad] hover:opacity-95 text-[#f6f4ee] font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus size={14} /> New Doubt
                  </button>
                </div>
              );
            }

            const isResolved = selectedDoubt.status.toLowerCase() === 'resolved';
            const isResponded = selectedDoubt.status.toLowerCase() === 'responded';
            const messagesList = selectedDoubt.messages || [
              {
                id: 'init',
                sender: 'student',
                text: selectedDoubt.query_text,
                timestamp: 'Just now'
              }
            ];

            return (
              <div className="flex-1 flex flex-col justify-between h-full overflow-hidden mt-3">


                {/* Question Info card if present (attempt description) */}
                {selectedDoubt.tried_before && selectedDoubt.attempt_text && (
                  <div className="mb-3 p-3 bg-amber-50/40 text-amber-900 border border-amber-250/60 rounded-2xl shrink-0 text-left">
                    <span className="text-[8px] font-black uppercase tracking-wider text-amber-800">Your description of what you tried:</span>
                    <p className="text-xs font-medium italic mt-0.5 leading-relaxed">"{selectedDoubt.attempt_text}"</p>
                  </div>
                )}

                {/* Chat Message Bubble History */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 my-2 custom-scrollbar">
                  {messagesList.map((msg: any, mIdx: number) => {
                    const isStudent = msg.sender === 'student';
                    return (
                      <div
                        key={msg.id || mIdx}
                        className={`flex flex-col gap-1 max-w-[80%] ${isStudent ? 'self-end items-end text-right' : 'self-start items-start text-left'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-[#1800ad]/45">
                          <span>{isStudent ? 'You' : 'Teacher'}</span>
                        </div>
                        
                        <div className={`p-3.5 rounded-[22px] text-xs sm:text-sm font-semibold leading-relaxed relative ${
                          isStudent 
                            ? 'bg-[#1800ad] text-[#f6f4ee] rounded-tr-none' 
                            : 'bg-white text-[#1800ad] border-2 border-[#1800ad]/15 rounded-tl-none'
                        }`}>
                          {msg.text}
                          
                          {/* Play voice note inside bubble if present */}
                          {!isStudent && msg.audio_url && (
                            <button
                              type="button"
                              onClick={() => handlePlayAudio(msg.audio_url)}
                              className="mt-2.5 flex items-center gap-1.5 self-start px-3 py-1.5 bg-[#1800ad] text-[#f6f4ee] rounded-full text-[9px] font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
                            >
                              <Play size={10} className="fill-current" /> Play Voice Note
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 mt-0.5 text-[8px] font-bold text-[#1800ad]/40 font-mono">
                          <span>{msg.timestamp || 'Just now'}</span>
                          {isStudent && (
                            <span className="text-emerald-600 font-extrabold tracking-normal">✓✓</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hidden input / Reopen button area if resolved */}
                {isResolved ? (
                  <div className="pt-3 border-t border-[#1800ad]/15 bg-[#f6f4ee] flex flex-col items-center justify-center p-4 rounded-[22px] border-2 border-[#1800ad]/20 gap-3 text-center shrink-0">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                      This doubt has been marked resolved.
                    </span>
                    
                    {showReopenConfirmId === selectedDoubt.doubt_id ? (
                      <div className="flex flex-col gap-2.5 items-center w-full">
                        <span className="text-[10px] font-black uppercase tracking-wider">Do you still need help?</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReopenDoubt(selectedDoubt.doubt_id)}
                            className="px-4 py-2 bg-[#1800ad] text-[#f6f4ee] hover:opacity-90 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all"
                          >
                            Continue Conversation
                          </button>
                          <button
                            onClick={() => setShowReopenConfirmId(null)}
                            className="px-4 py-2 bg-white border border-[#1800ad]/20 text-[#1800ad] font-black uppercase text-[9px] tracking-wider rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReopenConfirmId(selectedDoubt.doubt_id)}
                        className="px-4 py-2.5 bg-white border-2 border-[#1800ad] text-[#1800ad] hover:bg-[#1800ad]/5 font-black uppercase text-[9px] tracking-wider rounded-xl transition-all active:scale-95"
                      >
                        Reopen Doubt
                      </button>
                    )}
                  </div>
                ) : (
                  /* Bottom Chat Input Form */
                  <div className="pt-3 border-t border-[#1800ad]/15 bg-[#f6f4ee] flex flex-col gap-1.5 shrink-0">
                    {/* Recording alert indicators */}
                    {isFollowUpRecording[selectedDoubt.doubt_id] && (
                      <div className="text-[9px] text-red-600 font-bold animate-pulse px-4 select-none flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-650 animate-ping"></span> Recording follow-up audio... Click mic again to send text.
                      </div>
                    )}
                    {isTranscribing && (
                      <div className="text-[9px] text-amber-600 font-bold animate-pulse px-4 select-none flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span> Gemini transcribing voice note...
                      </div>
                    )}
                    
                    <form
                      onSubmit={(e) => { e.preventDefault(); handleSendFollowUp(selectedDoubt.doubt_id); }}
                      className="flex gap-3 items-center"
                    >
                      <div className="flex-1 flex items-center bg-[#f6f4ee] border-2 border-[#1800ad] rounded-2xl px-3.5 py-2">
                        {/* Hidden file input for Attachments */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => handleAttachmentUpload(e, selectedDoubt.doubt_id)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[#1800ad]/60 hover:text-[#1800ad] transition-all p-1 hover:bg-[#1800ad]/5 rounded-full shrink-0 mr-1.5"
                          title="Attach document/screenshot"
                        >
                          <Paperclip size={16} />
                        </button>
                        
                        <input
                          type="text"
                          value={followUpTexts[selectedDoubt.doubt_id] || ''}
                          onChange={(e) => setFollowUpTexts(prev => ({ ...prev, [selectedDoubt.doubt_id]: e.target.value }))}
                          placeholder={isTranscribing ? "Gemini voice transcription in progress..." : "Type your follow-up message..."}
                          disabled={submittingFollowUpIds[selectedDoubt.doubt_id] || isTranscribing}
                          className="w-full bg-transparent text-xs sm:text-sm text-[#1800ad] placeholder:text-[#1800ad]/40 focus:outline-none font-semibold"
                        />
                        
                        <button
                          type="button"
                          onClick={() => toggleFollowUpVoiceRecording(selectedDoubt.doubt_id)}
                          disabled={submittingFollowUpIds[selectedDoubt.doubt_id] || isTranscribing}
                          className={`p-1 hover:bg-[#1800ad]/10 rounded-full transition-all ml-1.5 shrink-0 ${
                            isFollowUpRecording[selectedDoubt.doubt_id] 
                              ? 'text-red-650 animate-pulse bg-red-50 border border-red-250' 
                              : 'text-[#1800ad]/60 hover:text-[#1800ad]'
                          }`}
                          title="Record and transcribe speech"
                        >
                          <Mic size={16} />
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingFollowUpIds[selectedDoubt.doubt_id] || !(followUpTexts[selectedDoubt.doubt_id] || '').trim() || isTranscribing}
                        className="bg-[#1800ad] hover:opacity-95 text-[#f6f4ee] rounded-full p-3.5 hover:scale-[1.03] active:scale-95 transition-all outline-none border border-transparent shadow shrink-0 disabled:opacity-40"
                      >
                        <Send size={16} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })()}

        </section>

        {/* ========================================================
            COLUMN 3 (RHS): Large Custom 4-Card Selector Grid from mockup
           ======================================================== */}
        <section className="hidden xl:flex w-[320px] border-2 border-[#1800ad] rounded-[28px] p-6 flex-col shrink-0 bg-[#f6f4ee] justify-between h-full font-montserrat">
          
          <div className="select-none bg-[#f6f4ee] font-montserrat">
            <h3 className="font-extrabold text-xl text-[#1800ad] uppercase tracking-wider font-montserrat">Output Protocol</h3>
            <p className="text-[10px] text-[#1800ad]/50 font-semibold tracking-wide uppercase mt-1 font-montserrat">Select trigger format</p>
          </div>

          {/* 2x2 grid selector cards from mockup */}
          <div className="grid grid-cols-2 gap-4 my-auto select-none font-montserrat">
            
          {/* Cell 1: Storyboard */}
            <button
              onClick={() => {
                const newVal = '/video ';
                setTextInput(newVal);
                focusAndMoveCursorToEnd(newVal);
              }}
              className="aspect-square border border-[#1800ad]/20 rounded-3xl bg-transparent hover:bg-[#1800ad]/5 flex flex-col items-center justify-center p-3 text-center transition-all group relative duration-300 hover:scale-[1.02] font-montserrat"
            >
              <div className="w-12 h-12 rounded-full bg-[#1800ad]/5 border border-[#1800ad]/20 flex items-center justify-center text-[#1800ad] group-hover:bg-[#1800ad]/10 transition-all mb-3 shadow-sm">
                <Film size={22} className="stroke-[1.5]" />
              </div>
              <span className="text-[11px] font-black uppercase text-[#1800ad] font-montserrat tracking-wider">Storyboard</span>
            </button>
 
            {/* Cell 2: Interactive Quiz */}
            <button
              onClick={() => {
                setTextInput('/quiz');
                setTimeout(() => handleSendMessage(), 100);
              }}
              className="aspect-square border border-[#1800ad]/20 rounded-3xl bg-transparent hover:bg-[#1800ad]/5 flex flex-col items-center justify-center p-3 text-center transition-all group relative duration-300 hover:scale-[1.02] font-montserrat"
            >
              <div className="w-12 h-12 rounded-full bg-[#1800ad]/5 border border-[#1800ad]/20 flex items-center justify-center text-[#1800ad] group-hover:bg-[#1800ad]/10 transition-all mb-3 shadow-sm">
                <HelpCircle size={22} className="stroke-[1.5]" />
              </div>
              <span className="text-[11px] font-black uppercase text-[#1800ad] font-montserrat tracking-wider">Interactive Quiz</span>
            </button>
 
            {/* Cell 3: Playground */}
            <button
              onClick={() => {
                const newVal = '/simulation ';
                setTextInput(newVal);
                focusAndMoveCursorToEnd(newVal);
              }}
              className="aspect-square border border-[#1800ad]/20 rounded-3xl bg-transparent hover:bg-[#1800ad]/5 flex flex-col items-center justify-center p-3 text-center transition-all group relative duration-300 hover:scale-[1.02] font-montserrat"
            >
              <div className="w-12 h-12 rounded-full bg-[#1800ad]/5 border border-[#1800ad]/20 flex items-center justify-center text-[#1800ad] group-hover:bg-[#1800ad]/10 transition-all mb-3 shadow-sm">
                <Layers size={22} className="stroke-[1.5]" />
              </div>
              <span className="text-[11px] font-black uppercase text-[#1800ad] font-montserrat tracking-wider">Playground</span>
            </button>
 
            {/* Cell 4: Universe */}
            <button
              onClick={() => {
                const newVal = '/universe ';
                setTextInput(newVal);
                focusAndMoveCursorToEnd(newVal);
              }}
              className="aspect-square border border-[#1800ad]/20 rounded-3xl bg-transparent hover:bg-[#1800ad]/5 flex flex-col items-center justify-center p-3 text-center transition-all group relative duration-300 hover:scale-[1.02] font-montserrat"
            >
              <div className="w-12 h-12 rounded-full bg-[#1800ad]/5 border border-[#1800ad]/20 flex items-center justify-center text-[#1800ad] group-hover:bg-[#1800ad]/10 transition-all mb-3 shadow-sm">
                <Volume2 size={22} className="stroke-[1.5]" />
              </div>
              <span className="text-[11px] font-black uppercase text-[#1800ad] font-montserrat tracking-wider">Universe</span>
            </button>
 
          </div>

        </section>

      </div>

      </div>{/* end main content wrapper */}

      {/* Ask a New Doubt Modal */}
      <AnimatePresence>
        {isNewDoubtModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewDoubtModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
            ></motion.div>
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-[#f6f4ee] border-2 border-[#1800ad] rounded-[32px] p-6 z-55 flex flex-col gap-4 font-montserrat shadow-2xl text-[#1800ad]"
            >
              <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3">
                <span className="font-black text-sm uppercase tracking-widest">Ask a New Doubt</span>
                <button
                  type="button"
                  onClick={() => setIsNewDoubtModalOpen(false)}
                  className="p-1 hover:bg-[#1800ad]/10 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateNewDoubt} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60">Select Class</label>
                  <select
                    value={newDoubtClassId}
                    onChange={(e) => setNewDoubtClassId(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#1800ad] rounded-2xl text-xs sm:text-sm text-[#1800ad] font-bold outline-none"
                  >
                    {joinedClasses.map((cls) => (
                      <option key={cls.class_id} value={cls.class_id}>
                        {cls.subject} - {cls.grade} ({cls.display_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60">Topic</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Current"
                    value={newDoubtTopic}
                    onChange={(e) => setNewDoubtTopic(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#1800ad] rounded-2xl text-xs sm:text-sm text-[#1800ad] placeholder:text-[#1800ad]/40 focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60">Describe your doubt</label>
                  <div className="relative">
                    <textarea
                      required
                      rows={4}
                      placeholder="Type details of what you don't understand..."
                      value={newDoubtDescription}
                      onChange={(e) => setNewDoubtDescription(e.target.value)}
                      className="w-full p-3 pr-10 bg-white border-2 border-[#1800ad] rounded-2xl text-xs sm:text-sm text-[#1800ad] placeholder:text-[#1800ad]/40 focus:outline-none font-semibold resize-none"
                    />
                    <button
                      type="button"
                      onClick={toggleModalVoiceRecording}
                      disabled={isTranscribing}
                      className={`absolute right-3 bottom-3 p-1.5 rounded-full transition-all border ${
                        isModalVoiceRecording 
                          ? 'text-white bg-red-650 border-red-700 animate-pulse bg-red-50' 
                          : 'text-[#1800ad]/60 border-transparent hover:bg-[#1800ad]/10'
                      }`}
                      title={isModalVoiceRecording ? "Stop recording" : "Record description"}
                    >
                      <Mic size={16} />
                    </button>
                  </div>
                  {isTranscribing && (
                    <span className="text-[9px] text-amber-700 italic font-semibold animate-pulse">
                      Gemini is transcribing voice...
                    </span>
                  )}
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDoubtModalOpen(false)}
                    className="px-4 py-2 bg-white border border-[#1800ad] text-[#1800ad] font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-[#1800ad]/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDoubt || isTranscribing || isModalVoiceRecording}
                    className="px-5 py-2 bg-[#1800ad] text-[#f6f4ee] font-black uppercase text-[10px] tracking-wider rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {isSubmittingDoubt ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Start New Conversation Modal */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewChatModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 animate-fade-in"
            ></motion.div>
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto max-w-md h-fit bg-[#f6f4ee] border-2 border-[#1800ad] rounded-[32px] p-6 z-55 flex flex-col gap-4 font-montserrat shadow-2xl text-[#1800ad]"
            >
              <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3">
                <span className="font-black text-sm uppercase tracking-widest">Start New Conversation</span>
                <button
                  type="button"
                  onClick={() => setIsNewChatModalOpen(false)}
                  className="p-1 hover:bg-[#1800ad]/10 rounded-full"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newChatTopic.trim()) return;
                  
                  await createNewChat({}, newChatTopic.trim());
                  
                  setMessages([
                    {
                      id: `msg-${Date.now()}`,
                      sender: 'mootion',
                      text: `Let's explore ${newChatTopic.trim()}! Type "/" to summon virtual tools: video narrations, 3D orbits, sandbox simulations, or custom quizzes.`,
                      timestamp: 'Just now'
                    }
                  ]);
                  setIsNewChatModalOpen(false);
                }}
                className="flex flex-col gap-3.5"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60">What would you like to learn?</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electric Current"
                    value={newChatTopic}
                    onChange={(e) => setNewChatTopic(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#1800ad] rounded-2xl text-xs sm:text-sm text-[#1800ad] placeholder:text-[#1800ad]/40 focus:outline-none font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/60">Examples:</span>
                  <div className="flex flex-wrap gap-2">
                    {['Electricity', 'Atoms', 'Gravity', 'Photosynthesis'].map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setNewChatTopic(ex)}
                        className="px-3.5 py-1.5 bg-white border border-[#1800ad]/20 hover:border-[#1800ad] rounded-xl text-xs font-bold text-[#1800ad] transition-all active:scale-95"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewChatModalOpen(false)}
                    className="px-4 py-2 bg-white border border-[#1800ad] text-[#1800ad] font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-[#1800ad]/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1800ad] text-[#f6f4ee] font-black uppercase text-[10px] tracking-wider rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
                  >
                    Start
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
