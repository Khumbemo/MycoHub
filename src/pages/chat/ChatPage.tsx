import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ShieldAlert, Sparkles } from 'lucide-react';
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
      text: "Hello! I am MycoAssistant. I can help you with taxonomic hierarchies, morphology terminology, or habitat associations. How can I assist your research today?",
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

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Mock AI Response Logic
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getMockResponse(input),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    }, 1000);
  };

  const getMockResponse = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('edible') || q.includes('eat')) {
      return "⚠️ SAFETY ALERT: As an AI, I cannot verify edibility. Consuming wild fungi can be fatal. Please consult a professional mycologist in person. Would you like to know more about the morphology of this genus instead?";
    }
    if (q.includes('amanita')) {
      return "The genus Amanita is characterized by a universal veil (often leaving a volva and cap scales) and a partial veil (annulus). Most species are ectomycorrhizal with specific tree hosts.";
    }
    if (q.includes('habitat')) {
      return "Habitat associations are critical for identification. Are you looking for information on broadleaf woodland species or coniferous specialists?";
    }
    return "That's a great scientific query. Based on Darwin Core standards, we should look at the morphological features like gill attachment and spore print color to narrow this down. Could you provide more details?";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="bg-emerald-600 p-6 rounded-t-[2.5rem] shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Bot className="text-white w-7 h-7" />
        </div>
        <div>
            <h2 className="text-white font-black text-xl tracking-tight leading-none">MycoAssistant</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
                <Sparkles className="w-3 h-3 text-emerald-200 fill-current" />
                <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">Expert AI Active</span>
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
              <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
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

      <div className="p-4 bg-white rounded-b-[2.5rem] border-t border-emerald-50 shadow-inner">
        <div className="flex gap-2 bg-emerald-50 p-2 rounded-2xl">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about taxonomy, morphology..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 px-2"
          />
          <button
            onClick={handleSend}
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
