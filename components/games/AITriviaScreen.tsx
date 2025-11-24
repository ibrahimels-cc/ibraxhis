
import React, { useState, useEffect } from 'react';
import { Language, GameState, TriviaData } from '../../types';
import { translations } from '../../utils/translations';
import { generateTrivia } from '../../services/geminiService';
import { ArrowLeft, Brain, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { audioManager } from '../../utils/audio';

interface AITriviaScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const AITriviaScreen: React.FC<AITriviaScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];
  const [data, setData] = useState<TriviaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const loadQuestion = async () => {
    setLoading(true);
    setAnswered(false);
    setSelectedIndex(null);
    try {
        const trivia = await generateTrivia(language);
        setData(trivia);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, [language]);

  const handleSelect = (index: number) => {
    if (answered || !data) return;
    setSelectedIndex(index);
    setAnswered(true);

    if (index === data.correctIndex) {
        audioManager.playCorrect();
        setScore(s => s + 10);
    } else {
        audioManager.playWrong();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pt-16 flex flex-col items-center relative">
      <div className="w-full max-w-3xl flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                <button 
                    onClick={() => onNavigate(GameState.GAMES_HUB)}
                    className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
                >
                    {language === 'ar' ? <ArrowLeft size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
                </button>
                <div className="bg-slate-800 px-4 py-2 rounded-full border border-slate-700 flex items-center gap-2">
                    <Brain className="text-blue-500" size={20} />
                    <span className="font-bold text-slate-200">{t.gameTriviaTitle}</span>
                </div>
            </div>
            <div className="font-mono font-bold text-2xl text-amber-500">
                {score}
            </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
            {loading ? (
                <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-slate-500"
                >
                    <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                    <p>{t.triviaLoading}</p>
                </motion.div>
            ) : data ? (
                <motion.div
                    key="question"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex-1 flex flex-col"
                >
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-10 text-center mb-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
                        <span className="inline-block px-3 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full mb-4 border border-blue-500/20">
                            {data.category}
                        </span>
                        <h2 className="text-xl md:text-3xl font-bold text-white leading-relaxed">
                            {data.question}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.options.map((opt, idx) => {
                            let btnClass = "bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500 hover:bg-slate-750";
                            
                            if (answered) {
                                if (idx === data.correctIndex) {
                                    btnClass = "bg-green-900/50 border-green-500 text-green-100";
                                } else if (idx === selectedIndex) {
                                    btnClass = "bg-red-900/50 border-red-500 text-red-100";
                                } else {
                                    btnClass = "opacity-50 border-slate-800";
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    disabled={answered}
                                    className={`
                                        p-6 rounded-xl border-2 text-lg font-semibold transition-all duration-300 shadow-lg text-start flex items-center justify-between
                                        ${btnClass}
                                    `}
                                >
                                    <span>{opt}</span>
                                    {answered && idx === data.correctIndex && <CheckCircle className="text-green-500" />}
                                    {answered && idx === selectedIndex && idx !== data.correctIndex && <XCircle className="text-red-500" />}
                                </button>
                            );
                        })}
                    </div>

                    {answered && (
                         <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 bg-slate-900/80 border border-blue-500/30 rounded-xl backdrop-blur"
                        >
                            <p className="text-slate-300 mb-4 text-center">{data.explanation}</p>
                            <Button onClick={loadQuestion} fullWidth>
                                {t.triviaNext}
                            </Button>
                        </motion.div>
                    )}
                </motion.div>
            ) : null}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-slate-600 text-xs text-center pb-4">
        {t.developer}
      </div>
    </div>
  );
};
