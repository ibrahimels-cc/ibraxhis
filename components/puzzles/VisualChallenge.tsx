
import React from 'react';
import { PuzzleData } from '../../types';
import { Eye, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface VisualChallengeProps {
  puzzle: PuzzleData;
  onSelect: (index: number) => void;
  isRevealed: boolean;
  selectedIndex: number | null;
}

export const VisualChallenge: React.FC<VisualChallengeProps> = ({ puzzle, onSelect, isRevealed, selectedIndex }) => {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10 w-full"
      >
        <div className="bg-slate-900/80 border-2 border-indigo-500/50 rounded-3xl p-8 text-center relative overflow-hidden shadow-[0_0_40px_rgba(99,102,241,0.2)]">
            {/* Decorative bg elements */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl" />
            
            <div className="flex justify-center mb-4">
                <Eye className="text-indigo-400 animate-pulse" size={32} />
            </div>

            <h3 className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-6">{puzzle.question}</h3>

            {/* The Visual Pattern / Story */}
            <div className="text-4xl md:text-6xl font-black leading-relaxed tracking-widest text-white drop-shadow-lg py-8 bg-slate-950/50 rounded-xl border border-slate-800">
                {puzzle.story}
            </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
        {puzzle.options.map((option, idx) => {
           const isSelected = selectedIndex === idx;
           const isCorrect = idx === puzzle.correctIndex;
           
           let btnClass = "bg-slate-800 border-slate-600 text-slate-200 hover:border-indigo-500 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]";
           
           if (isRevealed) {
             if (isCorrect) btnClass = "bg-green-600 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]";
             else if (isSelected) btnClass = "bg-red-600 border-red-400 text-white";
             else btnClass = "opacity-30 scale-90";
           }

           return (
             <motion.button
                key={idx}
                whileHover={!isRevealed ? { scale: 1.05, y: -5 } : {}}
                whileTap={!isRevealed ? { scale: 0.95 } : {}}
                onClick={() => !isRevealed && onSelect(idx)}
                disabled={isRevealed}
                className={`
                    h-24 rounded-xl border-2 text-2xl md:text-3xl font-bold transition-all duration-300 flex items-center justify-center
                    ${btnClass}
                `}
             >
               {option}
             </motion.button>
           );
        })}
      </div>
    </div>
  );
};
