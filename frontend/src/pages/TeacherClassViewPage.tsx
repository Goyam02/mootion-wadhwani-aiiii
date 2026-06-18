<<<<<<< HEAD
import React, { useState } from 'react';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  BookOpen, 
  BarChart2, 
  MessageSquare,
  Users,
  Layers,
  ChevronRight,
  BookMarked,
  Info
} from 'lucide-react';
import { NavItem } from '../components/NavItem';
<<<<<<< HEAD
import { chaptersData, Chapter, Topic } from '../data/syllabus';
=======
import { api } from '../lib/api';
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9

export function TeacherClassViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

<<<<<<< HEAD
  // Selected chapter state for active topics breakdown
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const getClassMeta = () => {
    const rawId = (id || '').toLowerCase();
    
    if (rawId.includes('math')) {
      return { grade: 'Class 8', subject: 'Mathematics', students: 28 };
    }
    if (rawId.includes('chem')) {
      return { grade: 'Class 8', subject: 'Chemistry', students: 25 };
    }
    
    return { grade: 'Class 8', subject: 'Physics', students: 24 };
  };

  const meta = getClassMeta();

  const chapters = chaptersData;
  const selectedChapter = chapters.find(ch => ch.id === selectedChapterId);
=======
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [resolvedClass, setResolvedClass] = useState<any | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedChapterDetails, setSelectedChapterDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    const loadClassAndSyllabus = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const classes = await api.get('/teachers/classes');
        
        const rawId = (id || '').toLowerCase();
        const parts = rawId.split('-');
        const classIdx = parts.indexOf('class');
        let gradeVal = '';
        if (classIdx !== -1 && parts[classIdx + 1]) {
          gradeVal = parts[classIdx + 1];
        } else {
          const match = rawId.match(/\d+/);
          if (match) gradeVal = match[0];
        }
        const subjectPart = parts
          .filter((p) => p !== 'class' && p !== gradeVal)
          .join(' ');

        const matchedClass = classes.find((c: any) => 
          (c.grade.toLowerCase() === gradeVal.toLowerCase() || c.grade.replace(/\D/g, '') === gradeVal) &&
          c.subject.toLowerCase() === subjectPart.toLowerCase()
        );

        if (!matchedClass) {
          throw new Error(`Class not found for grade "${gradeVal}" and subject "${subjectPart}"`);
        }

        setResolvedClass(matchedClass);
        const classId = matchedClass.class_id;

        setLoadingStep("Checking curriculum...");
        let curricula = await api.get(`/teachers/classes/${classId}/curriculum`);
        let activeCurriculum = null;

        if (curricula.length === 0) {
          setLoadingStep("Setting up your curriculum...");
          if (matchedClass.subject === 'Science') {
            const grade = matchedClass.grade;
            const bootRes = await api.post(`/teachers/classes/${classId}/curriculum`, {
              title: `Science - Class ${grade}`,
              curriculum_data: {
                title: `Science - Class ${grade}`,
                subject: "Science",
                grade: `${grade}`,
                source_type: "manual",
                root: {
                  id: "root",
                  title: `Science - Class ${grade}`,
                  kind: "module",
                  order: 0,
                  metadata: {},
                  children: [
                    { id: "unit_1", title: "Matter and Materials", kind: "unit", order: 0, metadata: {}, children: [] },
                    { id: "unit_2", title: "Living World", kind: "unit", order: 1, metadata: {}, children: [] },
                    { id: "unit_3", title: "Force and Energy", kind: "unit", order: 2, metadata: {}, children: [] },
                    { id: "unit_4", title: "Natural Phenomena", kind: "unit", order: 3, metadata: {}, children: [] },
                    { id: "unit_5", title: "Our Environment", kind: "unit", order: 4, metadata: {}, children: [] }
                  ]
                }
              },
              status: "draft"
            });
            activeCurriculum = bootRes;
          } else {
            const bootRes = await api.post(`/teachers/classes/${classId}/curriculum/bootstrap`);
            activeCurriculum = bootRes;
          }
        } else {
          activeCurriculum = curricula.find((c: any) => c.status === 'active') || curricula[0];
        }

        const curriculumId = activeCurriculum.curriculum_id;

        setLoadingStep("Fetching chapters...");
        let fetchedChapters = await api.get(`/teachers/classes/${classId}/chapters`);

        if (fetchedChapters.length === 0) {
          setLoadingStep("Generating chapters...");
          await api.post(`/teachers/classes/${classId}/chapters/bootstrap`, {
            curriculum_id: curriculumId
          });
          setLoadingStep("Loading chapters...");
          fetchedChapters = await api.get(`/teachers/classes/${classId}/chapters`);
        }

        const sorted = [...fetchedChapters].sort((a: any, b: any) => a.sequence_number - b.sequence_number);
        setChapters(sorted);
      } catch (err: any) {
        console.error(err);
        setError(err.detail || err.message || "Failed to load classroom details");
      } finally {
        setIsLoading(false);
        setLoadingStep(null);
      }
    };

    loadClassAndSyllabus();
  }, [id]);

  useEffect(() => {
    if (!selectedChapterId || !resolvedClass) {
      setSelectedChapterDetails(null);
      return;
    }
    const fetchChapterDetails = async () => {
      setIsLoadingDetails(true);
      try {
        const data = await api.get(`/teachers/classes/${resolvedClass.class_id}/chapters/${selectedChapterId}`);
        setSelectedChapterDetails(data);
      } catch (err) {
        console.error("Failed to fetch chapter details:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    fetchChapterDetails();
  }, [selectedChapterId, resolvedClass]);

  const meta = {
    grade: resolvedClass ? `Class ${resolvedClass.grade}` : 'Loading...',
    subject: resolvedClass ? resolvedClass.subject : 'Loading...',
    students: 24
  };

  const selectedChapter = chapters.find(ch => ch.chapter_id === selectedChapterId);
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      
      {/* Mobile Bottom Navigation Bar styled with Montserrat */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-6 py-2.5 flex justify-between items-center z-40 rounded-full border-[2px] border-[#f6f4ee] shadow-xl font-montserrat">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
        <NavItem icon={<BookOpen size={24} />} active onClick={() => navigate(`/teacher/class/${id}`)} />
        <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
        <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
      </nav>

      {/* Sidebar - Desktop styled with Montserrat */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30 font-montserrat">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-montserrat font-black text-3xl leading-none tracking-widest">M</span>
        </div>

        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
          <NavItem icon={<BookOpen size={24} />} active onClick={() => navigate(`/teacher/class/${id}`)} />
          <NavItem icon={<BarChart2 size={24} />} onClick={() => navigate('/teacher/analytics')} />
          <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
        </nav>

        <div onClick={() => navigate('/')} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-montserrat font-black text-lg">P</span>
        </div>
      </aside>

      {/* Main Content Pane styled strictly with Montserrat */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full font-montserrat">
        
        <div className="w-full">
          
<<<<<<< HEAD
          {/* Back Action Header - only shows when inside a chapter's topics */}
          {selectedChapterId && (
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setSelectedChapterId(null)}
                className="p-2 border-2 border-[#1800ad] rounded-full text-[#1800ad] hover:bg-[#1800ad]/10 transition-colors"
              >
                <ArrowLeft size={16} className="stroke-[3]" />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider opacity-85">
                Back to Chapters
              </span>
            </div>
          )}
=======
          {/* Back Action Header */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => {
                if (selectedChapterId) {
                  setSelectedChapterId(null);
                } else {
                  navigate('/teacher/home');
                }
              }}
              className="p-2 border-2 border-[#1800ad] rounded-full text-[#1800ad] hover:bg-[#1800ad]/10 transition-colors"
            >
              <ArrowLeft size={16} className="stroke-[3]" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">
              {selectedChapterId ? 'Back to Chapters' : 'Classroom Index'}
            </span>
          </div>
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9

          {/* Classroom Header Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1800ad]/15 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#1800ad] text-[#f6f4ee] px-3 py-1 rounded-full">
                  {meta.grade}
                </span>
                <span className="text-xs font-bold text-[#1800ad] flex items-center gap-1.5 bg-[#1800ad]/5 px-3 py-1 rounded-full">
                  <Users size={13} />
                  {meta.students} students enrolled
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#1800ad] tracking-tight">
                {meta.subject} {selectedChapterId ? 'Topics Breakdown' : 'Chapters'}
              </h1>
            </div>
          </div>

          {/* CONDITIONAL LAYOUTS */}
          <AnimatePresence mode="wait">
<<<<<<< HEAD
            {!selectedChapterId ? (
=======
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 w-full"
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-t-[#1800ad] border-r-transparent border-b-transparent border-l-transparent animate-spin duration-1000"></div>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-[#1800ad] tracking-tight">
                  {loadingStep || "Loading..."}
                </h2>
                <p className="text-xs font-bold text-[#1800ad]/60 uppercase tracking-widest mt-2 animate-pulse font-mono">
                  Please hold on
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-8 bg-red-50 border border-red-200 rounded-[28px] max-w-md mx-auto my-12"
              >
                <p className="text-red-700 font-bold text-sm mb-4">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-2.5 bg-[#1800ad] border-2 border-[#1800ad] text-[#f6f4ee] hover:bg-[#f6f4ee] hover:text-[#1800ad] font-bold text-xs rounded-full transition-all"
                >
                  Retry
                </button>
              </motion.div>
            ) : !selectedChapterId ? (
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
              
              /* CHAPTER LIST VIEW: Smaller in height blue containers */
              <motion.div
                key="chapters-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h2 className="text-lg font-extrabold text-[#1800ad] uppercase tracking-wide">
                    Syllabus Chapters ({chapters.length} loaded)
                  </h2>
                </div>
                
                {/* Compact, short blue grid cards instead of elongated/aspect-square ones */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {chapters.map((chapter, index) => {
                    return (
                      <motion.div
<<<<<<< HEAD
                        key={chapter.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        onClick={() => setSelectedChapterId(chapter.id)}
=======
                        key={chapter.chapter_id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        onClick={() => setSelectedChapterId(chapter.chapter_id)}
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
                        className="h-[148px] bg-[#1800ad] text-[#f6f4ee] p-5 rounded-[22px] border-[2px] border-[#1800ad] hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                      >
                        {/* Compact Top Header */}
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#f6f4ee]/80">
<<<<<<< HEAD
                            {chapter.number}
                          </span>
                          <span className="text-[11px] font-semibold text-[#f6f4ee]/90 flex items-center gap-1 bg-[#f6f4ee]/15 px-2 py-0.5 rounded-full">
                            {chapter.activitiesCount} Topics
=======
                            Chapter {chapter.sequence_number}
                          </span>
                          <span className="text-[11px] font-semibold text-[#f6f4ee]/90 flex items-center gap-1 bg-[#f6f4ee]/15 px-2 py-0.5 rounded-full">
                            {chapter.asset_count} Assets
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
                          </span>
                        </div>

                        {/* Title - Elegant Montserrat */}
                        <div className="my-1.5">
                          <h3 className="text-[15px] font-extrabold leading-snug tracking-tight text-[#f6f4ee] group-hover:text-amber-300 transition-colors line-clamp-2">
<<<<<<< HEAD
                            {chapter.name}
=======
                            {chapter.title}
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
                          </h3>
                        </div>

                        {/* Compact Footer Status */}
                        <div className="border-t border-[#f6f4ee]/15 pt-2 flex items-center justify-between text-[10px] font-bold">
<<<<<<< HEAD
                          <span className="text-[#f6f4ee]/80 lowercase font-medium truncate">
                            {chapter.statusLabel}
=======
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            chapter.status === 'data_ready' ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' :
                            chapter.status === 'active' ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30' :
                            chapter.status === 'generated' ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' :
                            'bg-[#f6f4ee]/15 text-[#f6f4ee]/80 border border-[#f6f4ee]/20'
                          }`}>
                            {chapter.status}
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
                          </span>
                          <span className="group-hover:translate-x-1.5 transition-transform text-xs font-black text-[#f6f4ee]">&rarr;</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

            ) : (

              /* TOPICS SUB-GRID VIEW: Renders when a chapter is selected and divided into Topics */
<<<<<<< HEAD
              /* Show exactly 15 beautifully structured topic containers with Chapter Name, Chapter Number, and Topic Title */
=======
              /* Show constituent assets beautifully */
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
              <motion.div
                key="topics-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-6"
              >
                {/* Description Header for divided sections */}
                <div className="bg-[#1800ad]/5 p-5 rounded-[24px] border-2 border-[#1800ad]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/70 flex items-center gap-1.5 mb-1">
                      <BookMarked size={12} />
                      ACTIVE FOCUS
                    </span>
                    <h2 className="text-xl font-extrabold text-[#1800ad] leading-tight">
<<<<<<< HEAD
                      {selectedChapter?.number} • {selectedChapter?.name}
                    </h2>
                    <p className="text-xs text-[#1800ad]/70 font-semibold mt-1">
                      All {selectedChapter?.topics.length} constituent subtopics are listed below as modular containers.
=======
                      Chapter {selectedChapter?.sequence_number} • {selectedChapter?.title}
                    </h2>
                    <p className="text-xs text-[#1800ad]/70 font-semibold mt-1">
                      All constituent subtopics and assets are listed below as modular containers.
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedChapterId(null)}
                    className="shrink-0 bg-[#1800ad] text-[#f6f4ee] px-4.5 py-2.5 rounded-full text-xs font-bold hover:bg-[#1800ad]/90 transition-all inline-flex items-center gap-1.5"
                  >
                    Change Chapter
                  </button>
                </div>

                {/* Topics Container Title */}
                <h3 className="text-lg font-extrabold text-[#1800ad] uppercase tracking-wide mt-2">
<<<<<<< HEAD
                  Interactive Topic Modules ({selectedChapter?.topics.length} loaded)
=======
                  Interactive Topic Modules ({selectedChapterDetails?.assets?.length || 0} loaded)
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
                </h3>

                {/* Grid of topic cards - compact blue cards exactly matching chapter cards size */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
<<<<<<< HEAD
                  {selectedChapter?.topics.map((topic, index) => {
                    return (
                      <motion.div
                        key={topic.id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        onClick={() => navigate(`/teacher/topic-setup/${id}/${selectedChapterId}/${topic.id}`)}
                        className="h-[148px] bg-[#1800ad] text-[#f6f4ee] p-5 rounded-[22px] border-[2px] border-[#1800ad] hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                      >
                        {/* Compact Top Header */}
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#f6f4ee]/80">
                            {selectedChapter?.number} • Topic {topic.number}
                          </span>
                          <span className="text-[9px] font-bold bg-[#f6f4ee]/15 px-2 py-0.5 rounded-md text-[#f6f4ee]/90 uppercase tracking-wider">
                            Interactive
                          </span>
                        </div>

                        {/* Title - Elegant Montserrat */}
                        <div className="my-1">
                          <h3 className="text-[14px] sm:text-[15px] font-extrabold leading-snug tracking-tight text-[#f6f4ee] group-hover:text-amber-300 transition-colors line-clamp-2">
                            {topic.title}
                          </h3>
                        </div>

                        {/* Compact Footer Status */}
                        <div className="border-t border-[#f6f4ee]/15 pt-2 flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#f6f4ee]/85 uppercase tracking-wide text-[9px] truncate max-w-[80%]">
                            {selectedChapter?.name}
                          </span>
                          <span className="group-hover:translate-x-1.5 transition-transform text-xs font-black text-[#f6f4ee]">&rarr;</span>
                        </div>

                        {/* Interactive glow effect */}
                        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-amber-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                      </motion.div>
                    );
                  })}
=======
                  {isLoadingDetails ? (
                    <div className="col-span-full py-8 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-[#1800ad]/20 border-t-[#1800ad] rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-[#1800ad]/60 animate-pulse">Loading topic modules...</span>
                    </div>
                  ) : !selectedChapterDetails || !selectedChapterDetails.assets || selectedChapterDetails.assets.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-[#1800ad]/60 font-semibold text-sm">
                      No interactive topic modules exist for this chapter.
                    </div>
                  ) : (
                    selectedChapterDetails.assets.map((asset: any, index: number) => {
                      return (
                        <motion.div
                          key={asset.asset_id}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          onClick={() => navigate(`/teacher/topic-setup/${id}/${selectedChapterId}/${asset.asset_id}`)}
                          className="h-[148px] bg-[#1800ad] text-[#f6f4ee] p-5 rounded-[22px] border-[2px] border-[#1800ad] hover:scale-[1.02] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                        >
                          {/* Compact Top Header */}
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#f6f4ee]/80">
                              Chapter {selectedChapterDetails.sequence_number} • {asset.asset_type}
                            </span>
                            <span className="text-[9px] font-bold bg-[#f6f4ee]/15 px-2 py-0.5 rounded-md text-[#f6f4ee]/90 uppercase tracking-wider">
                              Interactive
                            </span>
                          </div>

                          {/* Title - Elegant Montserrat */}
                          <div className="my-1">
                            <h3 className="text-[14px] sm:text-[15px] font-extrabold leading-snug tracking-tight text-[#f6f4ee] group-hover:text-amber-300 transition-colors line-clamp-2">
                              {asset.title}
                            </h3>
                          </div>

                          {/* Compact Footer Status */}
                          <div className="border-t border-[#f6f4ee]/15 pt-2 flex items-center justify-between text-[10px] font-bold">
                            <span className="text-[#f6f4ee]/85 uppercase tracking-wide text-[9px] truncate max-w-[80%]">
                              {selectedChapterDetails.title}
                            </span>
                            <span className="group-hover:translate-x-1.5 transition-transform text-xs font-black text-[#f6f4ee]">&rarr;</span>
                          </div>

                          {/* Interactive glow effect */}
                          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-amber-300 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                        </motion.div>
                      );
                    })
                  )}
>>>>>>> 93ce25c0b18f35057235b30240777cc56976c4f9
                </div>
              </motion.div>

            )}
          </AnimatePresence>

        </div>
      </main>

    </div>
  );
}
