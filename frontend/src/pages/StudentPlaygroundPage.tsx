import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  getStoredTasks, 
  getPlaygroundQuota, 
  incrementPlaygroundQuota, 
  setPlaygroundQuota, 
  getTeacherAssignedNew, 
  setTeacherAssignedNew 
} from '../data/taskStore';
import { NavItem } from '../components/NavItem';

interface ChatMessage {
  id: string;
  sender: 'student' | 'mootion';
  text: string;
  timestamp: string;
  commandExecuted?: string;
  payload?: {
    type: 'video' | 'simulation' | 'universe' | 'quiz';
    title: string;
    // Specific metadata
    video?: {
      storyboard: { step: number; title: string; description: string; duration: string; illustration: string }[];
      topic: string;
      chapters: string[];
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

export function StudentPlaygroundPage() {
  const navigate = useNavigate();

  // State Management
  const [tasks, setTasks] = useState(() => getStoredTasks());
  const [quota, setQuota] = useState(() => getPlaygroundQuota());
  const [teacherAssigned, setTeacherAssigned] = useState(() => getTeacherAssignedNew());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false); // Mobile LHS panel
  const [isDesktopHistoryOpen, setIsDesktopHistoryOpen] = useState(true); // Desktop LHS panel toggle
  const [textInput, setTextInput] = useState('');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [chatSessions, setChatSessions] = useState<PreSavedSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState('');
  const [hiddenSummoners, setHiddenSummoners] = useState<string[]>([]);

  // Conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Command selections
  const COMMAND_OPTIONS = [
    { cmd: '/video', label: 'Generate educational video storyboard' },
    { cmd: '/simulation', label: 'Create an interactive physics sandbox' },
    { cmd: '/universe', label: 'Explore a 3D orbital interactive system' },
    { cmd: '/quiz', label: 'Attempt unlimited custom concept practices' },
    { cmd: '/ask_teacher', label: 'Ask a direct question to your teacher' },
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

    if (val.startsWith('/') && !val.includes(' ')) {
      setShowCommands(true);
      setCommandQuery(val.toLowerCase());
    } else {
      setShowCommands(false);
    }
  };

  const selectCommand = (cmd: string) => {
    setTextInput(cmd + ' ');
    setShowCommands(false);
    chatInputRef.current?.focus();
  };

  const triggerTeacherSimulateToggle = () => {
    const nextVal = !teacherAssigned;
    setTeacherAssigned(nextVal);
    setTeacherAssignedNew(nextVal);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim()) return;

    if (quota >= 10) {
      // Prompt quota exhausted warning
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
          text: '⚠️ Playground quota used up. You reached 10 / 10 generations this week! To keep your curiosity thriving, Playground resets next Monday at 8:00 AM UTC.',
          timestamp: 'Just now'
        }
      ]);
      setTextInput('');
      return;
    }

    const userInput = textInput.trim();
    setTextInput('');
    setShowCommands(false);

    // Save message from student
    const studentMsgId = `msg-usr-${Date.now()}`;
    const newStudentMsg: ChatMessage = {
      id: studentMsgId,
      sender: 'student',
      text: userInput,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, newStudentMsg]);

    const normalizedInput = userInput.toLowerCase();

    // Intercept Ask Teacher command
    const isAskTeacher = normalizedInput.startsWith('/ask_teacher') || normalizedInput.includes('ask_teacher');
    if (isAskTeacher) {
      let queryText = userInput;
      if (userInput.startsWith('/ask_teacher ')) {
        queryText = userInput.substring(13).trim();
      } else if (userInput.includes('ask_teacher')) {
        queryText = userInput.replace(/ask_teacher/gi, '').replace(/\//g, '').trim();
      }
      if (!queryText) {
        queryText = "Why does water boil at a lower temperature at high altitudes?";
      }

      const doubtsRaw = localStorage.getItem('mootion_doubts_store');
      let currentStore: any[] = [];
      if (doubtsRaw) {
        try {
          currentStore = JSON.parse(doubtsRaw);
        } catch (e) {}
      } else {
        currentStore = [
          {
            id: "doubt-1",
            studentName: "Poorvika Patel",
            grade: "Class 8",
            subject: "Physics",
            topicTitle: "Electromagnetic Induction & Flux laws",
            doubtText: "Why does the current oppose the magnet movement inside Lentz law? Shouldn't it pull it closer?",
            generatedAnswer: "Lentz law indicates induced current opposes the flux shift to uphold energy conservation. If it pulled closer, it would produce free perpetual velocity energy!",
            status: "pending",
            timestamp: "10:15 AM",
            messages: [
              { id: "m1", sender: "student", text: "Why does the current oppose the magnet movement inside Lentz law? Shouldn't it pull it closer?", timestamp: "10:15 AM" },
              { id: "m2", sender: "ai", text: "Lentz law indicates induced current opposes the flux shift to uphold energy conservation. If it pulled closer, it would produce free perpetual velocity energy!", timestamp: "10:16 AM" }
            ]
          },
          {
            id: "doubt-2",
            studentName: "Aarav Sharma",
            grade: "Class 8",
            subject: "Physics",
            topicTitle: "Surface Asperities & Friction lock-ups",
            doubtText: "How do we spot which terminal becomes positive when moving a bar through a circular solenoid?",
            generatedAnswer: "Apply Faraday's right hand screw indicator. Wrap your fingers towards current flow and your thumb points north.",
            status: "pending",
            timestamp: "Yesterday",
            messages: [
              { id: "m3", sender: "student", text: "How do we spot which terminal becomes positive when moving a bar through a circular solenoid?", timestamp: "Yesterday" }
            ]
          }
        ];
      }

      const newDoubtId = `doubt-live-${Date.now()}`;
      currentStore.push({
        id: newDoubtId,
        studentName: 'Aarav Sharma',
        grade: 'Class 8',
        subject: 'Physics',
        topicTitle: 'Student Playground Inquiry',
        doubtText: queryText,
        generatedAnswer: 'Wait for teacher response.',
        status: 'pending',
        timestamp: 'Just now',
        messages: [
          {
            id: `msg-inner-1-${Date.now()}`,
            sender: 'student',
            text: queryText,
            timestamp: 'Just now'
          }
        ]
      });
      localStorage.setItem('mootion_doubts_store', JSON.stringify(currentStore));

      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-ask-receipt-${Date.now()}`,
            sender: 'mootion',
            text: `📤 **Doubt Dispatched to Teacher!**\n\nYour question: *"${queryText}"* has been added directly to your teacher's doubts dashboard.\n\nWhen your teacher types a reply, their custom response will dynamically sync and output here!`,
            timestamp: 'Just now'
          }
        ]);
      }, 700);
      return;
    }

    // Increment quota usage
    const nextQuota = incrementPlaygroundQuota();
    setQuota(nextQuota);

    // If none of the options (video, simulation, sandbox, quiz, practice, assessment) are selected or matched, respond to users query via text using Gemini!
    const isVideo = normalizedInput.startsWith('/video') || normalizedInput.includes('video') || normalizedInput.includes('storyboard');
    const isSim = normalizedInput.startsWith('/simulation') || normalizedInput.includes('simulation') || normalizedInput.includes('sandbox') || normalizedInput.includes('buoyancy');
    const isQuiz = normalizedInput.startsWith('/quiz') || normalizedInput.includes('quiz') || normalizedInput.includes('practice') || normalizedInput.includes('assessment');
    const isUniverse = normalizedInput.startsWith('/universe') || normalizedInput.includes('universe') || normalizedInput.includes('orbital') || normalizedInput.includes(' orbits');

    if (!isVideo && !isSim && !isQuiz && !isUniverse) {
      // Fallback: Real-time Gemini Response via server-side chat proxy
      const loadingMsgId = `msg-ai-loading-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: loadingMsgId,
          sender: 'mootion',
          text: '...',
          timestamp: 'Just now'
        }
      ]);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          context: 'The user is a physics/chemistry student in the science playground. Assist them in an encouraging, highly educational tone.'
        })
      })
      .then(res => {
        if (!res.ok) throw new Error("Network response error");
        return res.json();
      })
      .then(data => {
        setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
          ...m,
          text: data.text || `💡 No details found. Let's work on "${userInput}" together!`
        } : m));
      })
      .catch(err => {
        console.error("Gemini fallback text error:", err);
        setMessages(prev => prev.map(m => m.id === loadingMsgId ? {
          ...m,
          text: `💡 I understand you're curious about *"${userInput}"*! Let's explore. Type **/video**, **/simulation**, or **/quiz** to summon dedicated sandbox utilities immediately!`
        } : m));
      });
      return;
    }

    // Quiz: async Gemini fetch — handle separately with early return
    if (isQuiz) {
      const loadingMsgId = `msg-quiz-loading-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: loadingMsgId,
          sender: 'mootion',
          text: '...',
          timestamp: 'Just now'
        }
      ]);

      let topic = "General Science";
      if (userInput.startsWith('/quiz ')) {
        topic = userInput.substring(6).trim();
      } else if (normalizedInput.includes('quiz')) {
        topic = userInput.replace(/quiz/gi, '').replace(/practice/gi, '').replace(/assessment/gi, '').replace(/\//g, '').trim() || "General Science";
      }

      fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: 'Science', topic: topic, questionCount: 5 })
      })
      .then(res => res.json())
      .then(data => {
        const rawQs = data.questions || [];
        const mappedQs = rawQs.slice(0, 5).map((q: any, i: number) => ({
          id: i + 1,
          question: q.questionText || q.question || `Question ${i + 1}`,
          options: q.options || [],
          correctAnswerIdx: q.options ? q.options.indexOf(q.correctAnswer) : 0,
          feedbackCorrect: q.explanation || 'Correct!',
          feedbackIncorrect: q.explanation || 'Not quite — review this concept!'
        }));

        const quizMsg: ChatMessage = {
          id: `msg-quiz-${Date.now()}`,
          sender: 'mootion',
          text: `Your 5-question quiz on **${topic}** is ready. You have 10 seconds per question:`,
          timestamp: 'Just now',
          payload: {
            type: 'quiz',
            title: `${topic} Quiz`,
            quiz: { currentQuestionIdx: 0, score: 0, isCompleted: false, questions: mappedQs }
          }
        };
        setMessages(prev => prev.map(m => m.id === loadingMsgId ? quizMsg : m));
      })
      .catch(() => {
        const fallbackMsg: ChatMessage = {
          id: `msg-quiz-${Date.now()}`,
          sender: 'mootion',
          text: `Your quiz on **${topic}** is ready:`,
          timestamp: 'Just now',
          payload: {
            type: 'quiz',
            title: `${topic} Quiz`,
            quiz: {
              currentQuestionIdx: 0, score: 0, isCompleted: false,
              questions: [
                { id: 1, question: 'If all net external forces on a moving object cancel to zero, what happens?', options: ['It stops immediately.', 'It continues at constant velocity.', 'It accelerates.', 'It reverses direction.'], correctAnswerIdx: 1, feedbackCorrect: 'Correct! Newton\'s First Law.', feedbackIncorrect: 'Recall Newton\'s First Law: no net force = constant velocity.' },
                { id: 2, question: 'Which quantity is directly proportional to acceleration (F=ma)?', options: ['Friction', 'Drag', 'Net Force', 'Viscosity'], correctAnswerIdx: 2, feedbackCorrect: 'Correct! F = ma.', feedbackIncorrect: 'Net Force is proportional to acceleration by F = ma.' },
                { id: 3, question: 'What is the unit of force in SI?', options: ['Joule', 'Watt', 'Newton', 'Pascal'], correctAnswerIdx: 2, feedbackCorrect: 'Correct! Force is measured in Newtons.', feedbackIncorrect: 'Force is measured in Newtons (N).' },
                { id: 4, question: 'Objects submerged in fluid experience which upward force?', options: ['Gravity', 'Buoyancy', 'Tension', 'Normal'], correctAnswerIdx: 1, feedbackCorrect: 'Correct! Buoyancy = Archimedes principle.', feedbackIncorrect: 'Buoyancy is the upward force in fluids.' },
                { id: 5, question: 'An object with density greater than water will?', options: ['Float', 'Hover', 'Sink', 'Dissolve'], correctAnswerIdx: 2, feedbackCorrect: 'Correct! Denser objects sink.', feedbackIncorrect: 'Objects denser than water sink.' }
              ]
            }
          }
        };
        setMessages(prev => prev.map(m => m.id === loadingMsgId ? fallbackMsg : m));
      });
      return;
    }

    // Generate responsive AI response (video, simulation, universe)
    setTimeout(() => {
      let aiResponse: ChatMessage;

      if (isVideo) {
        let topic = "Physical Forces";
        if (userInput.startsWith('/video ')) {
          topic = userInput.substring(7).trim();
        } else if (normalizedInput.includes('video')) {
          topic = userInput.replace(/video/gi, '').replace(/\//g, '').trim() || "Physical Forces";
        }
        aiResponse = {
          id: `msg-ai-${Date.now()}`,
          sender: 'mootion',
          text: `🎬 I've synthesized a custom Explainer Video on **${topic}** for you! Unlocked from your physics curriculum:`,
          timestamp: 'Just now',
          payload: {
            type: 'video',
            title: `Explainer Video: ${topic}`,
            video: {
              topic: topic,
              chapters: ['Concept Introduction', 'Real-world Demonstrations', 'Active Variables Analysis'],
              storyboard: [
                { step: 1, title: 'Concept Introduction', description: 'Brief introduction to key variables and initial state formulas.', duration: '0:35', illustration: '🎬' }
              ]
            }
          }
        };
      } 
      else if (isSim) {
        let topic = "Forces & Motion Sandbox";
        if (userInput.startsWith('/simulation ')) {
          topic = userInput.substring(12).trim();
        } else if (normalizedInput.includes('simulation')) {
          topic = userInput.replace(/simulation/gi, '').replace(/sandbox/gi, '').replace(/\//g, '').trim() || "Forces & Motion";
        }
        aiResponse = {
          id: `msg-ai-${Date.now()}`,
          sender: 'mootion',
          text: `🔬 Active learning module synchronized! Launching the interactive virtual simulation representing **${topic}**:`,
          timestamp: 'Just now',
          payload: {
            type: 'simulation',
            title: topic,
            simulation: {
              objectDensity: 450,
              fluidDensity: 1000,
              objectVolume: 0.15
            }
          }
        };
      } 
      else {
        // Universe orbital system
        aiResponse = {
          id: `msg-ai-${Date.now()}`,
          sender: 'mootion',
          text: "Exploring Orbitals! I've loaded your **Atomic & Cosmic Planetary System visualizer** in the conversation viewport.",
          timestamp: 'Just now',
          payload: {
            type: 'universe',
            title: 'Orbital Universe Visualizer',
            universe: {
              subject: 'Physics / Chemistry',
              systemType: normalizedInput.includes('atom') ? 'atom' : 'solar'
            }
          }
        };
      }

      setMessages(prev => [...prev, aiResponse]);
    }, 600);
  };

  // Simulated Voice triggers
  const startSpeechSimulation = () => {
    setIsVoiceRecording(true);
    // Simulate user completes speech in 2.5 seconds
    setTimeout(() => {
      setIsVoiceRecording(false);
      setTextInput("Show me buoyancy force simulation");
    }, 2000);
  };

  const handlePreSessionOpen = (sess: PreSavedSession) => {
    setActiveSessionId(sess.id);
    
    // Simulate reloading appropriate messages for the session
    if (sess.id === 'sess-1') {
      setMessages([
        {
          id: 'msg-s1-1',
          sender: 'mootion',
          text: 'Active Buoyant Forces workspace re-loaded. Click the interactive simulation below to test block displacement!',
          timestamp: 'Just now',
          payload: {
            type: 'simulation',
            title: 'Displacement Lab Sandbox',
            simulation: { objectDensity: 300, fluidDensity: 1000, objectVolume: 0.12 }
          }
        }
      ]);
    } else if (sess.id === 'sess-2') {
      setMessages([
        {
          id: 'msg-s2-1',
          sender: 'mootion',
          text: 'Atomic orbits session resumed. Explore electrons revolving on rings dynamic orbital speeds.',
          timestamp: 'Just now',
          payload: {
            type: 'universe',
            title: 'Modern Shell Model',
            universe: { subject: 'Chemistry', systemType: 'atom' }
          }
        }
      ]);
    } else {
      setMessages([
        {
          id: 'msg-s3-1',
          sender: 'mootion',
          text: 'Custom Video explanation ready. Click the chapters below:',
          timestamp: 'Just now',
          payload: {
            type: 'video',
            title: 'Keplerian Gravity Acceleration Storyboard',
            video: {
              topic: 'Gravitation orbits',
              chapters: ['Concept', 'Simulation Demo', 'Speed Variation'],
              storyboard: [
                { step: 1, title: 'Inward Pull Grid', description: 'Heavy massive planets distort orbital grid meshes.', duration: '0:35', illustration: 'Grid' },
                { step: 2, title: 'Velocity Acceleration', description: 'Planet orbits speed up near perihelion points.', duration: '0:50', illustration: 'Orbit' }
              ]
            }
          }
        }
      ]);
    }
    setIsMobileHistoryOpen(false);
  };

  const handleStartNewSession = () => {
    const newId = `sess-${Date.now()}`;
    const newSess: PreSavedSession = {
      id: newId,
      title: '✨ New Explorer Topic',
      lastMsg: 'Waiting for custom sandbox commands...',
      timestamp: 'Just now'
    };
    setChatSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newId);
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'mootion',
        text: 'What concept are we exploring? Type "/" to summon virtual tools: video narrations, 3D orbits, sandbox simulations, or custom quizzes.',
        timestamp: 'Just now'
      }
    ]);
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
            src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
            controls 
            className="w-full h-full object-cover"
            poster="https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
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

    const phetUrl = getPhETUrl(topicTitle);

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
        <div className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
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
            Quota: <span className="font-black text-[#1800ad]">{quota}/10</span>
          </div>
          <div className="w-16 bg-[#1800ad]/10 h-1 rounded-full overflow-hidden border border-[#1800ad]/15">
            <div className="h-full bg-[#1800ad] rounded-full" style={{ width: `${(quota / 10) * 100}%` }}></div>
          </div>
        </div>
      </header>

      {/* 2. Responsive Drawers */}
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
              className="lg:hidden fixed top-0 bottom-0 left-0 w-[280px] bg-[#f6f4ee] border-r border-[#1800ad]/30 text-[#1800ad] p-5 z-50 flex flex-col justify-between font-montserrat"
            >
              <div className="flex flex-col h-full gap-4 font-montserrat">
                <div className="flex items-center justify-between pb-3 border-b border-[#1800ad]/20 font-montserrat">
                  <span className="font-extrabold text-[#1800ad] uppercase tracking-widest text-[11px] font-montserrat">Sessions & History</span>
                  <button onClick={() => setIsMobileHistoryOpen(false)} className="p-1 hover:bg-[#1800ad]/10 rounded-full text-[#1800ad]">
                    <X size={18} />
                  </button>
                </div>

                <button 
                  onClick={() => { handleStartNewSession(); setIsMobileHistoryOpen(false); }}
                  className="w-full bg-[#f6f4ee] text-[#1800ad] hover:bg-[#1800ad]/5 py-3 px-4 rounded-full font-black text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 border border-[#1800ad] font-montserrat"
                >
                  <Plus size={16} /> New Explorer Chat
                </button>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 mt-2 font-montserrat">
                  {chatSessions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[#1800ad]/30 gap-2 font-montserrat">
                      <span className="font-montserrat text-[10px] font-black">NO_CHATS_FOUND</span>
                    </div>
                  ) : (
                    chatSessions.map((sess) => (
                      <button
                        key={sess.id}
                        onClick={() => { handlePreSessionOpen(sess); setIsMobileHistoryOpen(false); }}
                        className={`p-3.5 rounded-2xl text-left transition-all border font-montserrat ${
                          activeSessionId === sess.id 
                            ? 'bg-[#1800ad] text-[#f6f4ee] border-transparent font-black shadow-md font-montserrat' 
                            : 'bg-transparent border-[#1800ad]/15 hover:bg-[#1800ad]/5 text-[#1800ad] font-montserrat'
                        }`}
                      >
                        <div className="font-extrabold truncate text-xs uppercase font-montserrat">{sess.title}</div>
                        <div className={`text-[10px] truncate mt-1 font-montserrat ${activeSessionId === sess.id ? 'text-[#f6f4ee]/75' : 'text-[#1800ad]/60'}`}>
                          {sess.lastMsg}
                        </div>
                        <div className={`text-[9px] font-montserrat mt-1 text-right ${activeSessionId === sess.id ? 'text-[#f6f4ee]/50' : 'text-[#1800ad]/40'}`}>
                          {sess.timestamp}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. Three-Column Main Arena */}
      <div className="flex-1 flex gap-4 overflow-hidden pt-1 px-3 pb-3 lg:pt-1.5 lg:px-5 lg:pb-5 bg-[#f6f4ee] relative">
        
        {/* ========================================================
            COLUMN 1 (LHS): Previous Sessions List & Controls
           ======================================================== */}
        {isDesktopHistoryOpen && (
          <section className="hidden lg:flex w-[285px] border-2 border-[#1800ad] rounded-[28px] p-5 flex-col shrink-0 bg-[#f6f4ee] justify-between h-full font-montserrat">
            <div className="flex flex-col h-full font-montserrat">
              
              <div className="flex flex-col gap-4 font-montserrat">
                <div className="flex items-center justify-between border-b border-[#1800ad]/20 pb-3 font-montserrat">
                  <span className="font-black text-xs text-[#1800ad] uppercase tracking-widest font-montserrat">Sessions & History</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1800ad] animate-pulse"></span>
                </div>

                {/* Solid pillow NEW CHAT button matching neon shape from screenshot */}
                <button 
                  onClick={handleStartNewSession}
                  className="w-full bg-[#f6f4ee] hover:bg-[#1800ad]/5 text-[#1800ad] uppercase font-montserrat font-black text-xs py-4 rounded-[18px] transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 border-2 border-[#1800ad] tracking-wider"
                >
                  <Plus size={16} /> New Chat
                </button>

                {/* Chat List list / NO_CHATS_FOUND */}
                <div className="flex flex-col gap-2.5 mt-2 max-h-[500px] overflow-y-auto custom-scrollbar font-montserrat">
                  {chatSessions.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-[#1800ad]/30 gap-2 select-none font-montserrat">
                      <span className="font-montserrat text-xs font-black tracking-widest">NO_CHATS_FOUND</span>
                    </div>
                  ) : (
                    chatSessions.map((sess) => (
                      <button
                        key={sess.id}
                        onClick={() => handlePreSessionOpen(sess)}
                        className={`p-3.5 rounded-2xl text-left transition-all border text-xs flex flex-col gap-1 relative overflow-hidden font-montserrat ${
                          activeSessionId === sess.id 
                            ? 'bg-[#1800ad] border-transparent text-[#f6f4ee] font-extrabold shadow-md font-montserrat' 
                            : 'bg-transparent border-[#1800ad]/15 hover:border-[#1800ad]/30 text-[#1800ad] font-montserrat'
                        }`}
                      >
                        <div className="font-black truncate uppercase font-montserrat tracking-wide">{sess.title}</div>
                        <div className={`text-[10px] truncate font-montserrat ${activeSessionId === sess.id ? 'text-[#f6f4ee]/75' : 'text-[#1800ad]/60'}`}>
                          {sess.lastMsg}
                        </div>
                        <div className={`text-[9px] font-montserrat mt-1 text-right ${activeSessionId === sess.id ? 'text-[#f6f4ee]/50' : 'text-[#1800ad]/40'}`}>
                          {sess.timestamp}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* ========================================================
            COLUMN 2 (CENTER): Main Conversational play arena
           ======================================================== */}
        <section className="flex-1 flex flex-col border-2 border-[#1800ad] rounded-[28px] bg-[#f6f4ee] p-4 h-full overflow-hidden relative justify-between font-montserrat">
          
          {/* Active Header inside Sandbox Compartment wrapper */}
          <div className="border-b border-[#1800ad]/20 pb-3 flex items-center bg-[#f6f4ee] font-montserrat gap-2">
            <button 
              onClick={() => setIsMobileHistoryOpen(!isMobileHistoryOpen)}
              className="lg:hidden p-1.5 text-[#1800ad] hover:bg-[#1800ad]/10 transition-all flex items-center justify-center mr-1"
              title="Toggle Sessions History"
            >
              <Menu size={14} />
            </button>
            <span className="font-black text-xs text-[#1800ad] uppercase tracking-widest font-montserrat">Workspace Feed</span>
            <span className="text-[8px] bg-[#1800ad]/10 text-[#1800ad] font-bold tracking-widest uppercase py-0.5 px-2 rounded-full border border-[#1800ad]/20 font-montserrat">
              Live
            </span>
          </div>

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

                    {m.payload && (
                      <div className="w-full max-w-[95%]">
                        {m.payload.type === 'video' && renderVideoCard(m.payload)}
                        {m.payload.type === 'simulation' && renderSimulationCard(m.payload)}
                        {m.payload.type === 'universe' && renderUniverseOrbitalCard(m.payload)}
                        {m.payload.type === 'quiz' && <InteractiveQuizCard payload={m.payload} />}
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
                
                <input
                  ref={chatInputRef}
                  type="text"
                  value={textInput}
                  onChange={handleInputChange}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#1800ad] placeholder:text-[#1800ad]/40 focus:outline-none font-semibold font-montserrat"
                />

                {/* RHS Mic trigger inside input bubble */}
                <button
                  type="button"
                  onClick={startSpeechSimulation}
                  className={`p-1 hover:bg-[#1800ad]/10 rounded-full transition-all ml-2 ${isVoiceRecording ? 'text-red-600 animate-pulse' : 'text-[#1800ad]/60 hover:text-[#1800ad]'}`}
                  title="Speak live concept query"
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
                setTextInput('/video');
                chatInputRef.current?.focus();
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
                setTextInput('/simulation');
                chatInputRef.current?.focus();
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
                setTextInput('/universe');
                chatInputRef.current?.focus();
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

    </div>
  );
}
