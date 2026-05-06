export enum AppMode {
  HOME = 'HOME',
  ASK = 'ASK',
  PLAN = 'PLAN',
  PLAY = 'PLAY'
}

export interface Attachment {
  type: 'image' | 'file';
  url: string; // Data URL for preview
  base64?: string; // Raw base64 for API
  mimeType?: string;
  name?: string; // Filename
  file?: File; // For multipart upload
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachments?: Attachment[];
  isVideoScript?: boolean; // To style video responses differently
  videoUrl?: string; // URL for the generated video
  isStreaming?: boolean; // Track if the message is currently being generated
}

export interface PlanItem {
  timeframe: string;
  activity: string;
  notes?: string;
}

export interface PlanData {
  title: string;
  description: string;
  items: PlanItem[];
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

// New Types for Tools
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface FlashcardData {
  cards: Flashcard[];
}

// Graph / Mindmap Types
export interface GraphNodeData {
  id: string;
  label: string;
  description?: string;
  stepType?: 'root' | 'milestone' | 'task';
}

export interface GraphEdgeData {
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
}

// Play Module Types
export interface DragDropQuestion {
  sentence: string;
  options: string[];
  correctAnswer: string;
}

export interface DragDropGameData {
  questions: DragDropQuestion[];
}

export interface MistakeItem {
  id: string;
  text: string;
}

export interface MistakeRound {
  title: string;
  items: MistakeItem[];
  errorId: string;
  explanation: string;
}

export interface MistakeGameData {
  rounds: MistakeRound[];
}