import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight } from 'lucide-react';

export function ChatbotFab({ context }: { context?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{sender: 'user' | 'bot', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [mousePos, setMousePos] = useState({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Simple tracking for eyes
  const getEyeTransform = (eyeX: number, eyeY: number) => {
    if (typeof window === 'undefined') return '';
    const dx = mousePos.x - eyeX;
    const dy = mousePos.y - eyeY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(6, Math.hypot(dx, dy) / 10);
    return `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
  };
  
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const messageInput = input;
    setMessages(prev => [...prev, { sender: 'user', text: messageInput }]);
    setInput('');
    try {
      const response = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageInput, context })
      });
      const data = await response.json();
      if (data.text) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I couldn't understand that." }]);
      }
    } catch(err) {
       setMessages(prev => [...prev, { sender: 'bot', text: "Error connecting to server." }]);
    }
  };

  return (
    <div className="fixed bottom-28 md:bottom-6 right-4 md:right-6 z-50 flex items-end justify-end">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div 
            key="chatbox"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", bounce: 0 }}
            className="absolute bottom-0 right-0 w-[300px] h-[380px] bg-[#f6f4ee] border-2 border-[#1800ad] rounded-[32px] shadow-2xl flex flex-col overflow-hidden origin-bottom-right"
          >
            <div className="h-[90px] bg-[#1800ad] flex justify-center items-center relative shrink-0 pt-4 pb-2">
              <button 
                onClick={() => setIsOpen(false)} 
                className="absolute top-5 right-5 text-[#f6f4ee] hover:opacity-70 transition-opacity p-1"
              >
                <X size={20} />
              </button>
              
              {/* Box Eyes */}
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                  <div className="w-4 h-4 bg-black rounded-full" style={{ transform: getEyeTransform(window.innerWidth - 180, window.innerHeight - 380) }} />
                </div>
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center relative overflow-hidden">
                  <div className="w-4 h-4 bg-black rounded-full" style={{ transform: getEyeTransform(window.innerWidth - 140, window.innerHeight - 380) }} />
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-4 flex flex-col bg-[#f6f4ee] overflow-y-auto custom-scrollbar">
              <div className="text-center text-xs font-bold text-[#1800ad]/60 mb-4 mt-2">Today</div>
              {messages.length === 0 ? (
                <div className="m-auto text-sm font-medium text-[#1800ad]/70 text-center max-w-[80%] pb-6">
                  Hi Poorvika! Need help finding your next challenge?
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`px-4 py-2 text-sm font-medium rounded-2xl max-w-[85%] ${msg.sender === 'user' ? 'bg-[#1800ad] text-[#f6f4ee] self-end rounded-br-sm' : 'bg-[#1800ad]/10 text-[#1800ad] self-start rounded-bl-sm border border-[#1800ad]/10'}`}>
                      {msg.text}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <div className="p-4 shrink-0 bg-[#f6f4ee] border-t border-[#1800ad]/10">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything."
                  className="w-full border-2 border-[#1800ad] bg-white rounded-full pl-5 pr-12 py-3 text-sm text-[#1800ad] font-bold outline-none placeholder:text-[#1800ad]/50 focus:ring-2 focus:ring-[#1800ad]/20 transition-all font-montserrat"
                />
                <button type="submit" disabled={!input.trim()} className="absolute right-2 p-2 bg-[#1800ad] text-white rounded-full disabled:opacity-50 transition-opacity">
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.button 
            key="fab"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-full border-4 border-[#f6f4ee] bg-[#1800ad] shadow-xl flex flex-col items-center justify-start pt-[20px] md:pt-[24px] relative hover:shadow-2xl transition-all"
          >
            <div className="flex gap-2.5 md:gap-3 items-center">
                <div className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] bg-white rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-black rounded-full" style={{ transform: getEyeTransform(window.innerWidth - 65, window.innerHeight - 65) }} />
                </div>
                <div className="w-[18px] h-[18px] md:w-[22px] md:h-[22px] bg-white rounded-full flex items-center justify-center relative overflow-hidden">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-black rounded-full" style={{ transform: getEyeTransform(window.innerWidth - 35, window.innerHeight - 65) }} />
                </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
