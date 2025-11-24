
import React, { useState, useRef, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createChatSession } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

interface ChatScreenProps {
  language: Language;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ language }) => {
  const t = translations[language];
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session
    chatSessionRef.current = createChatSession(language);
    // Initial greeting
    setMessages([{
        role: 'model',
        text: language === 'ar' ? 'أهلاً بك! أنا مساعد ابراهيم الذكي. كيف يمكنني مساعدتك اليوم؟' : 'Hello! I am Ibrahim\'s AI Assistant. How can I help you today?'
    }]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Streaming response
      const result = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      
      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]); // Placeholder

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || '';
        fullText += textChunk;
        
        setMessages(prev => {
            const newArr = [...prev];
            newArr[newArr.length - 1] = { role: 'model', text: fullText };
            return newArr;
        });
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Error connecting to AI.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 pt-16"> {/* pt-16 for top bar space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-amber-600'}`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`
              max-w-[80%] p-4 rounded-2xl leading-relaxed text-slate-200
              ${msg.role === 'user' ? 'bg-indigo-900/50 rounded-tr-none' : 'bg-slate-800/80 rounded-tl-none border border-slate-700'}
            `}>
                {msg.text}
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto relative flex items-center gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.chatPlaceholder}
            className="w-full bg-slate-800 border border-slate-700 rounded-full px-6 py-4 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-slate-200 placeholder:text-slate-500"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-4 bg-amber-600 hover:bg-amber-500 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
             {isLoading ? <Loader2 className="animate-spin" /> : (language === 'ar' ? <Send className="rotate-180" /> : <Send />)}
          </button>
        </div>
        <div className="text-center mt-2 text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            {t.developer} © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};
