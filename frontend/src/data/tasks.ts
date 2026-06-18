export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';
export type TaskType = 'Video' | 'Simulation' | 'Quiz' | 'Practice';

export interface Task {
  id: string;
  type: TaskType;
  typeLabel: string;
  topic: string;
  subject: string;
  deadline: string;
  status: TaskStatus;
  score?: number;
}

export const TASKS: Task[] = [
  // Physics
  {
    id: 'p1',
    type: 'Video',
    typeLabel: 'Watch Video',
    topic: 'Laws of Motion & Friction',
    subject: 'Physics',
    deadline: 'Due Today',
    status: 'Not Started',
  },
  {
    id: 'p2',
    type: 'Quiz',
    typeLabel: 'Attempt Quiz',
    topic: 'Laws of Motion Assessment',
    subject: 'Physics',
    deadline: 'Tomorrow',
    status: 'In Progress',
  },
  
  // Chemistry
  {
    id: 'c1',
    type: 'Simulation',
    typeLabel: 'Simulation',
    topic: 'Chemical Reactions',
    subject: 'Chemistry',
    deadline: 'Due Today',
    status: 'Completed',
    score: 87,
  },
  {
    id: 'c2',
    type: 'Video',
    typeLabel: 'Watch Video',
    topic: 'Atomic Structure',
    subject: 'Chemistry',
    deadline: 'Tomorrow',
    status: 'Not Started',
  },
  {
    id: 'c3',
    type: 'Quiz',
    typeLabel: 'Attempt Quiz',
    topic: 'Periodic Table',
    subject: 'Chemistry',
    deadline: 'Next Week',
    status: 'Not Started',
  },

  // Mathematics
  {
    id: 'm1',
    type: 'Video',
    typeLabel: 'Watch Video',
    topic: 'Limits & Derivatives',
    subject: 'Mathematics',
    deadline: 'Due Today',
    status: 'Not Started',
  },
  {
    id: 'm2',
    type: 'Practice',
    typeLabel: 'Practice Problems',
    topic: 'Differentiation',
    subject: 'Mathematics',
    deadline: 'Tomorrow',
    status: 'In Progress',
  },
  {
    id: 'm3',
    type: 'Quiz',
    typeLabel: 'Attempt Quiz',
    topic: 'Calculus Fundamentals',
    subject: 'Mathematics',
    deadline: 'Next Week',
    status: 'Completed',
    score: 92,
  },

  // Biology
  {
    id: 'b1',
    type: 'Video',
    typeLabel: 'Watch Video',
    topic: 'Cell Structure',
    subject: 'Biology',
    deadline: 'Due Today',
    status: 'Not Started',
  },
  {
    id: 'b2',
    type: 'Simulation',
    typeLabel: 'Simulation',
    topic: 'Human Digestive System',
    subject: 'Biology',
    deadline: 'Tomorrow',
    status: 'Completed',
    score: 85,
  },
  {
    id: 'b3',
    type: 'Quiz',
    typeLabel: 'Attempt Quiz',
    topic: 'Plant Biology',
    subject: 'Biology',
    deadline: 'Next Week',
    status: 'Not Started',
  },
];
