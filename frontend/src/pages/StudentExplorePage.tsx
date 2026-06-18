import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Compass, 
  Gamepad2, 
  Search, 
  ArrowLeft,
  ArrowRight,
  PlayCircle,
  Beaker,
  FileQuestion,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { NavItem } from '../components/NavItem';
import { ChatbotFab } from '../components/ChatbotFab';
import { EXPLORE_SUBJECTS, ExploreChapter, ExploreSubject, ExploreTopic, ExploreActivity } from '../data/exploreData';

export function StudentExplorePage() {
  const navigate = useNavigate();
  const { subjectCode, chapterId } = useParams();

  // Search input for Explore Page
  const [searchQuery, setSearchQuery] = useState('');

  // Local statuses & scores for dynamic button state persistence
  const [stats, setStats] = useState<Record<string, { status: string; score?: number }>>({});

  // Load persistence states on startup
  useEffect(() => {
    const loadedStats: Record<string, { status: string; score?: number }> = {};
    EXPLORE_SUBJECTS.forEach(sub => {
      sub.chapters.forEach(ch => {
        ch.topics.forEach(tp => {
          tp.activities.forEach(act => {
            const statusVal = localStorage.getItem(act.statusKey) || 'Not Started';
            const scoreVal = localStorage.getItem(`${act.statusKey}_score`);
            loadedStats[act.id] = {
              status: statusVal,
              score: scoreVal ? parseInt(scoreVal, 10) : undefined
            };
          });
        });
      });
    });
    setStats(loadedStats);
  }, [subjectCode, chapterId]);

  // Click handler to open lesson/activity
  const handleStartActivity = (act: ExploreActivity, subjectName: string, chapterTitle: string, topicTitle: string) => {
    // Transition to 'In Progress' immediately if it was Not Started
    const currentInfo = stats[act.id] || { status: 'Not Started' };
    if (currentInfo.status === 'Not Started') {
      localStorage.setItem(act.statusKey, 'In Progress');
      setStats(prev => ({
        ...prev,
        [act.id]: { ...prev[act.id], status: 'In Progress' }
      }));
    }
    
    // Simulate some scores for quizzes upon first entry just to demonstrate rich interactions!
    if (act.type === 'Quiz' && currentInfo.status !== 'Completed') {
      // Set to Completed with score
      const randomScore = [80, 85, 90, 95, 100][Math.floor(Math.random() * 5)];
      localStorage.setItem(act.statusKey, 'Completed');
      localStorage.setItem(`${act.statusKey}_score`, randomScore.toString());
    } else if (act.type !== 'Quiz' && currentInfo.status !== 'Completed') {
      localStorage.setItem(act.statusKey, 'Completed');
    }

    // Direct user to StudentTaskActivityPage experience
    navigate(`/student/task/${act.id}`);
  };

  // Helper inside Chapter Details to calculate total progress of this chapter
  const getChapterProgress = (chapter: ExploreChapter) => {
    let total = 0;
    let completed = 0;
    chapter.topics.forEach(tp => {
      tp.activities.forEach(act => {
        total++;
        const info = stats[act.id];
        if (info && info.status === 'Completed') {
          completed++;
        }
      });
    });
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  const getIcon = (type: 'Video' | 'Simulation' | 'Quiz') => {
    switch (type) {
      case 'Video': return <PlayCircle size={18} className="text-[#1800ad]" />;
      case 'Simulation': return <Beaker size={18} className="text-[#1800ad]" />;
      case 'Quiz': return <FileQuestion size={18} className="text-[#1800ad]" />;
    }
  };

  // If viewing a specific Chapter Details Page
  if (subjectCode && chapterId) {
    const subject = EXPLORE_SUBJECTS.find(s => s.code === subjectCode);
    const chapter = subject?.chapters.find(c => c.id === chapterId);

    if (!subject || !chapter) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-[#1800ad] text-[#f6f4ee]">
          <h2 className="text-2xl font-bold mb-4">Chapter not found</h2>
          <button onClick={() => navigate('/student/explore')} className="px-6 py-2 bg-[#f6f4ee] text-[#1800ad] rounded-full font-bold">
            Back to Explore
          </button>
        </div>
      );
    }

    const progressValue = getChapterProgress(chapter);

    return (
      <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
        <ChatbotFab context={`Viewing details of Chapter ${chapter.chapterNum}: ${chapter.title} in ${subject.name}`} />

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-8 py-2.5 flex justify-between items-center z-40 rounded-full shadow-[0_10px_40px_rgba(24,0,173,0.25)] border-[2px] border-[#f6f4ee]">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} active onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
        </nav>

        {/* Sidebar - Desktop */}
        <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
          <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
          </div>

          <nav className="flex flex-col gap-6 w-full items-center my-auto">
            <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
            <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
            <NavItem icon={<Compass size={24} />} active onClick={() => navigate('/student/explore')} />
            <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
          </nav>

          <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] relative">
            <span className="text-[#1800ad] font-bold text-lg">P</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
          <div className="max-w-[1300px] w-full h-full">
            
            {/* Header section backing home to explore */}
            <header className="flex flex-col gap-6 mb-8 lg:mb-10 w-full relative">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/student/explore')} 
                  className="p-2 border-2 border-[#1800ad]/15 rounded-full text-[#1800ad] hover:bg-[#1800ad]/5 transition-colors shrink-0"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="flex flex-col">
                  <span className="text-[#1800ad]/60 font-bold text-xs uppercase tracking-widest">{subject.name}</span>
                  <h1 className="text-3xl lg:text-4xl font-extrabold text-[#1800ad] leading-tight mt-0.5">
                    Chapter {chapter.chapterNum}: {chapter.title}
                  </h1>
                </div>
              </div>

              {/* Progress Indicator component */}
              <div className="bg-[#1800ad]/5 rounded-[24px] p-5 md:p-6 border border-[#1800ad]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[#1800ad]/70 font-bold text-sm">Chapter Syllabus Progress</span>
                  <p className="text-xs text-[#1800ad]/60 font-medium">Complete videos, simulations, and quiz activities to finish this chapter.</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 sm:self-center">
                  <div className="w-40 bg-[#1800ad]/15 h-3 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1800ad] rounded-full transition-all duration-500" style={{ width: `${progressValue}%` }}></div>
                  </div>
                  <span className="text-xl font-extrabold text-[#1800ad]">{progressValue}%</span>
                </div>
              </div>
            </header>

            {/* Display chapter content grouped by topics */}
            <div className="flex flex-col gap-8 pb-10">
              {chapter.topics.map((topic, idx) => (
                <div key={topic.id} className="bg-white rounded-[32px] p-6 md:p-8 border-2 border-[#1800ad]/10 shadow-sm flex flex-col gap-5">
                  <div className="flex items-baseline gap-2 border-b border-[#1800ad]/10 pb-3">
                    <span className="text-[#1800ad] font-extrabold text-sm uppercase tracking-wider">Topic {chapter.chapterNum}.{idx + 1}</span>
                    <h3 className="text-xl md:text-2xl font-bold text-[#1800ad] ml-2">{topic.title}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {topic.activities.map(activity => {
                      const itemState = stats[activity.id] || { status: 'Not Started' };
                      
                      return (
                        <div 
                          key={activity.id} 
                          className="border-2 border-[#1800ad]/15 rounded-[24px] p-5 md:p-6 bg-[#f6f4ee]/30 flex flex-col justify-between hover:border-[#1800ad]/45 transition-colors gap-4 min-h-[220px]"
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#1800ad]/10 text-[#1800ad] rounded-full text-xs font-bold">
                                {getIcon(activity.type)}
                                <span>{activity.typeLabel}</span>
                              </div>

                              {/* Completion Badge */}
                              {itemState.status === 'Completed' && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full inline-block">
                                  Done
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-[#1800ad] text-base md:text-lg mt-2 leading-snug line-clamp-2">
                              {activity.type === 'Quiz' ? `${topic.title} Quiz` : activity.type === 'Simulation' ? `${topic.title} Lab` : `${topic.title} Core Lesson`}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-[#1800ad]/10 mt-2">
                            <div className="flex flex-col">
                              {activity.type === 'Quiz' && itemState.status === 'Completed' && itemState.score !== undefined ? (
                                <>
                                  <span className="text-[10px] text-[#1800ad]/60 font-semibold uppercase tracking-wider">Last Score</span>
                                  <span className="text-base font-black text-emerald-600">{itemState.score}%</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-[#1800ad]/60 font-semibold uppercase tracking-wider">Status</span>
                                  <span className={`text-xs font-bold ${itemState.status === 'Not Started' ? 'text-gray-500' : 'text-amber-500'}`}>
                                    {itemState.status}
                                  </span>
                                </>
                              )}
                            </div>

                            <button 
                              onClick={() => handleStartActivity(activity, subject.name, chapter.title, topic.title)}
                              className="px-5 py-2.5 bg-[#1800ad] text-white rounded-full text-xs font-bold hover:bg-[#1800ad]/90 hover:shadow-md transition-all flex items-center gap-1"
                            >
                              {itemState.status === 'Not Started' && 'Start'}
                              {itemState.status === 'In Progress' && 'Continue'}
                              {itemState.status === 'Completed' && (activity.type === 'Quiz' ? 'Try Again' : 'Restart')}
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    );
  }

  // Otherwise, render full Explore Catalog page
  const filteredSubjects = EXPLORE_SUBJECTS.map(subj => {
    const matchedChapters = subj.chapters.filter(ch => {
      const criteriaStr = `${subj.name} ${ch.title} ${ch.description}`.toLowerCase();
      return criteriaStr.includes(searchQuery.toLowerCase());
    });
    return {
      ...subj,
      chapters: matchedMatchedChaptersAndKeepSubjects(subj, matchedChapters)
    };
  }).filter(s => s.chapters.length > 0);

  function matchedMatchedChaptersAndKeepSubjects(subj: ExploreSubject, chArray: ExploreChapter[]) {
    return chArray;
  }

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      <ChatbotFab context="User is browsing the Chapter Learning catalog on the Explore page." />

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-8 py-2.5 flex justify-between items-center z-40 rounded-full shadow-[0_10px_40px_rgba(24,0,173,0.25)] border-[2px] border-[#f6f4ee]">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
        <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
        <NavItem icon={<Compass size={24} />} active onClick={() => navigate('/student/explore')} />
        <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
      </nav>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>

        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} active onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
        </nav>

        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] relative">
          <span className="text-[#1800ad] font-bold text-lg">P</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
        <div className="max-w-[1300px] w-full h-full">
          
          {/* Top Header */}
          <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-8 lg:mb-10 w-full relative">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#1800ad]">
                Explore
              </h1>
              <p className="text-[#1800ad]/70 font-semibold mt-1">
                Browse all chapters assigned by your teacher.
              </p>
            </div>

            {/* Search inputs */}
            <div className="relative w-[calc(100%+16px)] -ml-2 translate-y-1.5 xl:translate-y-0 xl:ml-0 xl:w-[380px]">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={18} className="text-[#1800ad]/60" />
              </div>
              <input 
                type="text" 
                placeholder="Search chapters and topics..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-transparent border-2 border-[#1800ad]/30 rounded-full text-sm outline-none focus:border-[#1800ad] focus:ring-4 focus:ring-[#1800ad]/10 transition-all placeholder:text-[#1800ad]/50 font-semibold text-[#1800ad]"
              />
            </div>
          </header>

          {/* Catalog Listing */}
          <div className="flex flex-col gap-12 pb-10">
            {filteredSubjects.map(subj => (
              <section key={subj.name} className="flex flex-col gap-5">
                <h2 className="text-xl md:text-2xl font-black text-[#1800ad] border-b-2 border-[#1800ad]/10 pb-3">
                  {subj.name}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                  {subj.chapters.map(ch => {
                    const chCompletionPercent = getChapterProgress(ch);

                    return (
                      <motion.div 
                        key={ch.id}
                        whileHover={{ y: -4 }} 
                        onClick={() => navigate(`/student/explore/${subj.code}/${ch.id}`)}
                        className="bg-[#1800ad] text-[#f6f4ee] p-6 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-between gap-5 relative overflow-hidden group cursor-pointer shadow-lg border-2 border-[#1800ad] h-72"
                      >
                        {/* Decorative bloom background */}
                        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#f6f4ee]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

                        <div className="flex flex-col h-full z-10 justify-between">
                          <div className="flex justify-between items-start w-full">
                            <span className="text-[#f6f4ee]/70 font-semibold uppercase tracking-widest text-xs md:text-sm">
                              Chapter {ch.chapterNum}
                            </span>
                            {chCompletionPercent > 0 && (
                              <div className="px-2.5 py-1 bg-[#f6f4ee]/15 text-[#f6f4ee] rounded-full text-xs font-bold border border-[#f6f4ee]/20">
                                {chCompletionPercent === 100 ? 'Completed' : `${chCompletionPercent}% Done`}
                              </div>
                            )}
                          </div>

                          <div className="mt-2 flex-grow">
                            <h3 className="text-xl md:text-2xl font-bold text-[#f6f4ee] leading-tight group-hover:text-amber-300 transition-colors">
                              {ch.title}
                            </h3>
                            <p className="text-[#f6f4ee]/75 text-xs md:text-sm font-medium mt-2 line-clamp-3 leading-relaxed">
                              {ch.description}
                            </p>
                          </div>

                          <div className="mt-auto pt-4 border-t border-[#f6f4ee]/10 flex items-center justify-between w-full">
                            <span className="text-xs text-[#f6f4ee]/80 font-bold uppercase tracking-wider">
                              {ch.topics.length} {ch.topics.length === 1 ? 'Topic' : 'Topics'}
                            </span>
                            <div className="flex items-center gap-1 text-[#f6f4ee] font-bold text-xs">
                              <span>Enter Chapter</span>
                              <ChevronRight size={14} />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}

            {filteredSubjects.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
                <BookOpen size={64} className="text-[#1800ad] mb-4 opacity-50 animate-bounce" />
                <h3 className="text-xl font-bold text-[#1800ad]">No chapters found</h3>
                <p className="text-[#1800ad]">Try relaxing your search terms.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
