import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare,
  Search,
  Users,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpenCheck,
  User,
  GraduationCap,
  Calendar,
  X,
  MessageCircle,
  Clock
} from 'lucide-react';
import { NavItem } from '../components/NavItem';

interface ClassInsight {
  id: string;
  className: string;
  subjectName: string;
  understanding: number;
  reasoning: number;
  expression: number;
  studentCount: number;
}

interface StudentRecord {
  name: string;
  understanding: number;
  reasoning: number;
  expression: number;
  progress: number;
  completedChapters: string[];
  recentMisconceptions: string[];
  recentAiResult: {
    prompt: string;
    answer: string;
    feedback: string;
    score: string;
  };
}

// Student database pool to dynamically select and populate at least 6 students
const studentPool = [
  { name: 'Aarav Sharma', avatarSeed: 'A' },
  { name: 'Poorvika Patel', avatarSeed: 'P' },
  { name: 'Rahul Shah', avatarSeed: 'R' },
  { name: 'Ishita Kapoor', avatarSeed: 'I' },
  { name: 'Dev Patel', avatarSeed: 'D' },
  { name: 'Kabir Mehta', avatarSeed: 'K' },
  { name: 'Sanya Sen', avatarSeed: 'S' },
  { name: 'Sneha Gupta', avatarSeed: 'G' },
  { name: 'Aditya Joshi', avatarSeed: 'Y' },
  { name: 'Ananya Reddy', avatarSeed: 'N' },
  { name: 'Arjun Verma', avatarSeed: 'J' },
  { name: 'Diya Malhotra', avatarSeed: 'X' }
];

const mockPromptsBySubject: Record<string, { prompt: string; answer: string; feedback: string }[]> = {
  'Physics': [
    {
      prompt: 'Describe why lubrication decreases mechanical wear over metallic surfaces.',
      answer: 'Lubricant fluid covers the microscopic mountain asperities on physical metals so they do not interlock and weld under force. They slide smoothly over the liquid cushion.',
      feedback: 'Excellent visualization of atomic-level friction interlocking relief.'
    },
    {
      prompt: 'Explain fluid displacement and buoyant upward force.',
      answer: 'When a brick sinks, it pushes aside its own volume of fluid. The mass of that displaced water pushes back upward, generating buoyant lift force.',
      feedback: 'Correct application of Archimedes Principle. Extremely concise.'
    }
  ],
  'Chemistry': [
    {
      prompt: 'Explain polar covalent electron sharing in a clear water compound.',
      answer: 'Oxygen is strongly electronegative and pulls the shared valence electrons closer to its nucleus, rendering the balance uneven and establishing a polar molecule.',
      feedback: 'Splendid comprehension of polar electronic structures and coordinate clouds.'
    },
    {
      prompt: 'What is the key structural layout difference between ionic crystal grids and single molecules?',
      answer: 'Ionic structures arrange in giant continuous repeating crystal arrays without individual cluster endpoints, unlike small custom molecules.',
      feedback: 'Outstanding explanation of lattice arrays.'
    }
  ],
  'Mathematics': [
    {
      prompt: 'Solve and detail balancing steps of: 4x - 12 = 28',
      answer: 'First add 12 to both sides of the balance equation, yielding 4x = 40. Then divide both sides by 4 to cleanly isolate variable x = 10.',
      feedback: 'Perfect description of linear structural separation operations.'
    },
    {
      prompt: 'Detail algebraic bracket expansions for: -3(y - 5)',
      answer: 'Using sign multiplication rules, expanding the coefficient yields -3y and -3 multiplied by -5 gives positive 15. The outcome is -3y + 15.',
      feedback: 'Superb application of constant polarity transformations.'
    }
  ],
  'Biology': [
    {
      prompt: 'Explain how mitochondria generate storage fuel inside a living animal cell.',
      answer: 'Mitochondria break down high-energy sugars during respiration, storing captured chemical potential energy inside molecular ATP batteries.',
      feedback: 'Clear, high-fidelity biological power system breakdown.'
    }
  ]
};

