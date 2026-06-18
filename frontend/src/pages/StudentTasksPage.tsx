import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Compass, 
  Gamepad2, 
  Search, 
  ChevronRight,
  PlayCircle,
  Beaker,
  FileQuestion,
  Pencil,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Task, TaskStatus, TaskType } from '../data/tasks';
import { NavItem } from '../components/NavItem';
import { ChatbotFab } from '../components/ChatbotFab';
import { getStoredTasks } from '../data/taskStore';

// --- Components ---

function TaskCard({ task, onClick }: { task: Task, onClick: (t: Task) => void }) {
  const getIcon = (type: TaskType) => {
    switch (type) {
      case 'Video': return <PlayCircle size={20} />;
      case 'Simulation': return <Beaker size={20} />;
      case 'Quiz': return <FileQuestion size={20} />;
      case 'Practice': return <Pencil size={20} />;
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }} 
      onClick={() => onClick(task)}
      className="bg-[#1800ad] text-[#f6f4ee] p-5 md:p-8 rounded-[32px] md:rounded-[40px] flex flex-col justify-between gap-4 md:gap-6 relative overflow-hidden group cursor-pointer shadow-lg border-2 border-[#1800ad] h-full"
    >
      {/* Decorative background blob */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#f6f4ee]/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>

      <div className="flex flex-col h-full z-10">
        <div className="flex justify-between items-start w-full mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-[#f6f4ee] text-[#1800ad] rounded-full text-xs md:text-sm font-bold w-fit">
            {getIcon(task.type)}
            <span>{task.typeLabel}</span>
          </div>
          <div className="px-3 py-1.5 md:px-4 md:py-2 bg-transparent text-[#f6f4ee] rounded-full text-xs md:text-sm font-bold border-2 border-[#f6f4ee]/30">
            {task.deadline}
          </div>
        </div>

        <div className="mt-2 flex-grow">
          <span className="text-[#f6f4ee]/70 font-semibold mb-1 md:mb-2 block tracking-wider uppercase text-xs">{task.subject}</span>
          <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-[#f6f4ee] leading-tight max-w-[90%]">
            {task.topic}
          </h3>
        </div>

        <div className="mt-4 md:mt-6 lg:mt-auto pt-4 border-t border-[#f6f4ee]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
           {task.status === 'Completed' && task.score !== undefined ? (
             <div className="flex flex-col">
               <span className="text-[10px] sm:text-xs text-[#f6f4ee]/70 font-semibold uppercase tracking-wider mb-0.5">Last Score</span>
               <span className="text-lg md:text-xl font-black text-emerald-300">{task.score}%</span>
             </div>
           ) : (
             <div className="flex flex-col">
               <span className="text-[10px] sm:text-xs text-[#f6f4ee]/70 font-semibold uppercase tracking-wider mb-0.5">Status</span>
               <span className={`text-sm md:text-base font-bold ${task.status === 'Not Started' ? 'text-[#f6f4ee]/90' : 'text-amber-300'}`}>{task.status}</span>
             </div>
           )}

          <button className="flex items-center justify-center gap-2 bg-[#f6f4ee] text-[#1800ad] px-6 md:px-8 py-3 rounded-full font-bold text-base hover:bg-white hover:shadow-lg transition-all w-full sm:w-auto mt-2 sm:mt-0">
            {task.status === 'Not Started' && 'Start'}
            {task.status === 'In Progress' && 'Continue'}
            {task.status === 'Completed' && 'Try Again'}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function StudentTasksPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState<TaskStatus | 'All'>('All');
  const [localTasks] = useState<Task[]>(() => getStoredTasks());

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  const filteredTasks = localTasks.filter(task => filter === 'All' || task.status === filter);

  return (
    <div className="flex flex-1 w-full h-[100dvh] bg-[#1800ad] font-montserrat text-[#1800ad] overflow-hidden relative">
      <ChatbotFab />
      
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-[#1800ad] px-8 py-2.5 flex justify-between items-center z-40 rounded-full shadow-[0_10px_40px_rgba(24,0,173,0.25)] border-[2px] border-[#f6f4ee]">
        <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
        <NavItem icon={<CheckSquare size={24} />} active onClick={() => navigate('/student/tasks')} />
        <NavItem icon={<Compass size={24} />} onClick={() => navigate('/student/explore')} />
        <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
      </nav>

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-[80px] lg:w-[100px] flex-col items-center justify-between py-8 fixed top-0 bottom-0 left-0 h-full shrink-0 bg-[#1800ad] text-[#f6f4ee] z-30">
        {/* Logo */}
        <div className="flex items-center justify-center shrink-0 mt-4 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#f6f4ee] font-val text-[42px] leading-none tracking-widest mt-1 mr-1">M</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6 w-full items-center my-auto">
          <NavItem icon={<LayoutDashboard size={24} />} onClick={() => navigate('/student/home')} />
          <NavItem icon={<CheckSquare size={24} />} active onClick={() => navigate('/student/tasks')} />
          <NavItem icon={<Compass size={24} />} onClick={() => navigate('/student/explore')} />
          <NavItem icon={<Gamepad2 size={24} />} onClick={() => navigate('/student/playground')} />
        </nav>

        {/* Profile Avatar Fixed to Bottom Left */}
        <div className="shrink-0 cursor-pointer flex items-center justify-center group w-12 h-12 rounded-full border-2 border-[#1800ad] bg-[#f6f4ee] hover:opacity-90 transition-opacity duration-300 shadow-sm relative">
           <span className="text-[#1800ad] font-bold text-lg transition-colors duration-300">P</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-[80px] lg:ml-[100px] bg-[#f6f4ee] md:rounded-l-[40px] lg:rounded-l-[50px] p-5 md:pl-10 lg:pl-12 xl:pl-16 md:pr-8 lg:pr-10 w-full overflow-y-auto custom-scrollbar pt-6 md:pt-10 pb-32 lg:pb-12 relative flex flex-col h-full">
        <div className="max-w-[1300px] w-full h-full">
          
          {/* Top Header */}
          <header className="flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6 mb-8 lg:mb-10 w-full relative">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold tracking-tight text-[#1800ad]">
                My Tasks
              </h1>
              <p className="text-[#1800ad]/70 font-medium mt-1">
                View and manage all assigned learning activities.
              </p>
            </div>

            <div className="relative w-[calc(100%+16px)] -ml-2 translate-y-1.5 xl:translate-y-0 xl:ml-0 xl:w-[380px]">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search size={18} className="text-[#1800ad]/60" />
              </div>
              <input 
                type="text" 
                placeholder="Search tasks..." 
                className="w-full pl-12 pr-4 py-3 md:py-3.5 bg-transparent border-2 border-[#1800ad]/30 rounded-full text-sm outline-none focus:border-[#1800ad] focus:ring-4 focus:ring-[#1800ad]/10 transition-all placeholder:text-[#1800ad]/50 font-medium text-[#1800ad]"
              />
            </div>
          </header>

          {/* Filters */}
          <div className="flex overflow-x-auto custom-scrollbar pb-2 mb-8 gap-3 items-center">
            {(['All', 'Not Started', 'In Progress', 'Completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                  filter === status 
                    ? 'bg-[#1800ad] text-[#f6f4ee] border-[#1800ad] shadow-md' 
                    : 'bg-transparent text-[#1800ad]/70 border-[#1800ad]/20 hover:border-[#1800ad]/50 hover:text-[#1800ad]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Tasks Grid by Subject */}
          <div className="flex flex-col gap-12 pb-10">
            {subjects.map(subject => {
              const subjectTasks = filteredTasks.filter(t => t.subject === subject);
              if (subjectTasks.length === 0) return null;

              return (
                <section key={subject} className="flex flex-col gap-5">
                  <h2 className="text-xl md:text-2xl font-black text-[#1800ad] border-b-2 border-[#1800ad]/10 pb-3">{subject}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
                    {subjectTasks.map(task => (
                      <TaskCard key={task.id} task={task} onClick={() => navigate(`/student/task/${task.id}`)} />
                    ))}
                  </div>
                </section>
              );
            })}
            
            {filteredTasks.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center opacity-60">
                <CheckSquare size={64} className="text-[#1800ad] mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-[#1800ad]">No tasks found</h3>
                <p className="text-[#1800ad]">Try adjusting your filters.</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
