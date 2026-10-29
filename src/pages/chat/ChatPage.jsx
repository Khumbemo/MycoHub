import { useState, useRef, useEffect } from 'react';
import { Send, Bot, BookOpen } from 'lucide-react';
import { findAnswer, NOTES } from '../../data/assistantNotes';
import { motion, AnimatePresence } from 'framer-motion';

const ChatPage = () => {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm MycoAssistant, an offline reference helper. I answer from short built-in notes on field technique, morphology terms and data standards. Tap a topic below or ask a question.",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // The conversation scrolls with the page; bring the newest message into view,
  // but leave the page where it is when it first opens.
  useEffect(() => {
    if (messages.length > 1) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const send = (raw) => {
    const text = raw.trim();
    if (!text) return;

    const now = Date.now();
    setMessages((prev) => [...prev, { id: `${now}-u`, text, sender: 'user', timestamp: new Date() }]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [...prev, { id: `${now}-a`, text: findAnswer(text), sender: 'ai', timestamp: new Date() }]);
    }, 400);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="bg-emerald-600 p-6 short:p-3 rounded-t-[2.5rem] short:rounded-t-3xl shadow-lg flex items-center gap-4">
        <div className="w-12 h-12 short:w-9 short:h-9 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md flex-shrink-0">
          <Bot className="text-white w-7 h-7" />
        </div>
        <div>
          <h2 className="text-white font-black text-xl tracking-tight leading-none">MycoAssistant</h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <BookOpen className="w-3 h-3 text-emerald-200" />
            <span className="text-[10px] font-black text-emerald-100 uppercase tracking-widest">
              Offline reference notes
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 bg-white/50 backdrop-blur-sm min-h-[30dvh]" aria-live="polite">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap p-4 rounded-3xl text-sm font-medium shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none border border-emerald-50'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {/* scroll-margin keeps the newest message clear of the pinned composer */}
        <div ref={messagesEndRef} style={{ scrollMarginBottom: 'calc(var(--nav-bottom) + 9rem)' }} />
      </div>

      <div className="sticky bottom-[var(--nav-bottom)] z-20">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2 bg-white/90 backdrop-blur-md">
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

        <div className="p-4 short:p-2 bg-white rounded-b-[2.5rem] short:rounded-b-3xl border-t border-emerald-50 shadow-inner">
          <div className="flex gap-2 bg-emerald-50 p-2 rounded-2xl">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) send(input);
              }}
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
    </div>
  );
};

export default ChatPage;
