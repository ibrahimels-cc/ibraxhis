
import React, { useState, useRef, useEffect } from 'react';
import { Language, GameState } from '../../types';
import { translations } from '../../utils/translations';
import { createStorySession } from '../../services/geminiService';
import { ArrowLeft, Send, Ghost, Loader2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GenerateContentResponse } from '@google/genai';
import { Button } from '../ui/Button';

interface AIStoryScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

interface StoryMessage {
  role: 'user' | 'model';
  text: string;
}

export const AIStoryScreen: React.FC<AIStoryScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<StoryMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const genres = [
    { id: 'fantasy', label: t.genreFantasy, color: 'from-amber-500 to-red-600' },
    { id: 'scifi', label: t.genreSciFi, color: 'from-blue-500 to-cyan-600' },
    { id: 'horror', label: t.genreHorror, color: 'from-slate-700 to-black' },
    { id: 'mystery', label: t.genreMystery, color: 'from-indigo-600 to-purple-600' },
  ];

  const startGame = async (genre: string) => {
    setIsPlaying(true);
    setIsLoading(true);
    setMessages([]); // Clear previous story
    
    try {
        chatSessionRef.current = createStorySession(language, genre);
        const result = await chatSessionRef.current.sendMessageStream({ message: "Start the story." });
        
        let fullText = '';
        setMessages([{ role: 'model', text: '' }]);

        for await (const chunk of result) {
            const c = chunk as GenerateContentResponse;
            const textChunk = c.text || '';
            fullText += textChunk;
            
            setMessages(prev => {
                const newArr = [...prev];
                newArr[0] = { role: 'model', text: fullText };
                return newArr;
            });
        }
    } catch (e) {
        console.error(e);
        setMessages([{ role: 'model', text: "Error starting story." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userAction = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userAction }]);
    setIsLoading(true);

    try {
        const result = await chatSessionRef.current.sendMessageStream({ message: userAction });
        
        let fullText = '';
        setMessages(prev => [...prev, { role: 'model', text: '' }]);

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
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 pt-16 relative">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      
      {!isPlaying ? (
        // GENRE SELECTION SCREEN
        <div className="flex-1 flex flex-col items-center justify-center p-4">
             <div className="max-w-4xl w-full">
                <div className="flex items-center gap-4 mb-8">
                     <button 
                        onClick={() => onNavigate(GameState.GAMES_HUB)}
                        className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                    >
                        {language === 'ar' ? <ArrowLeft size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
                    </button>
                    <h1 className="text-3xl md:text-5xl font-black text-white">{t.storyTitle}</h1>
                </div>
                
                <p className="text-xl text-slate-400 mb-8">{t.selectGenre}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {genres.map((g) => (
                        <motion.button
                            key={g.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => startGame(g.label)}
                            className={`
                                h-40 rounded-3xl relative overflow-hidden flex items-center justify-center shadow-xl group
                            `}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${g.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            
                            <span className="relative z-10 text-3xl font-black text-white uppercase tracking-widest drop-shadow-md">
                                {g.label}
                            </span>
                        </motion.button>
                    ))}
                </div>

                <div className="mt-12 text-center text-slate-600 text-sm">
                    {t.developer}
                </div>
             </div>
        </div>
      ) : (
        // GAME SCREEN
        <>
            <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between z-10 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-900 rounded-lg flex items-center justify-center">
                        <Ghost className="text-purple-300" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-200">{t.storyTitle}</h2>
                        <span className="text-xs text-slate-500">{t.developer}</span>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => setIsPlaying(false)} className="text-xs py-2 px-4">
                    {t.endStory}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth">
                {messages.map((msg, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        {msg.role === 'model' && (
                            <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <BookOpen size={12} /> Narrator
                            </div>
                        )}
                        <div className={`
                            max-w-[90%] md:max-w-3xl p-6 rounded-2xl text-lg leading-relaxed shadow-lg
                            ${msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none font-serif'}
                        `}>
                             {msg.text.split('\n').map((line, i) => (
                                <p key={i} className="mb-2 last:mb-0 min-h-[1em]">{line}</p>
                             ))}
                        </div>
                    </motion.div>
                ))}
                {isLoading && (
                    <div className="flex items-center gap-2 text-slate-500 p-4">
                        <Loader2 className="animate-spin" /> {t.storyLoading}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <div className="max-w-3xl mx-auto relative flex gap-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t.storyInputPlaceholder}
                        disabled={isLoading}
                        className="flex-1 bg-slate-800 border-2 border-slate-700 rounded-xl px-6 py-4 focus:outline-none focus:border-purple-500 focus:bg-slate-900 transition-all text-white placeholder:text-slate-500"
                        autoFocus
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl disabled:opacity-50 transition-colors"
                    >
                        {language === 'ar' ? <Send className="rotate-180" /> : <Send />}
                    </button>
                </div>
            </div>
        </>
      )}
    </div>
  );
};
