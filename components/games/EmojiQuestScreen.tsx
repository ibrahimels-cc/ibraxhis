
import React, { useState, useEffect } from 'react';
import { Language, GameState } from '../../types';
import { translations } from '../../utils/translations';
import { generateEmojiQuest, checkEmojiAnswer } from '../../services/geminiService';
import { ArrowLeft, Check, HelpCircle, Loader2, Heart, HeartCrack } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { audioManager } from '../../utils/audio';

interface EmojiQuestScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

// Constants
const HINT_REFILL_TIME = 5 * 60 * 1000; // 5 minutes
const DEATH_COOLDOWN_TIME = 2 * 60 * 1000; // 2 minutes
const MAX_HINTS = 3;
const MAX_LIVES = 3;

export const EmojiQuestScreen: React.FC<EmojiQuestScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userGuess, setUserGuess] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(0);

  // Mechanics State
  const [lives, setLives] = useState(MAX_LIVES);
  const [hints, setHints] = useState(MAX_HINTS);
  
  // Timestamps for cooldowns
  const [deathTime, setDeathTime] = useState<number>(0);
  const [hintEmptyTime, setHintEmptyTime] = useState<number>(0);
  
  // UI Timers
  const [deathTimer, setDeathTimer] = useState(0);
  const [hintTimer, setHintTimer] = useState(0);

  // Initial Load & Game Loop
  useEffect(() => {
    loadLevel();

    const timer = setInterval(() => {
        const now = Date.now();

        // Death Cooldown Logic
        if (deathTime > 0) {
            const remaining = DEATH_COOLDOWN_TIME - (now - deathTime);
            if (remaining <= 0) {
                setDeathTime(0);
                setLives(MAX_LIVES);
                setDeathTimer(0);
                loadLevel(); // Restart game
            } else {
                setDeathTimer(Math.ceil(remaining / 1000));
            }
        }

        // Hint Refill Logic
        // Starts ONLY if we have a recorded empty time
        if (hintEmptyTime > 0) {
             const remaining = HINT_REFILL_TIME - (now - hintEmptyTime);
             if (remaining <= 0) {
                 setHints(2); // Refill exactly 2 hints as requested
                 setHintEmptyTime(0);
                 setHintTimer(0);
             } else {
                 setHintTimer(Math.ceil(remaining / 1000));
             }
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [deathTime, hintEmptyTime]);

  const loadLevel = async () => {
    if (deathTime > 0) return;

    setLoading(true);
    setFeedback(null);
    setUserGuess('');
    setShowHint(false);
    try {
        const quest = await generateEmojiQuest(language);
        setData(quest);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
      if (!userGuess.trim() || checking || deathTime > 0) return;
      
      setChecking(true);
      try {
          const isExact = userGuess.toLowerCase().trim() === data.answer.toLowerCase().trim();
          let isCorrect = isExact;

          if (!isExact) {
              const result = await checkEmojiAnswer(data.answer, userGuess, language);
              isCorrect = result.isCorrect;
          }

          if (isCorrect) {
              setFeedback('correct');
              setScore(s => s + 1);
              audioManager.playCorrect();
          } else {
              setFeedback('wrong');
              audioManager.playWrong();
              
              const newLives = lives - 1;
              setLives(newLives);
              if (newLives <= 0) {
                  setDeathTime(Date.now());
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setChecking(false);
      }
  };

  const useHint = () => {
      if (hints > 0 && !showHint) {
          const newHints = hints - 1;
          setHints(newHints);
          setShowHint(true);
          
          // Only start refill timer when hints reach 0
          if (newHints === 0) {
              setHintEmptyTime(Date.now());
          }
      }
  };

  // Death Screen
  if (deathTime > 0) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-red-900/10 animate-pulse" />
                 <HeartCrack size={80} className="text-red-500 mx-auto mb-6" />
                 <h2 className="text-2xl font-bold text-white mb-4">{t.gameOver}</h2>
                 <p className="text-slate-400 mb-8">{t.eqCooldownMsg}</p>
                 <div className="text-6xl font-mono font-bold text-red-500 mb-8 tabular-nums">
                     {formatTime(deathTimer)}
                 </div>
                 <Button variant="secondary" onClick={() => onNavigate(GameState.GAMES_HUB)} fullWidth>
                     {t.back}
                 </Button>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pt-16 flex flex-col items-center relative">
       {/* Top Bar */}
       <div className="w-full max-w-xl flex items-center justify-between mb-6 bg-slate-900/80 p-4 rounded-2xl backdrop-blur-md border border-slate-800">
            <button 
                onClick={() => onNavigate(GameState.GAMES_HUB)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
                {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowLeft size={20} className="rotate-180" />}
            </button>

            {/* Lives */}
            <div className="flex items-center gap-1">
                {[1, 2, 3].map(i => (
                    <Heart 
                        key={i} 
                        size={20} 
                        className={`fill-current ${i <= lives ? 'text-red-500' : 'text-slate-800'}`} 
                    />
                ))}
            </div>

            {/* Score */}
            <div className="font-bold text-xl text-white">{score}</div>
       </div>

       <div className="w-full max-w-xl flex-1 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
              {loading ? (
                  <div className="text-center">
                      <Loader2 size={48} className="animate-spin text-yellow-500 mx-auto mb-4" />
                      <p className="text-slate-500">Generating Puzzle...</p>
                  </div>
              ) : data ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                      <div className="text-center mb-6">
                          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold border border-slate-700 rounded-full px-3 py-1">
                              {data.category}
                          </span>
                      </div>

                      <div className="text-center mb-10">
                          <div className="text-5xl md:text-7xl tracking-[0.2em] mb-4 drop-shadow-2xl filter hover:brightness-110 transition-all cursor-default select-none">
                              {data.emojis}
                          </div>
                      </div>

                      <AnimatePresence mode="wait">
                        {feedback === 'correct' ? (
                            <motion.div 
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-4"
                            >
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/30">
                                    <Check size={32} className="text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-green-400">{t.eqCorrect}</h3>
                                <p className="text-white text-xl font-bold mb-6">{data.answer}</p>
                                <Button onClick={loadLevel} fullWidth className="bg-green-600 hover:bg-green-500">
                                    {t.eqNew}
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="game"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={userGuess}
                                        onChange={(e) => { setUserGuess(e.target.value); setFeedback(null); }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        placeholder={t.eqGuess}
                                        className={`
                                            w-full bg-slate-800 border-2 rounded-xl px-4 py-4 text-center text-lg font-bold text-white focus:outline-none transition-all
                                            ${feedback === 'wrong' ? 'border-red-500 animate-shake' : 'border-slate-700 focus:border-yellow-500'}
                                        `}
                                    />
                                </div>
                                
                                {feedback === 'wrong' && (
                                    <p className="text-red-500 text-center text-sm font-bold">{t.eqWrong}</p>
                                )}

                                {/* Simple Hint Button */}
                                <button 
                                    onClick={useHint} 
                                    disabled={showHint || hints === 0}
                                    className={`
                                        w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm transition-all border
                                        ${showHint || hints === 0 
                                            ? 'bg-slate-800 text-slate-600 border-slate-700' 
                                            : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500'}
                                    `}
                                >
                                    {hints === 0 && hintTimer > 0 ? (
                                        <span className="font-mono text-xs">{formatTime(hintTimer)}</span>
                                    ) : (
                                        <>
                                            <HelpCircle size={16} /> 
                                            {t.eqHintsLeft} ({hints})
                                        </>
                                    )}
                                </button>

                                <Button onClick={handleSubmit} disabled={checking} fullWidth>
                                    {checking ? <Loader2 className="animate-spin" /> : t.eqGuess}
                                </Button>

                                {showHint && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-xl text-center shadow-lg"
                                    >
                                        <p className="text-slate-400 text-xs uppercase font-bold mb-1">{t.hint}</p>
                                        <p className="text-indigo-200 font-bold text-lg">{data.hint}</p>
                                    </motion.div>
                                )}

                                {/* Timers Status Text */}
                                {(hintTimer > 0) && (
                                    <div className="text-[10px] text-center text-slate-600 font-mono pt-2 space-y-1">
                                        <p>{t.eqRefillIn} {formatTime(hintTimer)}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                      </AnimatePresence>
                  </div>
              ) : null}
          </div>
       </div>

       <div className="mt-8 text-slate-600 text-xs text-center pb-4">
            {t.developer}
       </div>
    </div>
  );
};
