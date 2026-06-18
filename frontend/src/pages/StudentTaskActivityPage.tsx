import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronRight,
  X,
  Beaker
} from 'lucide-react';
import { TASKS, Task } from '../data/tasks';
import { NavItem } from '../components/NavItem';
import { ChatbotFab } from '../components/ChatbotFab';
import { LayoutDashboard, CheckSquare, Compass, Gamepad2 } from 'lucide-react';

// Import modular Teach AI activities and progress panels
import { LiveVoiceActivity, AttemptHistoryPanel } from '../components/LiveVoiceActivity';

// --- Content Components ---

function QuizContent({ task }: { task: Task }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: task.subject, topic: task.topic })
    })
    .then(res => res.json())
    .then(data => {
      if (data.questions) setQuestions(data.questions);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, [task]);

  useEffect(() => {
    if (loading || isSubmitted || questions.length === 0) return;
    
    if (timeLeft <= 0) {
      if (currentIdx === questions.length - 1) {
        setIsSubmitted(true);
      } else {
        setCurrentIdx(prev => prev + 1);
        setTimeLeft(10);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, isSubmitted, questions.length, currentIdx]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#1800ad]/20 border-t-[#1800ad] rounded-full animate-spin"></div>
          <p className="text-[#1800ad] font-bold text-lg animate-pulse">Generating quiz...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="p-8 font-bold">Failed to load quiz.</div>;
  }

  const q = questions[currentIdx];
  const progress = ((currentIdx) / questions.length) * 100;

  if (isSubmitted) {
    let score = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correctAnswer) score++;
    });

    return (
       <div className="flex flex-col items-center flex-1 mt-6 max-w-3xl mx-auto w-full">
         <div className="bg-white p-10 rounded-[40px] flex flex-col items-center max-w-lg w-full border-2 border-[#1800ad]/10 shadow-xl">
            <h2 className="text-3xl font-black text-[#1800ad] mb-6">Quiz Complete!</h2>
            <div className="w-32 h-32 rounded-full border-8 border-[#1800ad] flex items-center justify-center mb-6">
              <span className="text-4xl font-black text-[#1800ad]">{Math.round((score / questions.length) * 100)}%</span>
            </div>
            <p className="font-bold text-[#1800ad]/70 mb-8">You answered {score} out of {questions.length} correctly.</p>
            
            <div className="flex gap-4 w-full">
              <button onClick={() => { setIsSubmitted(false); setAnswers({}); setCurrentIdx(0); setTimeLeft(10); }} className="flex-1 py-4 bg-[#1800ad]/10 text-[#1800ad] rounded-full font-bold hover:bg-[#1800ad]/20 transition-colors">
                Try Again
              </button>
            </div>
         </div>
       </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full mt-6">
       <div className="w-full bg-[#1800ad]/10 h-2 rounded-full mb-8 overflow-hidden">
         <div className="h-full bg-[#1800ad] transition-all duration-300" style={{ width: `${progress}%` }}></div>
       </div>

       <div className="bg-white rounded-[40px] p-8 md:p-12 border-2 border-[#1800ad]/10 shadow-lg mb-6 relative min-h-[480px]">
          <div className="absolute top-8 right-8 flex items-center justify-center w-12 h-12 bg-[#1800ad]/10 text-[#1800ad] rounded-full font-bold text-xl">
            {timeLeft}
          </div>
          <span className="font-bold text-[#1800ad]/50 text-sm mb-4 block uppercase tracking-wider">Question {currentIdx + 1} of {questions.length}</span>
          <h3 className="text-2xl font-black text-[#1800ad] mb-8 pr-16">{q.questionText}</h3>

          <div className="flex flex-col gap-4">
             {q.options?.map((opt: string) => (
                <button
                  key={opt} 
                  onClick={() => setAnswers({...answers, [q.id]: opt})}
                  className={`text-left flex items-center gap-4 p-5 rounded-2xl border-2 transition-all w-full ${answers[q.id] === opt ? 'border-[#1800ad] bg-[#1800ad]/5 shadow-[0_0_0_2px_rgba(24,0,173,0.1)]' : 'border-[#1800ad]/10 hover:border-[#1800ad]/30 hover:bg-[#f6f4ee]'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${answers[q.id] === opt ? 'border-[#1800ad]' : 'border-[#1800ad]/30'}`}>
                    {answers[q.id] === opt && <div className="w-3 h-3 bg-[#1800ad] rounded-full" />}
                  </div>
                  <span className={`font-bold text-lg ${answers[q.id] === opt ? 'text-[#1800ad]' : 'text-[#1800ad]/80'}`}>{opt}</span>
                </button>
             ))}
          </div>
       </div>

       <div className="flex justify-end items-center mt-auto pb-8">
          {currentIdx === questions.length - 1 ? (
             <button 
                onClick={() => setIsSubmitted(true)}
                disabled={!answers[q.id]}
                className="px-8 py-4 bg-[#1800ad] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
             >
                Submit Answers
              </button>
          ) : (
             <button 
                onClick={() => { setCurrentIdx(prev => prev + 1); setTimeLeft(10); }}
                disabled={!answers[q.id]}
                className="px-8 py-4 bg-[#1800ad] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0"
             >
                Next <ChevronRight size={20} />
             </button>
          )}
       </div>
    </div>
  );
}

