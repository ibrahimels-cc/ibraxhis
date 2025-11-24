import React from 'react';
import { PuzzleData } from '../../types';
import { Search, User, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

interface DetectiveChallengeProps {
  puzzle: PuzzleData;
  onSelect: (index: number) => void;
  isRevealed: boolean;
  selectedIndex: number | null;
}

export const DetectiveChallenge: React.FC<DetectiveChallengeProps> = ({ puzzle, onSelect, isRevealed, selectedIndex }) => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl mb-8">
        <div className="bg-slate-800 p-4 flex items-center gap-2 border-b border-slate-700">
          <Search className="text-amber-500" />
          <h3 className="font-bold text-slate-200">ملف القضية #{puzzle.id.slice(0, 4)}</h3>
        </div>
        <div className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
                <Fingerprint className="text-slate-500 shrink-0 mt-1" size={32} />
                <p className="text-lg text-slate-300 leading-relaxed font-light tracking-wide">
                    {puzzle.story}
                </p>
            </div>
            <div className="h-px w-full bg-slate-700 my-6" />
            <h4 className="text-xl font-bold text-amber-500 mb-4 text-center">{puzzle.question}</h4>
        </div>
      </div>

      <div className="space-y-3">
        {puzzle.options.map((option, idx) => {
           const isSelected = selectedIndex === idx;
           const isCorrect = idx === puzzle.correctIndex;
           
           let btnClass = "bg-slate-800 hover:bg-slate-700 border-slate-600";
           if (isRevealed) {
             if (isCorrect) btnClass = "bg-green-900/50 border-green-500 text-green-100";
             else if (isSelected) btnClass = "bg-red-900/50 border-red-500 text-red-100";
             else btnClass = "bg-slate-800 border-slate-700 opacity-50";
           }
 
           return (
            <motion.button
              key={idx}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => !isRevealed && onSelect(idx)}
              disabled={isRevealed}
              className={`w-full p-4 rounded-xl border text-right flex items-center gap-4 transition-all ${btnClass}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-700 shrink-0 ${isRevealed && isCorrect ? 'bg-green-800' : ''}`}>
                <User size={20} className="text-slate-300" />
              </div>
              <span className="text-lg font-medium">{option}</span>
            </motion.button>
           );
        })}
      </div>
    </div>
  );
};