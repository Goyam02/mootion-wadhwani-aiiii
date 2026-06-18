import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  LayoutDashboard, 
  BookOpen, 
  BarChart2, 
  MessageSquare,
  Sparkles, 
  Play, 
  Sliders, 
  Globe2, 
  Award,
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  Flame, 
  Send,
  PlusCircle,
  Video,
  Info,
  Calendar,
  FileText,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Radio
} from 'lucide-react';
import { NavItem } from '../components/NavItem';
import { chaptersData } from '../data/syllabus';

type ActiveTab = 'storyboard' | 'playground' | 'universe' | 'quiz';

export function TeacherTopicSetupPage() {
  const { classId, chapterId, topicId } = useParams<{ classId: string; chapterId: string; topicId: string }>();
  const navigate = useNavigate();

  // Find routing and current topic details
  const chapter = chaptersData.find(c => c.id === chapterId);
  const topic = chapter?.topics.find(t => t.id === topicId);

  // Default meta values if missing
  const activeChapterName = chapter ? chapter.name : 'Force and Pressure';
  const activeChapterNumber = chapter ? chapter.number : 'Ch-01';
  const activeTopicTitle = topic ? topic.title : 'Introduction to Forces';
  const activeTopicNumber = topic ? topic.number : '01';

  // Active resource workspace tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('storyboard');

  // Custom AI prompt input
  const [customPrompt, setCustomPrompt] = useState('');
  
  // States of actions
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [assignedItemTitle, setAssignedItemTitle] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('2026-06-25');
  const [assignedStatus, setAssignedStatus] = useState<Record<string, boolean>>({});
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);

  // Generation progress state
  const [generationStep, setGenerationStep] = useState(0);

  // Search/Generate prompt inputs
  const [searchPrompt, setSearchPrompt] = useState('');

  const handleSearchGenerate = () => {
    if (!searchPrompt.trim()) return;
    setGeneratingCustom(true);
    setGenerationStep(0);
    const timer = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < stepsDescriptions.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setGeneratingCustom(false);
          const bespokeTitle = `Bespoke Interactive: ${searchPrompt}`;
          setAssignedItemTitle(bespokeTitle);
          setAssignmentNotes(`Hey students! Here is our custom interactive material on ${activeTopicTitle}. Let's explore its variables and physical reactions.`);
          setIsPreviewing(bespokeTitle);
          setSearchPrompt('');
          return 0;
        }
      });
    }, 1100);
  };

  const getPhetSimulationUrl = () => {
    switch (chapterId) {
      case 'chapter-1':
        return 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html';
      case 'chapter-2':
        return 'https://phet.colorado.edu/sims/html/friction/latest/friction_all.html';
      case 'chapter-3':
        return 'https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_all.html';
      case 'chapter-4':
        return 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html';
      case 'chapter-5':
        return 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html';
      case 'chapter-6':
        return 'https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html';
      case 'chapter-7':
        return 'https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html';
      case 'chapter-8':
        return 'https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_all.html';
      case 'chapter-9':
        return 'https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_all.html';
      case 'chapter-10':
        return 'https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html';
      default:
        return 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html';
    }
  };

  const getPreviewIframeUrl = () => {
    if (activeTab === 'storyboard') {
      return 'https://www.youtube.com/embed/P-A2b8zN54E?autoplay=1&mute=1&rel=0';
    }
    if (activeTab === 'universe') {
      return 'https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html';
    }
    return getPhetSimulationUrl();
  };

  // Mock pre-generated data tailored dynamically to the selected topic title
  const generatePreGeneratedContent = (tab: ActiveTab) => {
    switch (tab) {
      case 'storyboard':
        return [
          {
            id: 'sb-1',
            title: `Introductory Video: Foundations of ${activeTopicTitle}`,
            description: `An animated 10-minute conceptual journey introducing variables of ${activeTopicTitle} using standard NCERT and visual illustrations.`,
            duration: '8 mins',
            difficulty: 'Core',
            icon: <Play className="text-blue-500 stroke-[2.5]" size={20} />,
            creator: 'AI Assistant',
            rating: '4.9/5'
          },
          {
            id: 'sb-2',
            title: `Real-world Applications and Scenarios: ${activeTopicTitle}`,
            description: `A documentary style presentation tracking ${activeTopicTitle} elements in engineering, space research, and daily home life.`,
            duration: '12 mins',
            difficulty: 'Intermediate',
            icon: <Play className="text-violet-500 stroke-[2.5]" size={20} />,
            creator: 'Prof. Alistair',
            rating: '4.8/5'
          },
          {
            id: 'sb-3',
            title: `Deep-dive Mathematical Proofs on ${activeTopicTitle}`,
            description: `Rigorous blackboard-style calculations deriving formulas, vector directions, and units representing ${activeTopicTitle}.`,
            duration: '15 mins',
            difficulty: 'Advanced',
            icon: <Play className="text-indigo-500 stroke-[2.5]" size={20} />,
            creator: 'IIT Kanpur Sync',
            rating: '4.7/5'
          },
          {
            id: 'sb-4',
            title: `Interactive Lab Demonstration: ${activeTopicTitle}`,
            description: `A recorded step-by-step experiment modeling variables under real-world vacuum, ambient air, and thermal chamber conditions.`,
            duration: '6 mins',
            difficulty: 'Core',
            icon: <Play className="text-purple-500 stroke-[2.5]" size={20} />,
            creator: 'NCERT Lab Sync',
            rating: '4.9/5'
          },
          {
            id: 'sb-5',
            title: `Common Misconceptions of ${activeTopicTitle}`,
            description: `Short 5-minute video focusing on tricky board exam queries where students commit sign convention errors.`,
            duration: '5 mins',
            difficulty: 'Core',
            icon: <Play className="text-amber-500 stroke-[2.5]" size={20} />,
            creator: 'AI Tutor',
            rating: '4.9/5'
          },
          {
            id: 'sb-6',
            title: `Advanced Olympiad Problems regarding ${activeTopicTitle}`,
            description: `Challenging physics Olympiad cases analyzed with high-contrast animated free body diagrams (FBDs).`,
            duration: '18 mins',
            difficulty: 'Advanced',
            icon: <Play className="text-red-500 stroke-[2.5]" size={20} />,
            creator: 'Olympiad Core',
            rating: '4.9/5'
          }
        ];
      case 'playground':
        return [
          {
            id: 'pg-1',
            title: `${activeTopicTitle} Vector Sandbox`,
            description: `An open-ended sandbox canvas letting students design active vector force logs and watch real-time net displacement dynamics.`,
            duration: 'Interactive',
            difficulty: 'Core',
            icon: <Sliders className="text-blue-500 stroke-[2.5]" size={20} />,
            creator: 'Interactive Lab',
            rating: '5.0/5'
          },
          {
            id: 'pg-2',
            title: `Particle Level Collisions: ${activeTopicTitle}`,
            description: `A micro-scale fluid and gas simulator demonstrating how molecular bonds yield resistive pressure loops under loaded states.`,
            duration: 'Interactive',
            difficulty: 'Intermediate',
            icon: <Sliders className="text-violet-500 stroke-[2.5]" size={20} />,
            creator: 'Fluid Sim Core',
            rating: '4.9/5'
          },
          {
            id: 'pg-3',
            title: `Friction-Pressure Ratio Calibration Bench`,
            description: `A quantitative workspace grapher where students select dynamic material coefficients and record expansion data points.`,
            duration: '10 mins',
            difficulty: 'Advanced',
            icon: <Sliders className="text-indigo-500 stroke-[2.5]" size={20} />,
            creator: 'Graph Workbench',
            rating: '4.8/5'
          },
          {
            id: 'pg-4',
            title: `Bimetallic Expansion Slider Interface`,
            description: `Visual slider allowing manual temperature inputs to inspect mechanical bending vectors and threshold micro-switches.`,
            duration: 'Interactive',
            difficulty: 'Core',
            icon: <Sliders className="text-purple-500 stroke-[2.5]" size={20} />,
            creator: 'Thermodynamics Lab',
            rating: '4.7/5'
          },
          {
            id: 'pg-5',
            title: `Gravity and Acceleration Lab Suite`,
            description: `Calculate gravitational pull coefficients with interactive drop variables on different terrestrial planet bodies.`,
            duration: 'Interactive',
            difficulty: 'Core',
            icon: <Sliders className="text-emerald-500 stroke-[2.5]" size={20} />,
            creator: 'Astrophysics Team',
            rating: '4.9/5'
          },
          {
            id: ' pg-6',
            title: `${activeTopicTitle} Formula Workbench`,
            description: `A simple drag-and-drop equation balance calculator validating numeric inputs with real-time scalar visualizations.`,
            duration: 'Interactive',
            difficulty: 'Core',
            icon: <Sliders className="text-red-500 stroke-[2.5]" size={20} />,
            creator: 'Formula Mechanics',
            rating: '4.8/5'
          }
        ];
      case 'universe':
        return [
          {
            id: 'un-1',
            title: `Tectonic Plate Displacement: 3D Universe Map`,
            description: `Explore geological stress build-ups, primary wave lines, and focal depths in a detailed global tectonic globe.`,
            duration: 'Interactive Map',
            difficulty: 'Core',
            icon: <Globe2 className="text-blue-500 stroke-[2.5]" size={20} />,
            creator: 'Earth-Space Core',
            rating: '5.0/5'
          },
          {
            id: 'un-2',
            title: `Electrolytic Ion Flow Cosmos Model`,
            description: `A 3D planetary sub-atomic model highlighting copper ion displacement paths during intensive chrome electroplating cycles.`,
            duration: 'Simulate',
            difficulty: 'Advanced',
            icon: <Globe2 className="text-violet-500 stroke-[2.5]" size={20} />,
            creator: 'Sub-atomic Suite',
            rating: '4.9/5'
          },
          {
            id: 'un-3',
            title: `Constellation Alignment Orbit Tracker`,
            description: `Navigate stellar coordinates, view space vectors, and locate Ursa Major from customized polar coordinates.`,
            duration: 'Cosmic Trip',
            difficulty: 'Core',
            icon: <Globe2 className="text-indigo-500 stroke-[2.5]" size={20} />,
            creator: 'Outer Orbit lab',
            rating: '4.9/5'
          },
          {
            id: 'un-4',
            title: `Acoustic Compression Waves Universe Map`,
            description: `A visual simulator of sound media showing molecular expansion voids and pressure zones progressing inside heavy air layers.`,
            duration: 'Wave Visual',
            difficulty: 'Intermediate',
            icon: <Globe2 className="text-purple-500 stroke-[2.5]" size={20} />,
            creator: 'Acoustics Lab',
            rating: '4.8/5'
          },
          {
            id: 'un-5',
            title: `Deep-space Vacuum Sound Void`,
            description: `Experience the propagation parameters of electromagnetic waves in stellar nebulae versus earth-bound mediums.`,
            duration: 'Simulate',
            difficulty: 'Intermediate',
            icon: <Globe2 className="text-teal-500 stroke-[2.5]" size={20} />,
            creator: 'Cosmo-Physics',
            rating: '4.9/5'
          },
          {
            id: 'un-6',
            title: `Hydraulic Archimedes Ocean Void`,
            description: `A sub-surface ocean floor biome modeling water column densities on deep-sea exploratory submarine bulkheads.`,
            duration: 'Interactive Void',
            difficulty: 'Advanced',
            icon: <Globe2 className="text-emerald-500 stroke-[2.5]" size={20} />,
            creator: 'Oceanic Physics',
            rating: '4.9/5'
          }
        ];
      case 'quiz':
        return [
          {
            id: 'qz-1',
            title: `Foundations Assessment on ${activeTopicTitle}`,
            description: `10 diagnostic dual-choice and multiple response queries assessing primitive understandings of ${activeTopicTitle}.`,
            duration: '10 Qs',
            difficulty: 'Core',
            icon: <Award className="text-blue-500 stroke-[2.5]" size={20} />,
            creator: 'Academic Board',
            rating: '4.9/5'
          },
          {
            id: 'qz-2',
            title: `Computational Formula Sprint: ${activeTopicTitle}`,
            description: `A time-bound scalar computation assessment evaluating unit accuracy, friction conversions and pressure ratios.`,
            duration: '8 Qs',
            difficulty: 'Advanced',
            icon: <Award className="text-violet-500 stroke-[2.5]" size={20} />,
            creator: 'Math Physics Hub',
            rating: '4.8/5'
          },
          {
            id: 'qz-3',
            title: `NCERT Syllabus Chapter Exemplar`,
            description: `Classic board exam scenario testing utilizing state-of-the-art conceptual matching columns and error diagnostics.`,
            duration: '15 Qs',
            difficulty: 'Intermediate',
            icon: <Award className="text-indigo-500 stroke-[2.5]" size={20} />,
            creator: 'Exemplar Sync',
            rating: '4.9/5'
          },
          {
            id: 'qz-4',
            title: `Lightning & Discharge Spark Quiz`,
            description: `Evaluates students' electrostatic charge understanding, gold leaf reactions, and safe lightning rod mechanics.`,
            duration: '5 Qs',
            difficulty: 'Core',
            icon: <Award className="text-purple-500 stroke-[2.5]" size={20} />,
            creator: 'Meteorological Inst',
            rating: '4.7/5'
          },
          {
            id: 'qz-5',
            title: `Olympiad Mechanics Brainbuster`,
            description: `High IQ logic puzzle test involving combinations of friction coefficients, vectors and multi-surface tension arrays.`,
            duration: '12 Qs',
            difficulty: 'Advanced',
            icon: <Award className="text-rose-500 stroke-[2.5]" size={20} />,
            creator: 'Olympiad Core',
            rating: '5.0/5'
          },
          {
            id: 'qz-6',
            title: `Interactive Graph Analysis Challenge`,
            description: `Analyze bimetallic strips and liquid volume graphs to determine expansion values beneath linear heating.`,
            duration: '10 Qs',
            difficulty: 'Intermediate',
            icon: <Award className="text-emerald-500 stroke-[2.5]" size={20} />,
            creator: 'Data Physics Lab',
            rating: '4.8/5'
          }
        ];
    }
  };

  const currentTabItems = generatePreGeneratedContent(activeTab);

  // Directly assign an item
  const handleAssignItem = (title: string, itemId: string) => {
    setAssignedItemTitle(title);
    setAssignmentNotes(`Hey students! Please complete this interactive topic resource regarding ${activeTopicTitle}. Let me know if you run into any computational queries!`);
    setIsSuccessModalOpen(true);
    setAssignedStatus(prev => ({ ...prev, [itemId]: true }));
  };

  // Trigger custom AI Generator workflow
  const handleGenerateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setGeneratingCustom(true);
    setGenerationStep(0);

    // Dynamic compilation steps simulator
    const steps = [
      'Parsing your custom physics pedagogy query...',
      'Mapping NCERT syllabus topics and key sub-concepts...',
      'Synthesizing 3D vector parameters and particle configurations...',
      'Compiling interactive questions & calibration slider constraints...',
      'Finalizing deployment bundle to Class 8 student dashboards...'
    ];

    const timer = setInterval(() => {
      setGenerationStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setGeneratingCustom(false);
          setAssignedItemTitle(`Custom AI Resource: ${customPrompt}`);
          setAssignmentNotes(`Successfully compiled bespoke material matching: "${customPrompt}"`);
          setIsSuccessModalOpen(true);
          setCustomPrompt('');
          return 0;
        }
      });
    }, 1100);
  };

  const stepsDescriptions = [
    'Parsing your custom physics pedagogy query...',
    'Mapping NCERT syllabus topics and key sub-concepts...',
    'Synthesizing 3D vector parameters and particle configurations...',
    'Compiling interactive questions & calibration slider constraints...',
    'Finalizing deployment bundle to Class 8 student dashboards...'
  ];

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

        <div onClick={() => navigate('/')} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-montserrat font-black text-lg">P</span>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-24 relative flex flex-col h-full font-montserrat">
        
        {/* Back Link Header */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <button 
            onClick={() => navigate(`/teacher/class/${classId}`)}
            className="p-2 border-2 border-[#1800ad] rounded-full text-[#1800ad] hover:bg-[#1800ad]/10 transition-all font-montserrat flex items-center justify-center"
          >
            <ArrowLeft size={16} className="stroke-[3]" />
          </button>
          <span className="text-xs font-bold uppercase tracking-wider opacity-85">
            Back to Topics breakdown
          </span>
        </div>

        {/* Dynamic Topic Context Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-8 border-b-2 border-[#1800ad]/15 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#1800ad] text-[#f6f4ee] px-3 py-1 rounded-full">
                {activeChapterNumber} • Topic {activeTopicNumber}
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

        {/* 4 INTERACTIVE MODULES TAB CONTAINER */}
        <div className="w-full flex-1 flex flex-col gap-8">
          
          {/* Segment Selector for 4 modes - proper square containers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            
            <button
              onClick={() => setActiveTab('storyboard')}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-montserrat transition-all relative ${
                activeTab === 'storyboard' 
                  ? 'bg-[#1800ad] text-[#f6f4ee] shadow-md scale-[1.02]' 
                  : 'bg-[#1800ad]/5 hover:bg-[#1800ad]/10 text-[#1800ad] border-2 border-[#1800ad]/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${activeTab === 'storyboard' ? 'bg-[#f6f4ee]/15 text-[#f6f4ee]' : 'bg-[#1800ad]/10 text-[#1800ad]'}`}>
                <Video size={22} className="stroke-[2.5]" />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black uppercase tracking-wider">Storyboard</span>
                <span className="block text-[10px] opacity-75 leading-none mt-0.5 hidden sm:block">Video lessons</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('playground')}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-montserrat transition-all relative ${
                activeTab === 'playground' 
                  ? 'bg-[#1800ad] text-[#f6f4ee] shadow-md scale-[1.02]' 
                  : 'bg-[#1800ad]/5 hover:bg-[#1800ad]/10 text-[#1800ad] border-2 border-[#1800ad]/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${activeTab === 'playground' ? 'bg-[#f6f4ee]/15 text-[#f6f4ee]' : 'bg-[#1800ad]/10 text-[#1800ad]'}`}>
                <Sliders size={22} className="stroke-[2.5]" />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black uppercase tracking-wider">Playground</span>
                <span className="block text-[10px] opacity-75 leading-none mt-0.5 hidden sm:block">Interactive Sim</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('universe')}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-montserrat transition-all relative ${
                activeTab === 'universe' 
                  ? 'bg-[#1800ad] text-[#f6f4ee] shadow-md scale-[1.02]' 
                  : 'bg-[#1800ad]/5 hover:bg-[#1800ad]/10 text-[#1800ad] border-2 border-[#1800ad]/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${activeTab === 'universe' ? 'bg-[#f6f4ee]/15 text-[#f6f4ee]' : 'bg-[#1800ad]/10 text-[#1800ad]'}`}>
                <Globe2 size={22} className="stroke-[2.5]" />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black uppercase tracking-wider">Universe</span>
                <span className="block text-[10px] opacity-75 leading-none mt-0.5 hidden sm:block">3D Cosmological map</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-montserrat transition-all relative ${
                activeTab === 'quiz' 
                  ? 'bg-[#1800ad] text-[#f6f4ee] shadow-md scale-[1.02]' 
                  : 'bg-[#1800ad]/5 hover:bg-[#1800ad]/10 text-[#1800ad] border-2 border-[#1800ad]/10'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${activeTab === 'quiz' ? 'bg-[#f6f4ee]/15 text-[#f6f4ee]' : 'bg-[#1800ad]/10 text-[#1800ad]'}`}>
                <Award size={22} className="stroke-[2.5]" />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black uppercase tracking-wider">Quiz</span>
                <span className="block text-[10px] opacity-75 leading-none mt-0.5 hidden sm:block">Dynamic assessment</span>
              </div>
            </button>

          </div>

          {/* SEARCH & DYNAMIC GENERATION BAR AI REMOVAL DECONGESTION */}
          <div className="flex flex-col gap-2.5 mt-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={searchPrompt}
                  onChange={(e) => setSearchPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchGenerate();
                    }
                  }}
                  placeholder={`Generate your own ${activeTab} content... (e.g. Variable parameters, customized lab layouts)`}
                  className="w-full bg-[#f6f4ee] text-[#1800ad] placeholder-[#1800ad]/40 border-2 border-[#1800ad]/15 px-6 py-3.5 rounded-full text-xs font-bold focus:outline-none focus:border-[#1800ad] transition-all font-montserrat"
                />
              </div>
              <button
                onClick={handleSearchGenerate}
                disabled={generatingCustom || !searchPrompt.trim()}
                className="w-full sm:w-auto bg-[#1800ad] hover:bg-amber-300 hover:text-[#1800ad] text-[#f6f4ee] font-extrabold uppercase tracking-widest text-[11px] px-8 py-3.5 rounded-full transition-all shadow-md flex items-center justify-center gap-2 font-montserrat shrink-0 disabled:opacity-40"
              >
                {generatingCustom ? (
                  <>
                    <Loader2 size={13} className="animate-spin stroke-[2.5]" /> Creating...
                  </>
                ) : (
                  <>
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* GRID OF PRE-GENERATED RESOURCES FOR SELECTED TAB */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-[#1800ad]">
                Pre-Generated {activeTab} Activity Elements (6 available)
              </h2>
            </div>

            {/* PRE-GENERATED RECTANGULAR OPTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentTabItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-[#1800ad]/5 hover:bg-[#1800ad]/10 p-5 rounded-2xl border-2 border-[#1800ad]/15 hover:border-[#1800ad]/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Compact Card Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-[#f6f4ee] p-2 rounded-xl border border-[#1800ad]/15 text-[#1800ad]">
                        {item.icon}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold bg-[#1800ad]/10 text-[#1800ad] px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.difficulty}
                        </span>
                        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {item.rating}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-extrabold text-[#1800ad] tracking-tight leading-snug line-clamp-2 mb-1.5">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-[#1800ad]/75 leading-relaxed line-clamp-3 mb-4 font-semibold">
                      {item.description}
                    </p>
                  </div>

                  {/* Actions Area */}
                  <div className="border-t border-[#1800ad]/10 pt-3 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-extrabold text-[#1800ad]/60 uppercase tracking-widest">
                      {item.duration} • By {item.creator}
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsPreviewing(item.title)}
                        className="px-3 py-1.5 border border-[#1800ad]/20 hover:bg-[#1800ad]/5 transition-all text-[10px] font-black rounded-lg uppercase tracking-wider text-[#1800ad]"
                      >
                        Preview
                      </button>

                      <button
                        onClick={() => handleAssignItem(item.title, item.id)}
                        disabled={assignedStatus[item.id]}
                        className={`px-3 py-1.5 transition-all text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 ${
                          assignedStatus[item.id]
                            ? 'bg-emerald-600 text-[#f6f4ee] pointer-events-none'
                            : 'bg-[#1800ad] text-[#f6f4ee] hover:bg-[#1800ad]/90'
                        }`}
                      >
                        {assignedStatus[item.id] ? (
                          <>
                            <CheckCircle2 size={11} className="stroke-[3]" /> Assigned
                          </>
                        ) : (
                          'Assign'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* MODAL 1: PREVIEW DETAILED VIEW AND SIMULATION VARIABLES OVERVIEW */}
      <AnimatePresence>
        {isPreviewing && (
          <div 
            onClick={() => setIsPreviewing(null)}
            className="fixed inset-0 bg-[#1800ad]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#f6f4ee] rounded-[32px] p-6 md:p-8 border-2 border-[#1800ad] text-[#1800ad] font-montserrat relative shadow-2xl flex flex-col justify-between max-h-[92vh] overflow-y-auto max-w-5xl w-[95%] cursor-default"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#1800ad] text-[#f6f4ee] px-2.5 py-1 rounded-full">
                      Interactive Live Simulator Preview
                    </span>
                    <span className="text-xs font-bold opacity-85 uppercase tracking-widest bg-[#1800ad]/10 px-2.5 py-1 rounded-full text-[#1800ad]">
                      {activeTab} mode
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold tracking-tight text-[#1800ad] leading-snug">
                    {isPreviewing}
                  </h3>
                </div>

                {activeTab === 'universe' && (
                  <button
                    onClick={() => alert("Broadcasting cosmological 3D viewport coordinates with loaded vectors to all students' personal learning hubs in real-time!")}
                    className="bg-[#1800ad] hover:bg-amber-300 hover:text-[#1800ad] text-[#f6f4ee] py-2 px-4 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 shadow-md shrink-0 border border-[#1800ad]/25 animate-pulse"
                  >
                    <Radio size={12} className="stroke-[3]" /> Broadcast to Class
                  </button>
                )}
              </div>
              
              <p className="text-xs text-[#1800ad]/80 leading-relaxed font-semibold mb-5">
                Preview dynamic model layers. In this workspace state, teachers evaluate molecular layouts, vector arrows, sound vibration speeds, and question blocks. Any parameter changed is safely persistent.
              </p>

              {/* SIMULATED WORKSPACE CANVAS ELEMENTS */}
              <div className="w-full mb-6">
                <div className="w-full bg-[#1800ad]/5 rounded-2xl overflow-hidden relative border-2 border-[#1800ad] shadow-inner" style={{ height: '400px', minHeight: '300px' }}>
                  <iframe
                    src={getPreviewIframeUrl()}
                    title="Simulation Viewport"
                    allowFullScreen
                    className="w-full h-full border-0"
                    style={{ background: '#ffffff' }}
                  />
                </div>
              </div>

              <div className="flex gap-3.5 mt-2">
                <button
                  onClick={() => setIsPreviewing(null)}
                  className="flex-1 bg-[#1800ad]/10 hover:bg-[#1800ad]/20 text-[#1800ad] py-3.5 rounded-full text-xs font-black uppercase tracking-widest active:scale-95 transition-all text-center font-montserrat"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (isPreviewing) {
                      setAssignedItemTitle(isPreviewing);
                      setAssignmentNotes(`Hey students! Here is our custom interactive material on ${activeTopicTitle}. Let's explore its variables and physical reactions.`);
                      setIsPreviewing(null);
                      setIsSuccessModalOpen(true);
                    }
                  }}
                  className="flex-1 bg-[#1800ad] hover:bg-indigo-900 text-[#f6f4ee] py-3.5 rounded-full text-xs font-black uppercase tracking-widest active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 font-montserrat shadow-md"
                >
                  <CheckCircle2 size={13} className="stroke-[3]" /> Assign
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: SUCCESS CELEBRATION ASSIGNMENT MODAL WITH CONFIG NOTES */}
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
                Class 8 Physics group notified on dashboard
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