function VideoSimulationContent({ task }: { task: Task }) {
  if (task.type === 'Simulation') {
    return (
      <div className="w-full bg-white border-2 border-[#1800ad] overflow-hidden relative aspect-video md:aspect-auto md:flex-1 md:h-full md:min-h-[580px] md:rounded-[32px] rounded-2xl flex items-center justify-center shrink-0">
        <div className="absolute inset-x-0 top-0 h-10 bg-[#1800ad] flex items-center px-4">
          <span className="text-white font-bold text-sm tracking-wider uppercase">Interactive Simulation</span>
        </div>
        <div className="mt-10 px-8 py-16 flex flex-col items-center justify-center text-center">
           <Beaker size={48} className="text-[#1800ad] mb-4 md:mb-6 md:w-16 md:h-16 animate-pulse" />
           <h3 className="text-xl md:text-2xl font-black text-[#1800ad] mb-2 md:mb-4">Sample {task.topic} Simulation</h3>
           <p className="text-[#1800ad]/70 font-medium max-w-lg text-sm md:text-base hidden sm:block">
              Interact with the elements to observe the outcomes and prepare for your activities.
           </p>
           <button className="mt-4 md:mt-8 px-6 py-2 md:py-3 bg-[#1800ad] text-white rounded-full font-bold hover:scale-105 transition-transform text-sm md:text-base">
              Run Complete Lifecycle
           </button>
        </div>
      </div>
    );
  }

  // Video
  return (
    <div className="w-full bg-black overflow-hidden relative aspect-video md:aspect-auto md:flex-1 md:h-full md:min-h-[580px] md:rounded-[32px] rounded-2xl shrink-0 font-montserrat">
      <video 
        className="w-full h-full object-contain md:object-cover" 
        controls 
        src="https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
        poster="https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg"
      ></video>
    </div>
  );
}

// --- Main Page ---