const getChaptersBySubject = (subject: string): string[] => {
  if (subject.includes('Phys')) {
    return ['Introduction to Forces', 'Contact vs Non-Contact Forces', 'Pressure Laws', 'Electromagnetic Action'];
  }
  if (subject.includes('Chem')) {
    return ['Atomic Structures & Valency', 'Covalent Bonds', 'Metals & Metallurgy', 'Acids & Bases'];
  }
  if (subject.includes('Math')) {
    return ['Variables & Algebraic Foundations', 'Linear Balancing Equations', 'Rational Coordinates', 'Polynomial Fractions'];
  }
  return ['Cell Dynamics', 'Tissue Configurations', 'Anatomy Systems', 'Plant Respiration'];
};

const getMisconceptionsBySubject = (subject: string): { title: string; percentage: number; count: number }[] => {
  if (subject.includes('Phys')) {
    return [
      { title: 'Students believe heavier bodies naturally fall faster in vacuum parameters.', percentage: 46, count: 14 },
      { title: 'Confusing density displacement weight with volume displacement.', percentage: 38, count: 11 },
      { title: 'Thinking static force does not exert work vectors.', percentage: 29, count: 8 }
    ];
  }
  if (subject.includes('Chem')) {
    return [
      { title: 'Assuming ionic crystals can form isolated molecular pairs.', percentage: 41, count: 12 },
      { title: 'Confusing chemical balance coefficients with valency sub-scripts.', percentage: 34, count: 10 }
    ];
  }
  if (subject.includes('Math')) {
    return [
      { title: 'Applying negative sign expansion rules incorrectly across parentheses.', percentage: 52, count: 16 },
      { title: 'Applying linear balance ratios on only single sides.', percentage: 45, count: 13 }
    ];
  }
  return [
    { title: 'Confusing active cell structure with inert passive chemical layers.', percentage: 30, count: 9 }
  ];
};

