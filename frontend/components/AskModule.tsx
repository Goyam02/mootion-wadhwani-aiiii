import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Loader2, Paperclip, X, FileText, Send, Mic, Video, FileQuestion, Layers, Check, ChevronRight, ChevronLeft, RefreshCw, CornerDownLeft, Plus, Play, MessageSquare, Clapperboard, Volume2, Menu, Trash2 } from 'lucide-react';
import { ChatMessage, Attachment, QuizData, FlashcardData } from '../types';
import { API_BASE_URL, VIDEO_API_BASE_URL } from '../config';

type ToolMode = 'TEXT' | 'VIDEO' | 'QUIZ' | 'FLASHCARDS';
type VideoSubMode = 'TALK' | 'MOVE';

interface ChatInfo {
  chat_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

const AskModule: React.FC = () => {
  // --- Chat State ---
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  
  // --- Chat History State ---
  const [chatList, setChatList] = useState<ChatInfo[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatListLoading, setChatListLoading] = useState(false);
  
  // --- Tool State ---
  const [toolMode, setToolMode] = useState<ToolMode>('TEXT');
  const [videoSubMode, setVideoSubMode] = useState<VideoSubMode>('MOVE');
  const [toolLoading, setToolLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [flashcardData, setFlashcardData] = useState<FlashcardData | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // --- Game State ---
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenIndexRef = useRef<number>(-1);

  // --- Effects ---
  useEffect(() => {
    loadChatList();
    const savedActiveChat = localStorage.getItem('bloop_active_chat');
    if (savedActiveChat) {
      setActiveChat(savedActiveChat);
      loadChatMessages(savedActiveChat);
    }
  }, []);

  useEffect(() => {
    if (activeChat) {
      localStorage.setItem('bloop_active_chat', activeChat);
    }
  }, [activeChat]);

  // --- Voice Output Effect ---
  useEffect(() => {
    if (!voiceEnabled) return;

    const lastMsgIndex = messages.length - 1;
    if (lastMsgIndex < 0) return;

    const lastMsg = messages[lastMsgIndex];

    if (lastMsg.role === 'model' && !lastMsg.isStreaming && lastMsgIndex !== lastSpokenIndexRef.current) {
      lastSpokenIndexRef.current = lastMsgIndex;
      
      const speakText = async (text: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/tts/answer?text=${encodeURIComponent(text)}`, {
            method: 'POST',
          });
          
          if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            audio.onended = () => URL.revokeObjectURL(audioUrl);
          }
        } catch (error) {
          console.error('TTS error:', error);
          const cleanText = text.replace(/[*#]/g, ''); 
          const utterance = new SpeechSynthesisUtterance(cleanText);
          const voices = window.speechSynthesis.getVoices();
          const preferred = voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.lang.startsWith('en'));
          if (preferred) utterance.voice = preferred;
          window.speechSynthesis.speak(utterance);
        }
      };
      
      speakText(lastMsg.text);
    }
  }, [messages, voiceEnabled]);

  // --- Chat History Functions ---
  const loadChatList = async () => {
    setChatListLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chats`);

      if (response.ok) {
        const data = await response.json();
        setChatList(data);
      }
    } catch (error) {
      console.error('Failed to load chat list:', error);
    }
    setChatListLoading(false);
  };

  const loadChatMessages = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`);

      if (response.ok) {
        const data = await response.json();
        const transformedMessages = data.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          text: msg.content,
          isStreaming: false,
          videoId: msg.video_ids?.[0],
          isVideoProcessing: !!msg.video_ids?.[0]
        }));
        setMessages(transformedMessages);
        
        // Start polling for any processing videos
        transformedMessages.forEach((msg: ChatMessage, idx: number) => {
          if (msg.videoId && msg.isVideoProcessing) {
            pollVideoStatus(msg.videoId, idx);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: null })
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveChat(data.chat_id);
        setMessages([]);
        setDocumentId(null);
        setDocumentName(null);
        await loadChatList();
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
    }
  };

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        if (activeChat === chatId) {
          setActiveChat(null);
          setMessages([]);
        }
        await loadChatList();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const switchChat = async (chatId: string) => {
    setActiveChat(chatId);
    await loadChatMessages(chatId);
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  // --- Video Polling Function ---
  const pollVideoStatus = async (videoId: string, messageIndex: number) => {
    const maxAttempts = 100;
    let attempts = 0;

    const interval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setMessages(prev => prev.map((msg, idx) => 
          idx === messageIndex 
            ? { ...msg, isVideoProcessing: false, videoError: 'Video generation timeout' }
            : msg
        ));
        return;
      }

      try {
        const response = await fetch(`${VIDEO_API_BASE_URL}/video/${videoId}`);
        if (response.ok) {
          const blob = await response.blob();
          const videoUrl = URL.createObjectURL(blob);
          
          setMessages(prev => prev.map((msg, idx) => 
            idx === messageIndex 
              ? { ...msg, videoUrl, isVideoProcessing: false }
              : msg
          ));
          
          clearInterval(interval);
        }
      } catch (error) {
        // Still processing, continue polling
      }
    }, 3000);
  };

  // --- Helpers for Rendering ---
  
  const parseBold = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/g).map((part, i) => 
       part.startsWith('**') ? <strong key={i} className="text-white font-bold">{part.slice(2,-2)}</strong> : <span key={i}>{part}</span>
    );
  };

  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h4 key={i} className="text-base font-bold text-white mt-3 mb-2">{parseBold(trimmed.slice(4))}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={i} className="text-lg font-bold text-brand-neon mt-4 mb-2">{parseBold(trimmed.slice(3))}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={i} className="text-xl font-bold text-white mt-4 mb-2 border-b border-zinc-700 pb-1">{parseBold(trimmed.slice(2))}</h2>;
      }
      
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
         return (
           <div key={i} className="flex gap-2 ml-1 mb-1 items-start">
              <span className="text-brand-neon mt-1.5 text-[10px]">•</span>
              <span className="flex-1">{parseBold(trimmed.slice(2))}</span>
           </div>
         );
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <div key={i} className="flex gap-2 ml-1 mb-1 items-start">
             <span className="text-brand-neon font-mono text-xs mt-1">{trimmed.split('.')[0]}.</span>
             <span className="flex-1">{parseBold(trimmed.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
      }
      if (trimmed === '') {
        return <div key={i} className="h-2" />;
      }
      return <p key={i} className="mb-1 leading-relaxed">{parseBold(line)}</p>;
    });
  };

  // --- Handlers ---

  // const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files.length > 0) {
  //     const file = e.target.files[0];
      
  //     if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
  //       alert('Only PDF and image files are allowed.');
  //       return;
  //     }

  //     if (!activeChat) {
  //       await createNewChat();
  //     }
      
  //     setChatLoading(true);
      
  //     const formData = new FormData();
  //     formData.append('file', file);
      
  //     try {
  //       const response = await fetch(`${API_BASE_URL}/qa/upload-doc?chat_id=${activeChat}`, {
  //         method: 'POST',
  //         body: formData,
  //       });
        
  //       if (response.ok) {
  //         const data = await response.json();
  //         setDocumentId(data.document_id);
  //         setDocumentName(file.name);
          
  //         const reader = new FileReader();
  //         reader.onload = (event) => {
  //           const result = event.target?.result as string;
  //           setAttachments(prev => [...prev, {
  //             type: file.type.startsWith('image/') ? 'image' : 'file',
  //             url: result,
  //             base64: result.split(',')[1],
  //             mimeType: file.type,
  //             name: file.name,
  //             file: file
  //           }]);
  //         };
  //         reader.readAsDataURL(file);
          
  //         await loadChatMessages(activeChat!);
  //       } else {
  //         alert(`Failed to upload file: ${response.status} ${response.statusText}`);
  //       }
  //     } catch (error: any) {
  //       console.error('Upload error:', error);
  //       alert(`Error uploading file: ${error.message}`);
  //     }
      
  //     setChatLoading(false);
  //   }
  //   if (fileInputRef.current) fileInputRef.current.value = '';
  // };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!e.target.files || e.target.files.length === 0) return;

  const file = e.target.files[0];

  if (!activeChat) {
    await createNewChat();
  }

  // 🟢 IMAGE → just store as attachment, DO NOT upload yet
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachments(prev => [...prev, {
        type: 'image',
        url: result,
        base64: result.split(',')[1],
        mimeType: file.type,
        name: file.name,
        file
      }]);
    };
    reader.readAsDataURL(file);
    return;
  }

  // 🟢 PDF → upload immediately
  if (file.type === 'application/pdf') {
    setChatLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${API_BASE_URL}/qa/upload-doc?chat_id=${activeChat}`,
        { method: 'POST', body: formData }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      setDocumentId(data.document_id);
      setDocumentName(file.name);

      await loadChatMessages(activeChat!);
    } catch (err) {
      console.error(err);
      alert('Failed to upload document');
    } finally {
      setChatLoading(false);
    }
  }

  if (fileInputRef.current) fileInputRef.current.value = '';
};


  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || chatLoading || toolLoading) return;

    if (!activeChat) {
      await createNewChat();
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const currentAttachments = [...attachments];
    const userMsg: ChatMessage = { role: 'user', text: input, attachments: currentAttachments };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);

    if (toolMode === 'QUIZ') {
      if (!documentId) {
        alert('Please upload a document first to generate a quiz.');
        return;
      }
      setToolLoading(true);
      setQuizData(null);
      setQuizFinished(false);
      
      try {
        const response = await fetch(`${API_BASE_URL}/quiz/${documentId}?count=5`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          const transformedData = data.map((item: any) => ({
            question: item.question,
            options: item.options.map((opt: string) => opt.replace(/^[A-D]\)\s*/, '')),
            correctAnswer: item.correct_answer
          }));
          
          if (Array.isArray(transformedData) && transformedData.length > 0 && transformedData[0].question && transformedData[0].options && transformedData[0].correctAnswer) {
            setQuizData({ questions: transformedData });
            setQuizIndex(0);
            setQuizScore(0);
          } else {
            console.error('Invalid quiz data structure:', transformedData);
            alert('Invalid quiz data received from server');
          }
        } else {
          console.error('Quiz API error:', response.status, response.statusText);
          alert(`Failed to generate quiz: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        console.error('Quiz error:', error);
        alert(`Error generating quiz: ${error.message}`);
      }
      
      setToolLoading(false);
    } 
    else if (toolMode === 'FLASHCARDS') {
      if (!documentId) {
        alert('Please upload a document first to generate flashcards.');
        return;
      }
      setToolLoading(true);
      setFlashcardData(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/flashcards/${documentId}?count=10`, {
          method: 'GET',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          const transformedData = data.map((item: any) => ({
            question: item.question,
            answer: item.answer
          }));
          
          if (Array.isArray(transformedData) && transformedData.length > 0 && transformedData[0].question && transformedData[0].answer) {
            setFlashcardData({ cards: transformedData });
            setFlashcardIndex(0);
            setIsFlipped(false);
          } else {
            console.error('Invalid flashcard data structure:', transformedData);
            alert('Invalid flashcard data received from server');
          }
        } else {
          console.error('Flashcards API error:', response.status, response.statusText);
          alert(`Failed to generate flashcards: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        console.error('Flashcards error:', error);
        alert(`Error generating flashcards: ${error.message}`);
      }
      
      setToolLoading(false);
    } 
    else {
      setChatLoading(true);
      
      try {
        let response;
        let responseData;
        
        const videoEnabled = toolMode === 'VIDEO';
        const faceEnabled = toolMode === 'VIDEO' && videoSubMode === 'TALK';
        
        if (currentAttachments.some(att => att.type === 'image')) {
          const imageAttachment = currentAttachments.find(att => att.type === 'image');
          if (imageAttachment) {
            const formData = new FormData();
            formData.append('image', imageAttachment.file!);
            
            response = await fetch(`${API_BASE_URL}/qa/ask-from-image?chat_id=${activeChat}&document_id=${documentId || ''}&video_enabled=${videoEnabled}&face_enabled=${faceEnabled}&image_path=${imageAttachment.url}`, {
              method: 'POST',
              body: formData,
            });
          }
        } else {
          response = await fetch(`${API_BASE_URL}/qa/ask?chat_id=${activeChat}&question=${encodeURIComponent(userMsg.text)}&document_id=${documentId || ''}&video_enabled=${videoEnabled}&face_enabled=${faceEnabled}`, {
            method: 'POST',
          });
        }
        
        if (response && response.ok) {
          responseData = await response.json();
          
          const modelMsg: ChatMessage = { 
            role: 'model', 
            text: responseData.answer,
            isStreaming: false,
            videoId: responseData.video_id,
            isVideoProcessing: !!responseData.video_id
          };
          
          setMessages(prev => {
            const newMessages = [...prev, modelMsg];
            
            // Start polling if video is being generated
            if (responseData.video_id) {
              pollVideoStatus(responseData.video_id, newMessages.length - 1);
            }
            
            return newMessages;
          });
          
          await loadChatList();
        } else if (response) {
          alert(`Failed to get response: ${response.status} ${response.statusText}`);
        }
      } catch (error: any) {
        console.error('API error:', error);
        alert(`Error getting response: ${error.message}`);
      }
      
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Tool UI Components ---

  const SquareOption = ({ mode, label, icon: Icon }: { mode: ToolMode, label: string, icon: any }) => {
    const isSelected = toolMode === mode;
    return (
      <div 
        onClick={() => {
           setToolMode(isSelected ? 'TEXT' : mode);
           setQuizData(null);
           setFlashcardData(null);
           if (mode === 'VIDEO') setVideoSubMode('MOVE');
        }}
        className={`aspect-square relative cursor-pointer rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${
          isSelected 
            ? 'border-brand-neon bg-brand-neon/10' 
            : 'border-zinc-800 bg-zinc-900/40 hover:border-brand-neon/40'
        }`}
      >
        <div className={`p-3 rounded-full transition-all duration-300 ${isSelected ? 'bg-brand-neon text-black' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}`}>
          <Icon size={28} strokeWidth={2} />
        </div>
        <span className={`font-extrabold tracking-tighter text-sm md:text-base text-center px-2 leading-tight ${isSelected ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`}>
          {label}
        </span>
      </div>
    );
  };

  const QuizView = () => {
    if (!quizData) return null;
    if (quizFinished) {
       return (
         <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-brand-neon text-black flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(204,255,0,0.4)]">
               <span className="text-4xl font-extrabold tracking-tighter">{quizScore}/{quizData.questions.length}</span>
            </div>
            <h3 className="text-2xl font-extrabold tracking-tighter text-white">Assessment Complete</h3>
            <p className="text-zinc-400 text-sm">Great effort. Ready for the next challenge?</p>
            <button 
              onClick={() => { setQuizData(null); setToolMode('TEXT'); }}
              className="px-6 py-3 bg-zinc-800 hover:bg-brand-neon hover:text-black rounded-lg transition-all border border-zinc-700 font-bold tracking-tight text-xs"
            >
              EXIT PROTOCOL
            </button>
         </div>
       )
    }

    const currentQ = quizData.questions[quizIndex];

    const handleAnswer = (option: string) => {
      if (selectedAnswer) return;
      setSelectedAnswer(option);
      const isCorrect = option === currentQ.correctAnswer;
      if (isCorrect) setQuizScore(s => s + 1);

      setTimeout(() => {
        if (quizIndex < quizData.questions.length - 1) {
          setQuizIndex(i => i + 1);
          setSelectedAnswer(null);
        } else {
          setQuizFinished(true);
        }
      }, 1500);
    };

    return (
      <div className="flex flex-col h-full animate-slide-up">
        <div className="flex justify-between items-center mb-6">
           <span className="font-mono text-brand-neon text-xs">Q {quizIndex + 1}/{quizData.questions.length}</span>
           <div className="flex gap-1">
             {quizData.questions.map((_, i) => (
               <div key={i} className={`h-1 w-6 rounded-full ${i <= quizIndex ? 'bg-brand-neon' : 'bg-zinc-800'}`} />
             ))}
           </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-xl font-bold text-white mb-6 leading-tight">{currentQ.question}</h3>
          
          <div className="space-y-2">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = opt === currentQ.correctAnswer;
              const showResult = selectedAnswer !== null;
              
              let styleClass = "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500";
              if (showResult) {
                if (isCorrect) styleClass = "border-brand-neon bg-brand-neon/10 text-brand-neon";
                else if (isSelected) styleClass = "border-red-500 bg-red-500/10 text-red-500";
                else styleClass = "border-zinc-800 opacity-50";
              } else if (isSelected) {
                styleClass = "border-brand-neon bg-brand-neon/20";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(opt)}
                  disabled={showResult}
                  className={`w-full p-3 md:p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center justify-between group ${styleClass}`}
                >
                  <span className="text-sm font-medium">{opt}</span>
                  {showResult && isCorrect && <Check size={16} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const FlashcardView = () => {
    if (!flashcardData) return null;
    const currentCard = flashcardData.cards[flashcardIndex];

    const nextCard = () => {
      setIsFlipped(false);
      setTimeout(() => setFlashcardIndex(i => (i + 1) % flashcardData.cards.length), 200);
    };

    const prevCard = () => {
      setIsFlipped(false);
      setTimeout(() => setFlashcardIndex(i => (i - 1 + flashcardData.cards.length) % flashcardData.cards.length), 200);
    };

    const flipCard = () => {
      setIsFlipped(!isFlipped);
    };

    return (
      <div className="flex flex-col h-full animate-slide-up">
         <div className="flex justify-between items-center mb-6">
           <span className="font-mono text-zinc-500 text-xs">FLASHCARDS</span>
           <span className="font-mono text-brand-neon text-xs">{flashcardIndex + 1} / {flashcardData.cards.length}</span>
         </div>

         <div className="flex-1 flex flex-col justify-center">
           <div className="perspective-1000 w-full flex justify-center">
             <div
               className={`relative w-full max-w-lg h-80 cursor-pointer transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
               onClick={flipCard}
             >
               <div className="absolute inset-0 w-full h-full backface-hidden">
                 <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl border border-zinc-700 p-6 flex flex-col justify-center items-center text-center">
                   <div className="mb-4 flex-shrink-0">
                     <FileQuestion size={48} className="text-brand-neon mx-auto mb-4" />
                   </div>
                   <h3 className="text-xl font-bold text-white leading-tight mb-4 flex-shrink-0">Question</h3>
                   <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
                     <p className="text-zinc-300 text-lg break-words text-center leading-relaxed">{currentCard.question}</p>
                   </div>
                   <div className="mt-4 text-zinc-500 text-sm flex-shrink-0">Click to flip</div>
                 </div>
               </div>

               <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                 <div className="w-full h-full bg-gradient-to-br from-brand-neon/10 to-brand-neon/5 rounded-xl border border-brand-neon p-6 flex flex-col justify-center items-center text-center">
                   <div className="mb-4 flex-shrink-0">
                     <Check size={48} className="text-brand-neon mx-auto mb-4" />
                   </div>
                   <h3 className="text-xl font-bold text-white leading-tight mb-4 flex-shrink-0">Answer</h3>
                   <div className="flex-1 flex items-center justify-center overflow-hidden px-2">
                     <p className="text-white text-lg font-semibold break-words text-center leading-relaxed">{currentCard.answer}</p>
                   </div>
                   <div className="mt-4 text-zinc-400 text-sm flex-shrink-0">Click to flip back</div>
                 </div>
               </div>
             </div>
           </div>
         </div>

         <div className="flex justify-center items-center gap-6 mt-6">
            <button onClick={prevCard} className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextCard} className="p-3 rounded-full bg-brand-neon text-black hover:bg-white transition-colors">
              <ChevronRight size={20} />
            </button>
         </div>
      </div>
    );
  };

  // --- Render ---

  return (
    <div className="flex flex-col h-full bg-brand-black p-4 md:p-6 gap-4 overflow-hidden relative">
      
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 pl-2">
         <button 
           onClick={() => setSidebarOpen(!sidebarOpen)}
           className="md:hidden p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
         >
           <Menu size={20} />
         </button>
         <span className="font-extrabold text-2xl tracking-tighter text-brand-neon shadow-neon-glow font-sans">
           BLOOP ASK
         </span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        
        {/* LEFT SECTION: Chat History Sidebar (20%) */}
        <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-full md:w-[20%] h-full bg-[#0a0a0a] rounded-[30px] border border-brand-neon/50 shadow-[0_0_20px_rgba(204,255,0,0.1)] flex-col relative overflow-hidden`}>
          <div className="p-4 border-b border-zinc-800">
            <button 
              onClick={createNewChat}
              className="w-full px-4 py-3 bg-brand-neon text-black rounded-xl font-bold tracking-tight text-sm flex items-center justify-center gap-2 hover:bg-white transition-all shadow-[0_0_10px_rgba(204,255,0,0.3)]"
            >
              <Plus size={18} />
              NEW CHAT
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {chatListLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-brand-neon" />
              </div>
            ) : chatList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-xs font-mono px-4 text-center">
                <Bot size={32} className="mb-2 opacity-30" />
                <p>NO_CHATS_FOUND</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {chatList.map((chat) => (
                  <div
                    key={chat.chat_id}
                    onClick={() => switchChat(chat.chat_id)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group relative ${
                      activeChat === chat.chat_id
                        ? 'border-brand-neon bg-brand-neon/10'
                        : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold truncate mb-1 ${
                          activeChat === chat.chat_id ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                        }`}>
                          {chat.title || 'Untitled Chat'}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>{getRelativeTime(chat.updated_at)}</span>
                          <span>•</span>
                          <span>{chat.message_count} msg</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => deleteChat(chat.chat_id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE SECTION: Chat Area (50%) */}
        <div className="w-full md:w-[50%] h-full bg-[#0a0a0a] rounded-[30px] border border-brand-neon/50 shadow-[0_0_20px_rgba(204,255,0,0.1)] flex flex-col relative z-0 overflow-hidden">
          
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-40">
             <div className="flex flex-col min-h-full max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-30 select-none">
                    <Bot size={64} className="text-zinc-500 mb-6" />
                    <p className="text-zinc-500 font-mono text-sm tracking-[0.2em]">AWAITING_INPUT_PROTOCOL</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg, idx) => {
                      const showBorder = msg.role === 'model' && !msg.isStreaming;
                      
                      return (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                          <div className={`flex items-start max-w-[90%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 mt-1 rounded-full flex items-center justify-center shrink-0 border ${
                              msg.role === 'user' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-brand-neon border-brand-neon text-black'
                            }`}>
                              {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                            </div>
                            
                            <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                              {msg.attachments && msg.attachments.length > 0 && msg.attachments.some(att => att.type === 'file') && (
                                <div className="flex flex-wrap gap-2 mb-1">
                                  {msg.attachments.filter(att => att.type === 'file').map((att, i) => (
                                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 font-mono shadow-sm">
                                      <FileText size={16} className="text-brand-neon" />
                                      <span className="truncate max-w-[120px]">{att.name || 'Document'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {msg.attachments && msg.attachments.length > 0 && msg.attachments.some(att => att.type === 'image') && (
                                <div className="flex flex-wrap gap-2 mb-1">
                                  {msg.attachments.filter(att => att.type === 'image').map((att, i) => (
                                    <img key={i} src={att.url} alt="att" className="h-20 rounded border border-zinc-700" />
                                  ))}
                                </div>
                              )}

                              {(msg.text.trim() !== '' || msg.role === 'model') && (
                              <div className={`px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap ${
                                msg.role === 'user' 
                                  ? 'bg-zinc-800 text-zinc-100 rounded-[20px] rounded-tr-sm' 
                                  : showBorder 
                                      ? 'w-full border-l-2 border-brand-neon pl-4 text-zinc-300'
                                      : 'w-full text-zinc-300 pl-4 border-l-2 border-transparent'
                              }`}>
                                {msg.role === 'model' ? (
                                    (msg.text.length === 0 && msg.isStreaming) ? (
                                        <div className="flex gap-1 h-5 items-center">
                                            <div className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    ) : (
                                      <>
                                        {renderMessageText(msg.text)}
                                        {msg.isVideoProcessing && (
                                          <div className="mt-4 p-4 rounded-xl border border-brand-neon/30 bg-brand-neon/5 flex items-center justify-center gap-3">
                                            <Loader2 size={20} className="animate-spin text-brand-neon" />
                                            <span className="text-xs text-brand-neon font-mono">GENERATING_VIDEO...</span>
                                          </div>
                                        )}
                                        {msg.videoUrl && !msg.isVideoProcessing && (
                                          <div className="mt-4 rounded-xl overflow-hidden border border-zinc-700 shadow-xl bg-black">
                                            <video controls autoPlay muted className="w-full aspect-video">
                                              <source src={msg.videoUrl} type="video/mp4" />
                                              Your browser does not support the video tag.
                                            </video>
                                            <div className="p-2 bg-zinc-900 flex items-center justify-between">
                                                <span className="text-xs text-brand-neon font-mono flex items-center gap-1">
                                                    <Play size={10} className="fill-current" /> VIDEO_GENERATED
                                                </span>
                                            </div>
                                          </div>
                                        )}
                                        {msg.videoError && (
                                          <div className="mt-4 p-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
                                            ERROR: {msg.videoError}
                                          </div>
                                        )}
                                      </>
                                    )
                                ) : (
                                  msg.text
                                )}
                              </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                )}
             </div>
          </div>

          {/* Input Area */}
          <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pt-10">
             <div className="max-w-3xl mx-auto bg-[#1a1a1a] border border-brand-neon/30 rounded-full h-12 flex items-center px-1 shadow-[0_0_15px_rgba(204,255,0,0.1)] relative z-20 group hover:border-brand-neon/50 transition-all">
                
                <button 
                   onClick={() => fileInputRef.current?.click()} 
                   className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors shrink-0 group/upload ${
                     attachments.length > 0 
                       ? 'text-brand-neon bg-brand-neon/10' 
                       : 'text-zinc-500 hover:text-white hover:bg-zinc-800'
                   }`}
                >
                   {attachments.length > 0 ? <FileText size={18} /> : <Plus size={18} />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                <div className="flex-1 flex items-center overflow-hidden gap-2 px-1">
                   {attachments.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                       {attachments.map((att, i) => (
                         <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 font-mono shadow-sm group">
                           {att.type === 'file' ? <FileText size={16} className="text-brand-neon" /> : <img src={att.url} alt="att" className="h-4 w-4 rounded" />}
                           <span className="truncate max-w-[120px]">{att.name || 'Document'}</span>
                           <button 
                             onClick={() => setAttachments(prev => prev.filter((_, index) => index !== i))}
                             className="ml-1 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition-opacity"
                           >
                             <X size={12} />
                           </button>
                         </div>
                       ))}
                     </div>
                   )}
                   
                   <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        attachments.length > 0 ? "" : (
                            toolMode === 'QUIZ' ? "Enter topic for Quiz..." :
                            toolMode === 'FLASHCARDS' ? "Enter topic for Flashcards..." :
                            toolMode === 'VIDEO' ? (
                                videoSubMode === 'TALK' ? "Upload an image and type what it should say..." : "Describe the scene to animate..."
                            ) :
                            "Ask anything..."
                        )
                      }
                      rows={1}
                      className="flex-1 bg-transparent text-white focus:outline-none resize-none px-2 text-left placeholder-zinc-500 font-medium h-full py-3 leading-tight text-sm overflow-hidden whitespace-nowrap"
                      style={{ minHeight: '100%' }}
                   />
                </div>

                <button onClick={() => setIsListening(!isListening)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors shrink-0 ${isListening ? 'text-brand-neon animate-pulse bg-brand-neon/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}>
                    <Mic size={18} />
                </button>

                <button 
                    onClick={handleSend}
                    disabled={(!input && attachments.length === 0)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-all shrink-0 ${(!input && attachments.length === 0) ? 'bg-transparent text-zinc-700' : 'bg-brand-neon text-black hover:bg-white'}`}
                >
                    {chatLoading || toolLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
             </div>
          </div>
        </div>

        {/* RIGHT SECTION: Tools (30%) */}
        <div className="hidden md:flex w-[30%] h-fit max-h-full bg-[#0a0a0a] rounded-[30px] border border-brand-neon/50 shadow-[0_0_20px_rgba(204,255,0,0.1)] flex-col relative overflow-hidden">
           <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
           
           <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col relative z-10">
              
              {!quizData && !flashcardData && !toolLoading && toolMode !== 'VIDEO' && (
                 <div className="flex-1 flex flex-col justify-start animate-fade-in">
                    <h2 className="text-2xl font-extrabold tracking-tighter text-white mb-5 text-left">Output Protocol</h2>
                    
                    <div className="grid grid-cols-2 gap-3 w-full">
                       <SquareOption mode="VIDEO" label="Video" icon={Video} />
                       <SquareOption mode="QUIZ" label="Interactive Quiz" icon={FileQuestion} />
                       <SquareOption mode="FLASHCARDS" label="Flash Cards" icon={Layers} />
                       
                       <div 
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={`aspect-square relative cursor-pointer rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${
                          voiceEnabled 
                            ? 'border-brand-neon bg-brand-neon/10' 
                            : 'border-zinc-800 bg-zinc-900/40 hover:border-brand-neon/40'
                        }`}
                      >
                        <div className={`p-3 rounded-full transition-all duration-300 ${voiceEnabled ? 'bg-brand-neon text-black' : 'bg-zinc-800 text-zinc-400 group-hover:text-white'}`}>
                          <Volume2 size={28} strokeWidth={2} />
                        </div>
                        <span className={`font-extrabold tracking-tighter text-sm md:text-base text-center px-2 leading-tight ${voiceEnabled ? 'text-white' : 'text-zinc-500 group-hover:text-white'}`}>
                          Voice Output
                        </span>
                        {voiceEnabled && (
                            <div className="absolute top-3 right-3 w-2 h-2 bg-brand-neon rounded-full animate-pulse" />
                        )}
                      </div>
                    </div>
                    
                    {documentId && documentName && (
                      <div className="mt-4 p-3 bg-zinc-900/40 border border-zinc-700 rounded-lg flex items-center justify-between group hover:border-red-500/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-brand-neon" />
                          <span className="text-sm text-zinc-200 font-mono truncate">{documentName}</span>
                        </div>
                        <button 
                          onClick={() => {
                            setDocumentId(null);
                            setDocumentName(null);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    
                    {toolMode !== 'TEXT' && (
                       <div className="mt-8 text-left text-zinc-500 font-mono text-[10px] tracking-widest uppercase animate-fade-in">
                          Active Mode: {toolMode}
                       </div>
                    )}
                 </div>
              )}

              {toolMode === 'VIDEO' && !toolLoading && (
                  <div className="flex-1 flex flex-col justify-start animate-fade-in">
                      <h2 className="text-2xl font-extrabold tracking-tighter text-brand-neon mb-2 text-left">Video Protocol</h2>
                      <p className="text-zinc-500 text-xs mb-4">Select generation method:</p>

                      <div className="flex flex-col gap-3 w-full">
                          <button 
                              onClick={() => setVideoSubMode('TALK')}
                              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group ${
                                  videoSubMode === 'TALK' 
                                  ? 'border-brand-neon bg-brand-neon/10' 
                                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                              }`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <div className={`p-1.5 rounded-full ${videoSubMode === 'TALK' ? 'bg-brand-neon text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                                      <MessageSquare size={16} />
                                  </div>
                                  {videoSubMode === 'TALK' && <div className="w-2 h-2 rounded-full bg-brand-neon animate-pulse" />}
                              </div>
                              <h3 className={`font-bold text-base ${videoSubMode === 'TALK' ? 'text-white' : 'text-zinc-400'}`}>Make It Talk</h3>
                              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Bring a still portrait to life with synced speech.</p>
                          </button>

                          <button 
                              onClick={() => setVideoSubMode('MOVE')}
                              className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group ${
                                  videoSubMode === 'MOVE' 
                                  ? 'border-brand-neon bg-brand-neon/10' 
                                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
                              }`}
                          >
                              <div className="flex justify-between items-start mb-1">
                                  <div className={`p-1.5 rounded-full ${videoSubMode === 'MOVE' ? 'bg-brand-neon text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                                      <Clapperboard size={16} />
                                  </div>
                                  {videoSubMode === 'MOVE' && <div className="w-2 h-2 rounded-full bg-brand-neon animate-pulse" />}
                              </div>
                              <h3 className={`font-bold text-base ${videoSubMode === 'MOVE' ? 'text-white' : 'text-zinc-400'}`}>Make It Move</h3>
                              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Generate cinematic animations from prompts.</p>
                          </button>
                      </div>

                      <div className="mt-4 pb-0 flex justify-center">
                        <button 
                          onClick={() => { setToolMode('TEXT'); }}
                          className="text-zinc-500 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors py-2 px-4 rounded-full hover:bg-zinc-900"
                        >
                            <X size={12} /> CANCEL
                        </button>
                      </div>
                  </div>
              )}

              {toolLoading && (
                 <div className="flex-1 flex flex-col items-center justify-center animate-pulse space-y-4 py-10">
                    <div className="w-12 h-12 border-4 border-zinc-800 border-t-brand-neon rounded-full animate-spin"></div>
                    <p className="font-mono text-brand-neon text-xs tracking-widest">
                      {toolMode === 'QUIZ' ? 'CONSTRUCTING_ASSESSMENT...' : 'COMPILING_DECK...'}
                    </p>
                 </div>
              )}

              {quizData && <QuizView />}
              {flashcardData && <FlashcardView />}

              {(quizData || flashcardData) && (
                <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-center">
                   <button 
                     onClick={() => { setQuizData(null); setFlashcardData(null); }}
                     className="text-zinc-500 hover:text-white text-xs font-mono flex items-center gap-2 transition-colors"
                   >
                      <X size={12} /> CLOSE TOOL
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-neon bg-brand-neon/10 backdrop-blur-md shadow-[0_0_10px_rgba(204,255,0,0.2)]">
              <Bot size={16} className="text-brand-neon" />
              <span className="text-brand-neon text-xs font-mono font-bold tracking-widest uppercase">KNOWLEDGE ENGINE V1.0</span>
          </div>
      </div>

    </div>
  );
};

export default AskModule;