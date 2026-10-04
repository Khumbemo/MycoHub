import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, BookOpen } from 'lucide-react';
import { findAnswer, NOTES } from '../../data/assistantNotes';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm MycoAssistant, an offline reference helper. I answer from short built-in notes on field technique, morphology terms and data standards. Tap a topic below or ask a question.",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;

    const now = Date.now();
    setMessages(prev => [
      ...prev,
      { id: `${now}-u`, text, sender: 'user', timestamp: new Date() },
    ]);
    setInput('');

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { id: `${now}-a`, text: findAnswer(text), sender: 'ai', timestamp: new Date() },
      ]);
    }, 400);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-220px)] min-h-[420px]">
      <div className="bg-emerald-600 p-6 rounded-t-[2.5rem] shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Bot className="text-white w-7 h-7" />
        </div>
        <div>
            <h2 className="text-white font-black text-xl tracking-tight leading-none">MycoAssistant</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
                <BookOpen className="w-3 h-3 text-emerald-200" />
                <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Offline reference notes</span>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50 backdrop-blur-sm">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] whitespace-pre-wrap p-4 rounded-3xl text-sm font-medium shadow-sm ${
                msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none border border-emerald-50'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2 bg-white/50">
        {NOTES.map((n) => (
          <button
            key={n.topic}
            onClick={() => send(n.keywords[0])}
            className="flex-shrink-0 bg-white border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          >
            {n.topic}
          </button>
        ))}
      </div>

      <div className="p-4 bg-white rounded-b-[2.5rem] border-t border-emerald-50 shadow-inner">
        <div className="flex gap-2 bg-emerald-50 p-2 rounded-2xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) send(input); }}
            aria-label="Message"
            placeholder="Ask about taxonomy, morphology..."
            className="flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 text-sm font-bold text-gray-700 px-2"
          />
          <button
            onClick={() => send(input)}
            aria-label="Send"
            className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-90 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
