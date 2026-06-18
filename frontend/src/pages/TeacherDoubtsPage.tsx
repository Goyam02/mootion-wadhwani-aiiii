import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MessageSquare, 
  Check, 
  Mic, 
  Send, 
  Sparkles, 
  User, 
  Volume2, 
  X,
  LayoutDashboard,
  BookOpen,
  BarChart2,
  HelpCircle,
  Clock,
  Play,
  Square,
  Sparkle,
  Menu
} from 'lucide-react';
import { NavItem } from '../components/NavItem';

interface LiveMessage {
  id: string;
  sender: 'student' | 'teacher' | 'ai';
  text: string;
  timestamp: string;
}

interface Doubt {
  id: string;
  studentName: string;
  grade: string;
  subject: string;
  topicTitle: string;
  doubtText: string;
  generatedAnswer?: string;
  status: 'pending' | 'responded';
  timestamp: string;
  messages: LiveMessage[];
}

const DEFAULT_MOCK_DOUBTS: Doubt[] = [
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
      { id: "m2", sender: "ai", text: "💡 Proposed AI Solution: Lentz law indicates induced current opposes the flux shift to uphold energy conservation. If it pulled closer, it would produce free perpetual velocity energy!", timestamp: "10:16 AM" }
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
  },
  {
    id: "doubt-3",
    studentName: "Dev Patel",
    grade: "Class 8",
    subject: "Chemistry",
    topicTitle: "Atomic Structures & Valency",
    doubtText: "If surfaces weld together under high pressure, why doesn't glue stick better on oily materials?",
    generatedAnswer: "Oil molecules establish a visual barrier preventing outer direct contact welding. The asperities slide over the oil film lubricant fluid.",
    status: "responded",
    timestamp: "2 days ago",
    messages: [
      { id: "m4", sender: "student", text: "If surfaces weld together under high pressure, why doesn't glue stick better on oily materials?", timestamp: "2 days ago" },
      { id: "m5", sender: "teacher", text: "Oil molecules establish a low-surface-energy boundary layer, preventing adhesive chains from forming covalent bonds with the backing base materials.", timestamp: "Yesterday" }
    ]
  }
];

const cleanText = (text: string): string => {
  if (!text) return "";
  // Strip emojis (using Unicode Extended Pictographic and basic emoji ranges)
  let cleaned = text.replace(/\p{Extended_Pictographic}/gu, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '');
  // Strip asterisks
  cleaned = cleaned.replace(/\*/g, '');
  return cleaned.trim();
};