export function TeacherAnalyticsPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('mootion_teacher_setup');
    if (data) {
      setProfile(JSON.parse(data));
    }
  }, []);

  // Class Selection Setup
  const rawGrades = profile?.selectedGrades || [];
  const rawSubjects = profile?.selectedSubjects || [];
  
  const grades = rawGrades.length > 0 ? rawGrades : ['Class 6', 'Class 7', 'Class 8'];
  const subjects = rawSubjects.length > 0 ? rawSubjects : ['Physics', 'Chemistry', 'Mathematics'];

  // Form dynamic combination objects for class Insights
  const classInsights = React.useMemo(() => {
    const list: ClassInsight[] = [];
    grades.forEach((g: string, gIdx: number) => {
      subjects.forEach((s: string, sIdx: number) => {
        const id = `${g.toLowerCase().replace(/\s+/g, '')}_${s.toLowerCase().replace(/\s+/g, '')}`;
        // Deterministic mock variables based on indices
        const hash = g.charCodeAt(g.length - 1) + s.charCodeAt(0);
        list.push({
          id,
          className: g,
          subjectName: s,
          understanding: parseFloat((2.0 + (hash % 9) / 10).toFixed(1)),
          reasoning: parseFloat((1.8 + ((hash + 3) % 9) / 10).toFixed(1)),
          expression: parseFloat((2.1 + ((hash + 5) % 8) / 10).toFixed(1)),
          studentCount: 20 + (hash % 15)
        });
      });
    });
    return list;
  }, [grades, subjects]);

  // Set default class ID if current one is not selected or invalid
  useEffect(() => {
    if (classInsights.length > 0 && !selectedClassId) {
      setSelectedClassId(classInsights[0].id);
    }
  }, [classInsights, selectedClassId]);

  // Find active class insight details
  const activeClassInsight = classInsights.find(c => c.id === selectedClassId) || classInsights[0] || {
    className: 'Class 8',
    subjectName: 'Physics',
    studentCount: 28,
    understanding: 2.2,
    reasoning: 2.0,
    expression: 2.3
  };

  const activeSubject = activeClassInsight.subjectName;
  const activeClassName = activeClassInsight.className;

  // Generate at least 6 students dynamically for the selected class to provide high-volume data
  const studentsListForSelectedClass = React.useMemo(() => {
    const seed = activeClassInsight.className.charCodeAt(activeClassInsight.className.length - 1) + activeClassInsight.subjectName.charCodeAt(0);
    const samplePrompts = mockPromptsBySubject[activeSubject] || mockPromptsBySubject['Physics'];
    const sampleChapters = getChaptersBySubject(activeSubject);

    // Pick 6-7 student names deterministically based on seed
    const list: StudentRecord[] = [];
    for (let i = 0; i < 7; i++) {
      const pIdx = (seed + i) % studentPool.length;
      const studentInfo = studentPool[pIdx];
      const progress = 45 + ((seed + i * 13) % 51); // 45% to 95%
      
      const understanding = parseFloat((1.6 + ((seed + i * 7) % 15) / 10).toFixed(1));
      const reasoning = parseFloat((1.5 + ((seed + i * 9) % 15) / 10).toFixed(1));
      const expression = parseFloat((1.8 + ((seed + i * 5) % 13) / 10).toFixed(1));

      // Selected chapters based on progress
      const completedCount = Math.max(1, Math.floor((progress / 100) * sampleChapters.length));
      const completedChapters = sampleChapters.slice(0, completedCount);

      // Misconceptions
      const misconceptionsPool = getMisconceptionsBySubject(activeSubject);
      const isStruggling = (understanding + reasoning) < 4.2;
      const recentMisconceptions = isStruggling 
        ? [misconceptionsPool[i % misconceptionsPool.length].title]
        : [];

      // AI Result
      const promptObj = samplePrompts[i % samplePrompts.length] || samplePrompts[0];

      list.push({
        name: studentInfo.name,
        understanding,
        reasoning,
        expression,
        progress,
        completedChapters,
        recentMisconceptions,
        recentAiResult: {
          prompt: promptObj.prompt,
          answer: `"${promptObj.answer}"`,
          feedback: promptObj.feedback,
          score: `${(understanding).toFixed(1)} / 3.0`
        }
      });
    }
    return list;
  }, [activeClassInsight, activeSubject]);

  // Determine misconceptions to render
  const activeMisconceptions = getMisconceptionsBySubject(activeSubject);

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#f6f4ee] md:bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      
      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-6 py-2.5 flex justify-between items-center z-40 rounded-full border-[2px] border-[#f6f4ee] shadow-xl">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
        <NavItem icon={<BookOpen size={24} />} onClick={() => navigate('/teacher/class/class-8-physics')} />
        <NavItem icon={<BarChart2 size={24} />} active onClick={() => navigate('/teacher/analytics')} />
        <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
      </nav>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/teacher/home')} />
          <NavItem icon={<BookOpen size={24} />} onClick={() => navigate('/teacher/class/class-8-physics')} />
          <NavItem icon={<BarChart2 size={24} />} active onClick={() => navigate('/teacher/analytics')} />
          <NavItem icon={<MessageSquare size={24} />} onClick={() => navigate('/teacher/doubts')} />
        </nav>
        <div onClick={() => api.logout()} className="shrink-0 cursor-pointer flex items-center justify-center w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-all shadow-sm">
          <span className="text-[#1800ad] font-extrabold text-lg">P</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-4 md:p-8 lg:p-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-8 pb-32 lg:pb-12 h-full flex flex-col">
        
        {/* Header */}
        <header className="border-b-2 border-[#1800ad]/10 pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2.5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1800ad]/60 font-mono">Academic Diagnostic Suite</span>
            <h1 className="text-2xl md:text-3xl font-black text-[#1800ad] tracking-tight">
              Actionable Class Analytics
            </h1>
          </div>
          <p className="text-xs font-semibold text-[#1800ad]/70 leading-none">
            Review detailed understanding indicators, variables mapping, and conceptual blockages dynamically.
          </p>
        </header>

        {/* SECTION 1 - CLASS & SUBJECT AI INSIGHTS */}
        <section className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#1800ad]/60 mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-[#1800ad] stroke-[2.5]" />
            Section 1 — Class & Subject AI Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classInsights.map((insights) => {
              const isSelected = selectedClassId === insights.id;
              return (
                <div 
                  key={insights.id}
                  onClick={() => setSelectedClassId(insights.id)}
                  className={`bg-[#f6f4ee] rounded-3xl p-6 border-2 transition-all cursor-pointer shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[175px] ${
                    isSelected 
                      ? 'border-[#1800ad] bg-[#1800ad]/5 ring-2 ring-[#1800ad]/10 scale-[1.01]' 
                      : 'border-[#1800ad]/15 hover:border-[#1800ad]/50 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-[#1800ad]/10 text-[#1800ad] px-2.5 py-1 rounded-full">
                          {insights.className}
                        </span>
                        <h3 className="text-base font-black text-[#1800ad] mt-1.5 font-montserrat">
                          {insights.subjectName}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-[#1800ad]/70 flex items-center gap-1 font-mono">
                        <Users size={12} /> {insights.studentCount} Students
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 grid-flow-col border-t border-[#1800ad]/10 pt-3">
                      <div className="text-center md:text-left">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-[#1800ad]/60 leading-none mb-1">Understanding</span>
                        <span className="text-sm font-black text-[#1800ad]">{insights.understanding} <span className="text-[10px] opacity-60">/ 3</span></span>
                      </div>
                      <div className="text-center md:text-left">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-[#1800ad]/60 leading-none mb-1">Reasoning</span>
                        <span className="text-sm font-black text-[#1800ad]">{insights.reasoning} <span className="text-[10px] opacity-60">/ 3</span></span>
                      </div>
                      <div className="text-center md:text-left">
                        <span className="block text-[8px] font-black uppercase tracking-wider text-[#1800ad]/60 leading-none mb-1">Expression</span>
                        <span className="text-sm font-black text-[#1800ad]">{insights.expression} <span className="text-[10px] opacity-60">/ 3</span></span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute right-0 bottom-0 bg-[#1800ad] text-[#f6f4ee] text-[8px] font-black px-3 py-1 uppercase tracking-widest rounded-tl-xl">
                      Active Class Filter
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2 — COMMON MISCONCEPTIONS */}
        <section className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#1800ad]/60 mb-4 flex items-center gap-2">
            <AlertTriangle size={15} className="text-[#1800ad] stroke-[2.5]" />
            Section 2 — Common Misconceptions Detected By AI
          </h2>

          <div className="bg-white rounded-3xl p-6 border-2 border-[#1800ad]/15 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2 border-b border-[#1800ad]/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#1800ad] text-[#f6f4ee] text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                  {activeClassName}
                </span>
                <span className="text-sm font-black text-[#1800ad]">
                  {activeSubject} Misconceptions
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#1800ad]/70 uppercase tracking-wider">
                Showing top AI evaluated concept barriers
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {activeMisconceptions?.map((misconception, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl bg-[#f6f4ee]/50 border-2 border-[#1800ad]/10 hover:border-[#1800ad]/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5"
                >
                  <div className="flex-1 flex gap-3 items-start">
                    <span className="bg-[#1800ad] text-[#f6f4ee] w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[10px] font-black font-mono">
                      {idx + 1}
                    </span>
                    <p className="text-xs font-black text-[#1800ad] leading-relaxed">
                      {misconception.title}
                    </p>
                  </div>
                  
                  <div className="bg-[#1800ad]/10 rounded-xl px-4 py-2 text-right shrink-0 min-w-[150px] border border-[#1800ad]/10 w-full sm:w-auto">
                    <span className="block text-[11px] font-black text-[#1800ad] leading-none mb-1">
                      {misconception.percentage}% affected
                    </span>
                    <span className="block text-[9px] font-semibold text-[#1800ad]/75 uppercase tracking-wider">
                      {misconception.count} / {activeClassInsight.studentCount} students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 3 — STUDENT PROGRESS */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#1800ad]/60 flex items-center gap-2">
              <Users size={16} className="text-[#1800ad]/80 stroke-[2.5]" />
              Section 3 — Student Progress for {activeClassName} {activeSubject}
            </h2>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
              💡 Click any row to view full student AI evaluation trends
            </span>
          </div>

          <div className="bg-white rounded-3xl border-2 border-[#1800ad]/15 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-[#1800ad]/10 text-[#1800ad]/65 font-black uppercase tracking-wider bg-[#1800ad]/5 font-montserrat">
                    <th className="py-4.5 px-6">Student Name</th>
                    <th className="py-4.5 px-6">Understanding (avg)</th>
                    <th className="py-4.5 px-6">Reasoning (avg)</th>
                    <th className="py-4.5 px-6">Expression (avg)</th>
                    <th className="py-2 px-6">Completed Chapters</th>
                    <th className="py-4.5 px-6">Syllabus Progress</th>
                    <th className="py-4.5 px-6 text-right">Interactive Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1800ad]/10 font-semibold text-[#1800ad]/90">
                  {studentsListForSelectedClass.map((student, index) => (
                    <tr 
                      key={index} 
                      onClick={() => setSelectedStudent(student)}
                      className="hover:bg-[#1800ad]/5 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-black text-[#1800ad] flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#1800ad] text-white flex items-center justify-center text-[11px] font-black border border-[#1800ad]/20">
                          {student.name.charAt(0)}
                        </div>
                        {student.name}
                      </td>
                      <td className="py-4 px-6 font-mono font-bold">{student.understanding} / 3.0</td>
                      <td className="py-4 px-6 font-mono font-bold">{student.reasoning} / 3.0</td>
                      <td className="py-4 px-6 font-mono font-bold">{student.expression} / 3.0</td>
                      <td className="py-4 px-6 max-w-[200px] truncate opacity-80">{student.completedChapters.join(', ')}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3 w-full max-w-[140px]">
                          <div className="flex-1 bg-[#1800ad]/10 rounded-full h-2 overflow-hidden border border-[#1800ad]/5">
                            <div 
                              className="bg-[#1800ad] h-full rounded-full transition-all duration-500" 
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-black leading-none">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button className="text-[10px] font-black uppercase tracking-widest text-[#1800ad] border border-[#1800ad]/25 hover:border-[#1800ad] bg-[#f6f4ee] px-3.5 py-1.5 rounded-full transition-all inline-flex items-center gap-1.5 font-montserrat">
                          View details <ChevronRight size={12} className="stroke-[2.5]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* STUDENT DETAILED SCORECARD SIDE DRAWER / MODAL */}
      <AnimatePresence>
        {selectedStudent && (
          <div 
            onClick={() => setSelectedStudent(null)}
            className="fixed inset-0 bg-[#1800ad]/60 backdrop-blur-sm z-50 flex items-center justify-end"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#f6f4ee] border-l-4 border-[#1800ad] h-full w-full max-w-lg shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar"
            >
              <div>
                
                {/* Header info */}
                <div className="flex items-start justify-between border-b border-[#1800ad]/15 pb-4.5 mb-6">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-[#1800ad] text-white flex items-center justify-center font-black text-lg">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-[#1800ad] leading-none mb-1.5 font-montserrat">
                        {selectedStudent.name}
                      </h3>
                      <span className="text-[9px] font-black uppercase tracking-widest bg-[#1800ad]/10 px-2 py-0.5 rounded text-[#1800ad]">
                        {activeClassName} {activeSubject} Profile
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="p-1 rounded-full hover:bg-[#1800ad]/10 text-[#1800ad] transition-all"
                  >
                    <X size={20} className="stroke-[2.5]" />
                  </button>
                </div>

                {/* Overall completion bar */}
                <div className="bg-white rounded-2xl p-4.5 border-2 border-[#1800ad]/10 mb-6 flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-[#1800ad]/60 mb-1 leading-none">Completed Progress</span>
                    <span className="text-xl font-black text-[#1800ad]">{selectedStudent.progress}% Syllabus</span>
                  </div>
                  <div className="w-24 bg-[#1800ad]/10 h-3 rounded-full overflow-hidden border border-[#1800ad]/10">
                    <div className="bg-[#1800ad] h-full rounded-full" style={{ width: `${selectedStudent.progress}%` }} />
                  </div>
                </div>

                {/* Specific trend vectors (Understanding, Reasoning, Expression) */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/70 mb-3 flex items-center gap-1.5">
                    <TrendingUp size={13} className="stroke-[2.5]" />
                    AI Concept Component Metrics
                  </h4>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white rounded-xl p-3 border border-[#1800ad]/10 text-center">
                      <span className="block text-[8px] font-black uppercase tracking-wide text-[#1800ad]/60 mb-1">Understanding</span>
                      <span className="text-base font-black text-[#1800ad] leading-none">{selectedStudent.understanding} <span className="text-[10px] opacity-50">/ 3</span></span>
                      <div className="w-full bg-[#1800ad]/10 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#1800ad] h-full rounded-full" style={{ width: `${(selectedStudent.understanding/3)*100}%` }} />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-[#1800ad]/10 text-center">
                      <span className="block text-[8px] font-black uppercase tracking-wide text-[#1800ad]/60 mb-1">Reasoning</span>
                      <span className="text-base font-black text-[#1800ad] leading-none">{selectedStudent.reasoning} <span className="text-[10px] opacity-50">/ 3</span></span>
                      <div className="w-full bg-[#1800ad]/10 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#1800ad] h-full rounded-full" style={{ width: `${(selectedStudent.reasoning/3)*100}%` }} />
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-[#1800ad]/10 text-center">
                      <span className="block text-[8px] font-black uppercase tracking-wide text-[#1800ad]/60 mb-1">Expression</span>
                      <span className="text-base font-black text-[#1800ad] leading-none">{selectedStudent.expression} <span className="text-[10px] opacity-50">/ 3</span></span>
                      <div className="w-full bg-[#1800ad]/10 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-[#1800ad] h-full rounded-full" style={{ width: `${(selectedStudent.expression/3)*100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed chapters checklist */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/70 mb-2 flex items-center gap-1.5">
                    <BookOpenCheck size={13} className="stroke-[2.5]" />
                    Syllabus Chapters Completed
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {selectedStudent.completedChapters.map((ch, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-[#1800ad]/90 bg-white px-3 py-2 rounded-lg border border-[#1800ad]/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        {ch}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active misconceptions ongoing */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/70 mb-2 flex items-center gap-1.5">
                    <AlertTriangle size={13} className="stroke-[2.5]" />
                    AI-Detected Misconceptions History
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {selectedStudent.recentMisconceptions.map((mis, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold text-rose-700 bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                        <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0 animate-pulse" />
                        {mis}
                      </div>
                    ))}
                    {selectedStudent.recentMisconceptions.length === 0 && (
                      <div className="text-xs font-semibold text-emerald-800 bg-emerald-50/50 px-3 py-2.5 rounded-lg border border-emerald-100/50">
                        🎉 No active misconceptions. Outstanding conceptual logic verified.
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent AI Evaluation Activity Result */}
                <div className="mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-[#1800ad]/70 mb-2 flex items-center gap-1.5">
                    <MessageCircle size={13} className="stroke-[2.5]" />
                    Latest "Explain It" AI Evaluation Output
                  </h4>
                  <div className="bg-white rounded-xl p-4 border border-[#1800ad]/15 flex flex-col gap-2.5">
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-widest text-[#1800ad]/50 mb-1 leading-none">Evaluated Prompt</span>
                      <span className="text-[11px] font-black text-[#1800ad] leading-snug">{selectedStudent.recentAiResult.prompt}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-black uppercase tracking-widest text-[#1800ad]/50 mb-1 leading-none">Student Response Translation</span>
                      <p className="text-[11px] italic font-semibold text-[#1800ad]/85 leading-relaxed bg-[#f6f4ee]/70 p-2.5 rounded-lg border border-[#1800ad]/10">
                        {selectedStudent.recentAiResult.answer}
                      </p>
                    </div>
                    <div className="border-t border-[#1800ad]/10 pt-2.5 flex justify-between items-end">
                      <div>
                        <span className="block text-[8px] font-black uppercase tracking-widest text-[#1800ad]/50 mb-0.5 leading-none font-montserrat font-black">AI Diagnostic Feedback</span>
                        <span className="text-[10px] font-bold text-[#1800ad]/90">{selectedStudent.recentAiResult.feedback}</span>
                      </div>
                      <span className="text-xs font-black bg-[#1800ad] text-[#f6f4ee] px-2.5 py-1 rounded">Score: {selectedStudent.recentAiResult.score}</span>
                    </div>
                  </div>
                </div>

              </div>

              <button 
                onClick={() => setSelectedStudent(null)}
                className="w-full bg-[#1800ad] hover:bg-opacity-90 text-[#f6f4ee] py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all text-center font-montserrat shadow-md mt-6"
              >
                Done view profile
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