export function StudentTaskActivityPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromHome = searchParams.get('fromHome') === 'true';
  
  // Determine if we accessed from Explore or Tasks
  const isFromExplore = !fromHome && !!(taskId && taskId.startsWith('exp_'));
  let backUrl = fromHome ? '/student/home' : '/student/tasks';
  if (isFromExplore) {
    const parts = taskId.split('_');
    if (parts.length >= 3) {
      const subjectCode = parts[1];
      const chapterId = parts[2];
      backUrl = `/student/explore/${subjectCode}/${chapterId}`;
    }
  }
  
  // Resolve task or dynamic task from explore chapters
  let task = TASKS.find(t => t.id === taskId);
  if (!task && taskId?.startsWith('exp_')) {
    const parts = taskId.split('_'); // exp, phy, c3, t1, Video/Simulation/Quiz
    const subjectCode = parts[1];
    const chapterId = parts[2];
    const topicId = parts[3];
    const itemType = parts[4];

    let subjectStr = 'Physics';
    if (subjectCode === 'chm') subjectStr = 'Chemistry';
    else if (subjectCode === 'mat') subjectStr = 'Mathematics';
    else if (subjectCode === 'bio') subjectStr = 'Biology';

    let topicName = 'Explore Lesson';
    if (subjectCode === 'phy' && chapterId === 'c3') {
      if (topicId === 't1') topicName = 'Introduction to Buoyancy';
      else if (topicId === 't2') topicName = 'Archimedes\' Principle';
      else if (topicId === 't3') topicName = 'Floating and Sinking';
    } else {
      const typeStr = itemType || 'Video';
      topicName = `${subjectStr} Ch${chapterId.replace('c', '')} Topic ${topicId.toUpperCase().replace('T', '')}`;
    }

    const typeLabel = itemType === 'Video' ? 'Watch Video' : itemType === 'Quiz' ? 'Attempt Quiz' : 'Simulation';

    task = {
      id: taskId,
      type: itemType as any || 'Video',
      typeLabel: typeLabel,
      topic: topicName,
      subject: subjectStr,
      deadline: 'Explore Activity',
      status: 'In Progress'
    };
  }

  const [activeActivity, setActiveActivity] = useState<string | null>(null);

  if (!task) {
    return <div className="p-10 font-bold text-[#1800ad]">Task not found</div>;
  }

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      <ChatbotFab context={`User is doing ${activeActivity || task.type} for subject ${task.subject}, topic ${task.topic}`} />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        {/* Logo */}
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} active={!isFromExplore} onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} active={isFromExplore} onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} />
        </nav>
        <div className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] relative">
           <span className="text-[#1800ad] font-bold text-lg">P</span>
        </div>
      </aside>

      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] p-5 md:p-8 flex flex-col overflow-hidden h-[100dvh]">
        {!activeActivity && (
          <header className="shrink-0 mb-6 flex items-center gap-4">
            <button onClick={() => navigate(backUrl)} className="p-2 border-2 border-[#1800ad]/10 rounded-full text-[#1800ad] hover:bg-[#1800ad]/5 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[#1800ad]/60 font-bold text-xs uppercase tracking-wider">{task.subject}</span>
              <h1 className="text-xl md:text-2xl font-black text-[#1800ad] leading-none mt-1">{task.topic}</h1>
            </div>
          </header>
        )}

        <div className="flex flex-1 overflow-hidden min-h-0 gap-8">
          {/* Main Content Area */}
          <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar pb-20 md:pb-0 ${activeActivity ? 'max-w-none' : ''}`}>
             <AnimatePresence mode="wait">
               {activeActivity === 'Explain It' && (
                 <motion.div key="ExplainIt" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="h-full">
                   <LiveVoiceActivity task={task} activityName="Explain It" instructions="Teach the concept and answer questions." onDone={() => setActiveActivity(null)} />
                 </motion.div>
               )}
               {activeActivity === 'Predict It' && (
                 <motion.div key="PredictIt" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="h-full">
                   <LiveVoiceActivity task={task} activityName="Predict It" instructions="Predict the outcome before it happens." onDone={() => setActiveActivity(null)} />
                 </motion.div>
               )}
               {activeActivity === 'Spot It' && (
                 <motion.div key="SpotIt" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="h-full">
                   <LiveVoiceActivity task={task} activityName="Spot It" instructions="Identify the concept in a real-world scenario." onDone={() => setActiveActivity(null)} />
                 </motion.div>
               )}
               {activeActivity === 'Connect It' && (
                 <motion.div key="ConnectIt" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="h-full">
                   <LiveVoiceActivity task={task} activityName="Connect It" instructions="Explain the relationship between concepts." onDone={() => setActiveActivity(null)} />
                 </motion.div>
               )}
               {!activeActivity && (
                 <motion.div key="default" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col">
                     {task.type === 'Quiz' ? <QuizContent task={task} /> : <VideoSimulationContent task={task} />}
                     
                     {/* Multi-attempt logs & interactive teacher auditing board embedded cleanly right in the container flow */}
                     <AttemptHistoryPanel taskId={task.id} />

                     {/* Mobile Activity Grid */}
                     <div className="lg:hidden w-full mt-6 pb-12">
                        <div className="bg-[#1800ad] rounded-[22px] p-4 shadow-lg relative overflow-hidden">
                          <h3 className="font-bold text-md text-white mb-2 pb-1 border-b border-white/10 tracking-wide">Activity</h3>
                          <div className="grid grid-cols-2 gap-2.5 relative z-10 w-full">
                             <button onClick={() => setActiveActivity('Explain It')} className="bg-[#f6f4ee] rounded-[16px] h-14 flex flex-col items-center justify-center shadow-md hover:scale-102 transition-transform">
                                <span className="font-bold text-sm text-[#1800ad] text-center leading-tight">Explain It</span>
                             </button>
                             <button onClick={() => setActiveActivity('Predict It')} className="bg-[#f6f4ee] rounded-[16px] h-14 flex flex-col items-center justify-center shadow-md hover:scale-102 transition-transform">
                                <span className="font-bold text-sm text-[#1800ad] text-center leading-tight">Predict It</span>
                             </button>
                             <button onClick={() => setActiveActivity('Spot It')} className="bg-[#f6f4ee] rounded-[16px] h-14 flex flex-col items-center justify-center shadow-md hover:scale-102 transition-transform">
                                <span className="font-bold text-sm text-[#1800ad] text-center leading-tight">Spot It</span>
                             </button>
                             <button onClick={() => setActiveActivity('Connect It')} className="bg-[#f6f4ee] rounded-[16px] h-14 flex flex-col items-center justify-center shadow-md hover:scale-102 transition-transform">
                                <span className="font-bold text-sm text-[#1800ad] text-center leading-tight">Connect It</span>
                             </button>
                          </div>
                        </div>
                     </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Activity Sidebar */}
          {!activeActivity && (
            <div className="hidden lg:flex w-80 shrink-0 flex-col bg-[#1800ad] px-6 pt-5 pb-5 rounded-[28px] overflow-y-auto custom-scrollbar relative shadow-xl h-fit">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold tracking-wide text-lg text-white">Activity</h3>
                <button onClick={() => navigate(backUrl)} className="p-1.5 text-white/80 hover:bg-white/20 rounded-full transition-colors bg-white/10">
                  <X size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveActivity('Explain It')} 
                  className="h-24 bg-[#f6f4ee] rounded-[20px] p-3 flex flex-col justify-center items-center group hover:scale-[1.03] transition-all shadow-md relative"
                >
                  <span className="font-bold text-center text-[#1800ad] text-sm leading-tight">Explain<br/>It</span>
                </button>

                <button 
                  onClick={() => setActiveActivity('Predict It')} 
                  className="h-24 bg-[#f6f4ee] rounded-[20px] p-3 flex flex-col justify-center items-center group hover:scale-[1.03] transition-all shadow-md relative"
                >
                  <span className="font-bold text-center text-[#1800ad] text-sm leading-tight">Predict<br/>It</span>
                </button>

                <button 
                  onClick={() => setActiveActivity('Spot It')} 
                  className="h-24 bg-[#f6f4ee] rounded-[20px] p-3 flex flex-col justify-center items-center group hover:scale-[1.03] transition-all shadow-md relative"
                >
                  <span className="font-bold text-center text-[#1800ad] text-sm leading-tight">Spot<br/>It</span>
                </button>

                <button 
                  onClick={() => setActiveActivity('Connect It')} 
                  className="h-24 bg-[#f6f4ee] rounded-[20px] p-3 flex flex-col justify-center items-center group hover:scale-[1.03] transition-all shadow-md relative"
                >
                  <span className="font-bold text-center text-[#1800ad] text-sm leading-tight">Connect<br/>It</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