export function TeacherDoubtsPage() {
  const navigate = useNavigate();
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [selectedDoubtId, setSelectedDoubtId] = useState<string>('');
  const [typedReply, setTypedReply] = useState<string>('');
  
  // Voice recording mock state
  const [recordingDoubtId, setRecordingDoubtId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [typingState, setTypingState] = useState<string>('');
  
  // Mobile list drawer toggle state
  const [isMobileListOpen, setIsMobileListOpen] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync index and fetch from storage
  useEffect(() => {
    const fetchDoubts = () => {
      const raw = localStorage.getItem('mootion_doubts_store');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setDoubts(parsed);
          // Set first doubt if none selected
          if (parsed.length > 0 && !selectedDoubtId) {
            setSelectedDoubtId(parsed[0].id);
          }
        } catch (e) {
          console.error("Failed to parse doubts store", e);
        }
      } else {
        localStorage.setItem('mootion_doubts_store', JSON.stringify(DEFAULT_MOCK_DOUBTS));
        setDoubts(DEFAULT_MOCK_DOUBTS);
        setSelectedDoubtId(DEFAULT_MOCK_DOUBTS[0].id);
      }
    };

    fetchDoubts();
    // Poll to keep bidirectional communication and ask_teacher synced in real time
    const interval = setInterval(fetchDoubts, 2000);
    return () => clearInterval(interval);
  }, [selectedDoubtId]);

  // Auto-scroll inside active chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedDoubtId, doubts]);

  const activeDoubt = doubts.find(d => d.id === selectedDoubtId) || doubts[0];

  const handleSendReply = (customText?: string) => {
    const textToSend = customText || typedReply;
    if (!textToSend.trim() || !activeDoubt) return;

    const newMessage: LiveMessage = {
      id: `m-teacher-${Date.now()}`,
      sender: 'teacher',
      text: textToSend.trim(),
      timestamp: 'Just now'
    };

    const updatedDoubts = doubts.map(d => {
      if (d.id === activeDoubt.id) {
        const msgs = d.messages || [];
        return {
          ...d,
          status: 'responded' as const,
          messages: [...msgs, newMessage]
        };
      }
      return d;
    });

    setDoubts(updatedDoubts);
    localStorage.setItem('mootion_doubts_store', JSON.stringify(updatedDoubts));
    setTypedReply('');

    // Trigger mock user response after 1.5 seconds to build a dynamic conversation thread!
    setTypingState(`${activeDoubt.studentName} is writing...`);
    setTimeout(() => {
      const studentReplyText = `Thanks for clarifying, teacher! Does this specific principle apply inside liquid buoyancy parameters too?`;
      const studentMsgs: LiveMessage = {
        id: `m-student-reply-${Date.now()}`,
        sender: 'student',
        text: studentReplyText,
        timestamp: 'Just now'
      };

      const finalDoubts = updatedDoubts.map(d => {
        if (d.id === activeDoubt.id) {
          const msgs = d.messages || [];
          return {
            ...d,
            messages: [...msgs, studentMsgs]
          };
        }
        return d;
      });

      setDoubts(finalDoubts);
      localStorage.setItem('mootion_doubts_store', JSON.stringify(finalDoubts));
      setTypingState('');
    }, 2000);
  };

  const handleApproveAIResponse = () => {
    if (!activeDoubt || !activeDoubt.generatedAnswer) return;
    const cleanAnswer = activeDoubt.generatedAnswer.replace(/💡 Proposed AI Solution: /gi, '');
    handleSendReply(`Approved Guidance: ${cleanAnswer}`);
  };

  const handleStartRecord = () => {
    if (!activeDoubt) return;
    setRecordingDoubtId(activeDoubt.id);
    setIsRecording(true);
  };

  const handleStopRecord = () => {
    setIsRecording(false);
    setRecordingDoubtId(null);
    handleSendReply("🎙 Sent complete voice note explanation (0:15 min)");
  };

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-6 py-2.5 flex justify-between items-center z-40 rounded-full border-[2px] border-[#f6f4ee] shadow-xl">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
        <NavItem icon={<BookOpen size={24} />} onClick={() => navigate('/teacher/class/class-8-physics')} />
        <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
        <NavItem icon={<MessageSquare size={24} />} active onClick={() => navigate('/teacher/doubts')} />
      </nav>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30 font-montserrat">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
          <NavItem icon={<BookOpen size={24} />} onClick={() => navigate('/teacher/class/class-8-physics')} />
          <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
          <NavItem icon={<MessageSquare size={24} />} active onClick={() => navigate('/teacher/doubts')} />
        </nav>
        <div onClick={() => navigate('/')} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-extrabold text-lg">P</span>
        </div>
      </aside>

      {/* Viewport content */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-4 md:p-8 lg:p-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-[100dvh]">
        <div className="max-w-[1250px] w-full flex flex-col h-full">
          
          {/* Header Element */}
          <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-3 border-b-2 border-[#1800ad]/15 pb-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#1800ad]/60 font-mono">Live Doubt Resolution Center</span>
              <h1 className="text-2xl md:text-3xl font-black text-[#1800ad] tracking-tight mt-1">
                Direct Teacher-Student Chat
              </h1>
            </div>
            <p className="text-xs font-semibold text-[#1800ad]/70 leading-none">
              Respond directly to curriculum doubts or prompt automated replies. Live synced with student playgrounds!
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-6 flex-1 h-[calc(100%-80px)] overflow-hidden">
            
            {/* LHS: Live Doubts List Selector - Desktop only */}
            <div className="hidden lg:flex flex-col gap-3 h-full overflow-y-auto pr-1">
              <div className="flex flex-col gap-2.5">
                {doubts.map((item) => {
                  const isSelected = selectedDoubtId === item.id;
                  const isPending = item.status === 'pending';
                  const lastMessage = item.messages?.[item.messages.length - 1];

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDoubtId(item.id)}
                      className={`text-left p-4.5 rounded-2xl border-2 transition-all flex flex-col gap-2 relative overflow-hidden ${
                        isSelected 
                          ? 'border-[#1800ad] bg-white shadow-md' 
                          : 'border-[#1800ad]/10 hover:border-[#1800ad]/30 bg-[#f6f4ee]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-[#1800ad]/5 text-[#1800ad] px-2.5 py-0.5 rounded-full border border-[#1800ad]/10">
                          {item.grade} • {item.subject}
                        </span>
                        {isPending && (
                          <span className="text-[8px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black uppercase">Pending</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1800ad]/10 text-[#1800ad] flex items-center justify-center font-bold text-[10px]">
                          {item.studentName.charAt(0)}
                        </div>
                        <h3 className="font-extrabold text-xs">
                          {item.studentName}
                        </h3>
                      </div>

                      <p className="text-[11px] font-semibold text-[#1800ad]/70 line-clamp-2">
                        {lastMessage ? lastMessage.text : item.doubtText}
                      </p>

                      <div className="flex items-center justify-between border-t border-[#1800ad]/10 pt-2 mt-1 text-[8.5px] font-black uppercase tracking-wider text-[#1800ad]/50">
                        <span>Topic: {item.topicTitle}</span>
                        <span>{item.timestamp}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RHS: LIVE CONVERSATION CHAT SCREEN - visible on all sizes */}
            {activeDoubt ? (
              <div className="bg-white rounded-[28px] border-2 border-[#1800ad] flex flex-col h-full overflow-hidden shadow">
                
                {/* Chat Header */}
                <div className="px-4 sm:px-5 py-3 border-b border-[#1800ad]/15 bg-[#1800ad]/5 flex flex-col gap-2">
                  
                  {/* Mobile Student Toggle Row - scrollable pill switcher */}
                  <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {doubts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedDoubtId(item.id)}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all border ${
                          selectedDoubtId === item.id
                            ? 'bg-[#1800ad] text-[#f6f4ee] border-[#1800ad]'
                            : 'bg-white text-[#1800ad] border-[#1800ad]/20 hover:border-[#1800ad]/60'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          item.status === 'pending' ? 'bg-red-500' : 'bg-emerald-500'
                        }`}></span>
                        {item.studentName.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  {/* Name and class badge row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-[#1800ad] font-montserrat">{activeDoubt.studentName}</h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[8px] sm:text-[10px] font-black uppercase bg-[#1800ad] text-[#f6f4ee] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{activeDoubt.grade} • {activeDoubt.subject}</span>
                    </div>
                  </div>
                </div>

                {/* Message Streams List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3.5 custom-scrollbar bg-[#f6f4ee]/30">
                  {/* First Question Message from student */}
                  <div className="flex flex-col items-start max-w-[85%] self-start gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#1800ad]/50 pl-1">{activeDoubt.studentName} • original doubt</span>
                    <div className="p-4 rounded-2xl rounded-tl-none bg-[#f6f4ee] border border-[#1800ad]/10 text-xs font-semibold leading-relaxed text-[#1800ad]">
                      "{cleanText(activeDoubt.doubtText)}"
                    </div>
                  </div>

                  {/* AI Suggested Answer if present (as a proposed card) */}
                  {activeDoubt.generatedAnswer && (
                    <div className="flex flex-col items-start max-w-[85%] self-start gap-1">
                      <span className="text-[9.5px] font-bold text-indigo-600 block pl-1 uppercase">AI Suggested Guidance</span>
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl rounded-tl-none text-xs leading-relaxed text-indigo-900 font-semibold">
                        {cleanText(activeDoubt.generatedAnswer)}
                      </div>

                      {activeDoubt.status === 'pending' && (
                        <button
                          onClick={handleApproveAIResponse}
                          className="mt-1.5 ml-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[9px] font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Check size={10} className="stroke-[3]" /> Approve & Send AI answer
                        </button>
                      )}
                    </div>
                  )}

                  {/* Dynamically mapped replies thread */}
                  {activeDoubt.messages && activeDoubt.messages.filter(m => m.id !== 'm1' && m.id !== 'm2').map((msg) => {
                    const isTeacher = msg.sender === 'teacher';
                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] gap-1 ${isTeacher ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#1800ad]/50 px-1">
                          {isTeacher ? 'You (Teacher)' : activeDoubt.studentName}
                        </span>
                        
                        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold leading-relaxed ${
                          isTeacher 
                            ? 'bg-[#1800ad] text-[#f6f4ee] rounded-tr-none' 
                            : 'bg-white text-[#1800ad] border border-[#1800ad]/15 rounded-tl-none'
                        }`}>
                          {cleanText(msg.text)}
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Simulator indicator */}
                  {typingState && (
                    <div className="text-[10px] font-semibold text-[#1800ad]/60 italic animate-pulse pl-1 self-start flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1800ad]/60 animate-ping"></span>
                      {typingState}
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Input Text Area Toolbar / Control */}
                <div className="p-4 border-t border-[#1800ad]/15 bg-white relative">
                  <div className="flex gap-2.5 items-center relative">
                    
                    <div className="relative flex-1 flex items-center bg-[#f6f4ee] border-2 border-[#1800ad] rounded-full px-4 py-3 shadow-sm">
                      {/* mic record trigger */}
                      {isRecording ? (
                        <button
                          type="button"
                          onClick={handleStopRecord}
                          className="mr-2 text-red-600 animate-pulse flex items-center gap-1 font-mono text-[9px] font-black uppercase tracking-wider"
                        >
                          <Square size={13} className="fill-red-600 animate-ping" /> STOP
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={handleStartRecord}
                          className="p-1 hover:bg-[#1800ad]/10 text-[#1800ad]/60 hover:text-[#1800ad] rounded-full transition-all mr-2"
                          title="Record voice explanation"
                        >
                          <Mic size={16} />
                        </button>
                      )}
                      
                      <input
                        type="text"
                        value={typedReply}
                        onChange={(e) => setTypedReply(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSendReply();
                          }
                        }}
                        placeholder={`Reply to ${activeDoubt.studentName}...`}
                        className="w-full bg-transparent text-xs text-[#1800ad] placeholder:text-[#1800ad]/40 focus:outline-none font-semibold font-montserrat"
                      />
                    </div>

                    <button 
                      onClick={() => handleSendReply()}
                      disabled={!typedReply.trim()}
                      className="bg-[#1800ad] hover:opacity-95 text-[#f6f4ee] rounded-full p-3.5 hover:scale-[1.03] active:scale-95 transition-all outline-none border border-transparent shadow disabled:opacity-40 disabled:scale-100"
                    >
                      <Send size={16} />
                    </button>

                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-[28px] border-2 border-[#1800ad]/15 flex items-center justify-center p-8 sm:p-12 text-center text-[#1800ad]/35 h-full flex-col">
                <div className="flex flex-col gap-2 max-w-sm">
                  <MessageSquare size={42} className="mx-auto" />
                  <span className="font-extrabold uppercase text-xs font-montserrat tracking-widest text-[#1800ad]/60">No Active Doubt Selected</span>
                  <p className="text-xs font-semibold leading-relaxed">Select a student doubt from the list to resolve and chat back in real-time!</p>
                </div>
                
                {doubts.length > 0 && (
                  <div className="mt-6 flex flex-col gap-2 w-full max-w-xs">
                    {doubts.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedDoubtId(item.id)}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[#1800ad]/15 bg-[#f6f4ee] hover:bg-[#1800ad]/5 transition-all text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#1800ad] text-[#f6f4ee] flex items-center justify-center font-black text-sm shrink-0">
                          {item.studentName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-xs text-[#1800ad] truncate">{item.studentName}</p>
                          <p className="text-[10px] text-[#1800ad]/60 truncate">{item.doubtText}</p>
                        </div>
                        <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${
                          item.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>{item.status}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </main>

      {/* MOBILE LIST SLIDE DOWN / SHEET DRAWER */}
      <AnimatePresence>
        {isMobileListOpen && (
          <>
            {/* Dark blur overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileListOpen(false)}
              className="fixed inset-0 bg-[#1800ad]/60 backdrop-blur-xs z-50 lg:hidden"
            />

            {/* Slide-out Sheet */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-full max-w-[315px] bg-[#f6f4ee] border-r-4 border-[#1800ad] p-6 z-50 flex flex-col justify-between h-full shadow-2xl lg:hidden font-montserrat text-[#1800ad]"
            >
              <div className="flex flex-col h-full overflow-hidden">
                
                {/* Drawer Header with Title and Close button */}
                <div className="flex items-center justify-between border-b-2 border-[#1800ad]/15 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#1800ad]" />
                    <span className="font-black text-xs uppercase tracking-wider font-montserrat">
                      Student Inquiries
                    </span>
                    <span className="bg-[#1800ad] text-[#f6f4ee] rounded-full px-1.5 py-0.5 text-[8px] font-black leading-none">
                      {doubts.length}
                    </span>
                  </div>
                  <button 
                    onClick={() => setIsMobileListOpen(false)}
                    className="p-1 rounded-full hover:bg-[#1800ad]/15 text-[#1800ad] transition-all"
                  >
                    <X size={20} className="stroke-[2.5]" />
                  </button>
                </div>

                {/* Subtitle brief */}
                <span className="text-[9px] font-black uppercase text-[#1800ad]/50 tracking-wider mb-3">Live Active Queue:</span>

                {/* Student Doubt List Selection Cards */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar h-full">
                  {doubts.length === 0 ? (
                    <div className="py-20 text-center text-[11px] font-semibold text-[#1800ad]/50 uppercase tracking-widest">
                      No doubts found
                    </div>
                  ) : (
                    doubts.map((item) => {
                      const isSelected = selectedDoubtId === item.id;
                      const isPending = item.status === 'pending';
                      const lastMessage = item.messages?.[item.messages.length - 1];

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSelectedDoubtId(item.id);
                            setIsMobileListOpen(false);
                          }}
                          className={`text-left p-4 rounded-xl border border-[#1800ad]/20 transition-all flex flex-col gap-2 relative overflow-hidden ${
                            isSelected 
                              ? 'border-2 border-[#1800ad] bg-white shadow-md' 
                              : 'bg-white/40 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest bg-[#1800ad]/5 text-[#1800ad] px-2 py-0.5 rounded border border-[#1800ad]/10">
                              {item.grade} • {item.subject}
                            </span>
                            {isPending && (
                              <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black uppercase">Pending</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#1800ad]/10 text-[#1800ad] flex items-center justify-center font-bold text-[9px]">
                              {item.studentName.charAt(0)}
                            </div>
                            <h3 className="font-extrabold text-xs">
                              {item.studentName}
                            </h3>
                          </div>

                          <p className="text-[10px] font-semibold text-[#1800ad]/70 line-clamp-2 leading-relaxed">
                            {lastMessage ? lastMessage.text : item.doubtText}
                          </p>

                          <div className="flex items-center justify-between border-t border-[#1800ad]/10 pt-1.5 mt-1 text-[8px] uppercase tracking-wider text-[#1800ad]/40 font-black">
                            <span className="truncate max-w-[130px]">Topic: {item.topicTitle}</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

              </div>

              {/* Bottom dismissal */}
              <div className="mt-4 pt-3 border-t border-[#1800ad]/10">
                <button
                  onClick={() => setIsMobileListOpen(false)}
                  className="w-full bg-[#1800ad] hover:opacity-90 text-[#f6f4ee] py-3 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all"
                >
                  Close Inquiries
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
