
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Clock, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { audioManager } from '../utils/audio';

interface RewardChestProps {
  lastClaimed: number;
  onClaim: () => void;
  language: Language;
}

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 Hours

export const RewardChest: React.FC<RewardChestProps> = ({ lastClaimed, onClaim, language }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const t = translations[language];

  useEffect(() => {
    const calculateTime = () => {
      const now = Date.now();
      const diff = now - lastClaimed;
      
      if (diff >= COOLDOWN_MS) {
        setIsReady(true);
        setTimeLeft(0);
      } else {
        setIsReady(false);
        setTimeLeft(COOLDOWN_MS - diff);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [lastClaimed]);

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    if (isReady) {
      audioManager.playCorrect(); // Use success sound for reward
      onClaim();
    } else {
      audioManager.playClick();
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto mt-8">
      <motion.button
        onClick={handleClick}
        disabled={!isReady}
        whileHover={isReady ? { scale: 1.05 } : {}}
        whileTap={isReady ? { scale: 0.95 } : {}}
        className={`
          relative w-full p-4 rounded-2xl border-2 flex items-center justify-between gap-4 overflow-hidden group transition-all
          ${isReady 
            ? 'bg-gradient-to-r from-indigo-900 to-purple-900 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' 
            : 'bg-slate-900 border-slate-700 opacity-80'}
        `}
      >
        {/* Background Shine Effect when ready */}
        {isReady && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        )}

        <div className="flex items-center gap-3 z-10">
          <div className={`
            p-3 rounded-xl flex items-center justify-center
            ${isReady ? 'bg-amber-500 text-white animate-bounce' : 'bg-slate-800 text-slate-500'}
          `}>
            {isReady ? <Gift size={24} /> : <Clock size={24} />}
          </div>
          
          <div className="text-start">
            <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-0.5">
              {t.rewardTitle}
            </div>
            <div className={`font-bold font-mono ${isReady ? 'text-amber-400' : 'text-slate-200'}`}>
              {isReady ? t.rewardReady : formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {isReady && (
          <Sparkles className="text-amber-400 animate-pulse absolute right-4 top-1/2 -translate-y-1/2" size={20} />
        )}
      </motion.button>
    </div>
  );
};
