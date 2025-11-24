
import React, { useState } from 'react';
import { PuzzleData, PuzzleType, PlayerStats, Language } from '../types';
import { DoorChallenge } from './puzzles/DoorChallenge';
import { DetectiveChallenge } from './puzzles/DetectiveChallenge';
import { RiddleChallenge } from './puzzles/RiddleChallenge';
import { VisualChallenge } from './puzzles/VisualChallenge';
import { HelpCircle, ArrowLeft, Star, Trophy, Heart, HeartCrack, CheckCircle2, XCircle, ArrowRight, RefreshCw, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { translations } from '../utils/translations';
import { audioManager } from '../utils/audio';
import { Button } from './ui/Button';

interface GameScreenProps {
  puzzle: PuzzleData;
  stats: PlayerStats;
  onResult: (success: boolean) => void;
  onExit: () => void;
  useHint: () => void;
  language: Language;
}

export const GameScreen: React.FC<GameScreenProps> = ({ puzzle, stats, onResult, onExit, useHint, language }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  
  const t = translations[language];

  const handleSelect = (index: number) => {
    if (isRevealed) return;

    setSelectedIndex(index);
    setIsRevealed(true);
    
    const isCorrect = index === puzzle.correctIndex;
    if (isCorrect) {
        audioManager.playCorrect();
    } else {
        audioManager.playWrong();
    }
  };

  const handleContinue = () => {
    if (selectedIndex === null) return;
    
    const isCorrect = selectedIndex === puzzle.correctIndex;
    const willDie = !isCorrect && stats.lives <= 1;

    if (!isCorrect && !willDie) {
        audioManager.playRetry();
    } else {
        audioManager.playClick();
    }
    
    onResult(isCorrect);
  };

  const handleHint = () => {
    if (stats.hintsRemaining > 0 && !hintVisible) {
      useHint();
      setHintVisible(true);
    }
  };

  const renderPuzzle = () => {
    switch (puzzle.type) {
      case PuzzleType.DOORS:
        return <DoorChallenge puzzle={puzzle} onSelect={handleSelect} isRevealed={isRevealed} selectedIndex={selectedIndex} />;
      case PuzzleType.DETECTIVE:
        return <DetectiveChallenge puzzle={puzzle} onSelect={handleSelect} isRevealed={isRevealed} selectedIndex={selectedIndex} />;
      case PuzzleType.VISUAL:
        return <VisualChallenge puzzle={puzzle} onSelect={handleSelect} isRevealed={isRevealed} selectedIndex={selectedIndex} />;
      case PuzzleType.RIDDLE:
      default:
        return <RiddleChallenge puzzle={puzzle} onSelect={handleSelect} isRevealed={isRevealed} selectedIndex={selectedIndex} />;
    }
  };

  const isCorrect = selectedIndex === puzzle.correctIndex;
  // Calculate if this wrong answer will result in Game Over (lives <= 1 because 1 life is about to be lost)
  const willDie = !isCorrect && stats.lives <= 1;

  const getDifficultyColor = (d: string) => {
      if (d === 'hard') return 'text-red-500';
      if (d === 'medium') return 'text-yellow-500';
      return 'text-green-500';
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-950 text-slate-100 relative overflow-hidden">
      
      {/* Dynamic Background Transition */}
      <AnimatePresence>
        <motion.div
            key={puzzle.id}
            initial={{ opacity: 0, scale: 1.1, filter: "blur(8px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 z-0 pointer-events-none"
        >
            {/* Base Background */}
            <div className={`absolute inset-0 transition-colors duration-1000 
                ${puzzle.type === PuzzleType.RIDDLE ? 'bg-[#0a0f1d]' : 'bg-slate-950'}
            `} />
            
            {/* Ambient Gradients based on Puzzle Type */}
            {puzzle.type === PuzzleType.DOORS && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.1),transparent_60%)]" />
            )}
            {puzzle.type === PuzzleType.DETECTIVE && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(30,58,138,0.15),transparent_50%)]" />
            )}
            {puzzle.type === PuzzleType.RIDDLE && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(88,28,135,0.15),transparent_50%)]" />
            )}
            {puzzle.type === PuzzleType.VISUAL && (
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_60%)]" />
            )}

            {/* Subtle Noise Texture */}
             <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
             />
        </motion.div>
      </AnimatePresence>

      {/* HUD */}
      <header className="p-4 flex justify-between items-center bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-3">
            <button onClick={() => { audioManager.playClick(); onExit(); }} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <ArrowLeft size={24} />
            </button>
            <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                    {t.level} 
                    <span className={`ml-1 ${getDifficultyColor(stats.difficulty)}`}>•</span>
                </span>
                <span className="text-xl font-black text-amber-500">{stats.level}</span>
            </div>
        </div>

        {/* Hearts Container */}
        <div className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {[1, 2, 3].map((i) => (
                <motion.div
                    key={i}
                    initial={{ scale: 1 }}
                    animate={{ scale: i <= stats.lives ? 1 : 0.8, opacity: i <= stats.lives ? 1 : 0.3 }}
                >
                    <Heart 
                        size={24} 
                        className={`fill-current ${i <= stats.lives ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'text-slate-700'}`} 
                    />
                </motion.div>
            ))}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
            {/* Difficulty Indicator (Small screens hidden or icon only) */}
            <div className="hidden md:flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                <BarChart2 size={16} className={getDifficultyColor(stats.difficulty)} />
                <span className="text-xs font-bold text-slate-300 uppercase">{t[stats.difficulty]}</span>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                <Trophy size={16} className="text-yellow-500" />
                <span className="font-mono font-bold">{stats.score}</span>
            </div>
            
            <div className="relative">
              <button 
                onClick={handleHint}
                disabled={stats.hintsRemaining === 0 || hintVisible}
                className={`
                  p-2 rounded-full transition-all relative
                  ${stats.hintsRemaining > 0 && !hintVisible ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
                `}
              >
                <HelpCircle size={24} />
                {stats.hintsRemaining > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center border-2 border-slate-900 font-bold">
                        {stats.hintsRemaining}
                    </span>
                )}
              </button>
            </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center relative z-10 mb-32">
        
        <AnimatePresence>
          {hintVisible && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 w-full max-w-md mx-auto z-30"
            >
              <div className="bg-indigo-900/90 border border-indigo-500 text-indigo-100 p-4 rounded-xl shadow-2xl flex items-start gap-3 backdrop-blur-md">
                <Star className="shrink-0 text-yellow-400 animate-pulse" />
                <div>
                  <p className="font-bold mb-1">{t.hint}:</p>
                  <p className="text-sm">{puzzle.hint}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={puzzle.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          {renderPuzzle()}
        </motion.div>

        <div className="absolute bottom-0 w-full text-center pb-2 opacity-50 text-xs text-slate-500 pointer-events-none">
            {t.developer}
        </div>

      </main>
      
      {/* Enhanced Feedback Overlay */}
      <AnimatePresence>
        {isRevealed && (
            <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`
                    fixed bottom-0 left-0 right-0 p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t
                    ${isCorrect ? 'bg-slate-900/95 border-green-500/50' : 'bg-slate-900/95 border-red-500/50'}
                    backdrop-blur-xl
                `}
            >
                <div className="container mx-auto max-w-3xl flex flex-col md:flex-row items-center gap-6">
                   
                   {/* Icon Area */}
                   <motion.div 
                       initial={{ scale: 0, rotate: -45 }}
                       animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                       transition={{ 
                           type: "spring",
                           stiffness: 300,
                           damping: 20,
                           delay: 0.1
                       }}
                       className={`
                           p-4 rounded-full border-4 shrink-0
                           ${isCorrect ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-red-900/20 border-red-500 text-red-500'}
                       `}
                   >
                       {isCorrect ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                   </motion.div>

                   {/* Text Area */}
                   <div className="flex-1 text-center md:text-start space-y-2">
                        <h4 className={`text-2xl font-black ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                            {isCorrect ? t.correct : t.wrong}
                        </h4>
                        <p className="text-slate-300 text-lg leading-relaxed font-light">
                            {puzzle.explanation}
                        </p>
                        
                        {willDie && (
                            <div className="text-red-400 font-bold flex items-center justify-center md:justify-start gap-2 mt-2">
                                <HeartCrack size={20} /> {t.gameOver}
                            </div>
                        )}
                   </div>

                   {/* Action Area */}
                   <div className="w-full md:w-auto">
                        <Button 
                            onClick={handleContinue} 
                            variant={isCorrect ? 'primary' : (willDie ? 'danger' : 'secondary')}
                            fullWidth
                            className="h-14 text-lg"
                        >
                            {isCorrect ? (
                                <>
                                    <span>{t.continue}</span>
                                    {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                                </>
                            ) : willDie ? (
                                <>
                                    <span>{t.continue}</span>
                                    {language === 'ar' ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={20} />
                                    <span>{t.retry}</span>
                                </>
                            )}
                        </Button>
                   </div>
                </div>

                {/* Background Decor */}
                <div className={`absolute inset-0 opacity-10 pointer-events-none ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`} />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
