import React from 'react';
import { PuzzleData } from '../../types';
import { BrainCircuit, Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface RiddleChallengeProps {
  puzzle: PuzzleData;
  onSelect: (index: number) => void;
  isRevealed: boolean;
  selectedIndex: number | null;
}

export const RiddleChallenge: React.FC<RiddleChallengeProps> = ({ puzzle, onSelect, isRevealed, selectedIndex }) => {
  return (
    <div className="w-full max-w-2xl mx-auto text-center">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-10 relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25"></div>
        <div className="relative bg-slate-900 p-8 rounded-2xl border border-slate-700">
            <BrainCircuit className="w-16 h-16 text-purple-500 mx-auto mb-6" />
            <p className="text-xl md:text-2xl font-bold text-white mb-4">{puzzle.story}</p>
            <p className="text-slate-400 italic">{puzzle.question}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {puzzle.options.map((option, idx) => {
           const isSelected = selectedIndex === idx;
           const isCorrect = idx === puzzle.correctIndex;
           
           let btnClass = "bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500 hover:text-purple-400";
           if (isRevealed) {
             if (isCorrect) btnClass = "bg-green-900/50 border-green-500 text-green-100";
             else if (isSelected) btnClass = "bg-red-900/50 border-red-500 text-red-100";
             else btnClass = "opacity-40 border-slate-800";
           }

           return (
             <button
                key={idx}
                onClick={() => !isRevealed && onSelect(idx)}
                disabled={isRevealed}
                className={`p-6 rounded-xl border-2 text-lg font-semibold transition-all duration-300 ${btnClass}`}
             >
               {option}
             </button>
           );
        })}
      </div>
    </div>
  );
};