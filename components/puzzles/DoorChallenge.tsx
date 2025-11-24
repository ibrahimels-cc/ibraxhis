import React from 'react';
import { PuzzleData } from '../../types';
import { DoorOpen, Skull, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DoorChallengeProps {
  puzzle: PuzzleData;
  onSelect: (index: number) => void;
  isRevealed: boolean;
  selectedIndex: number | null;
}

export const DoorChallenge: React.FC<DoorChallengeProps> = ({ puzzle, onSelect, isRevealed, selectedIndex }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 text-center space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm"
        >
          <p className="text-lg md:text-xl text-slate-200 leading-relaxed">
            {puzzle.story}
          </p>
        </motion.div>
        <h3 className="text-xl font-bold text-amber-500">{puzzle.question}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {puzzle.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const isCorrect = idx === puzzle.correctIndex;
          
          let doorColor = "border-slate-600 bg-slate-800";
          let icon = <DoorOpen size={48} className="text-slate-400 mb-4" />;

          if (isRevealed) {
            if (isCorrect) {
              doorColor = "border-green-500 bg-green-900/30";
              icon = <CheckCircle size={48} className="text-green-400 mb-4" />;
            } else if (isSelected) {
              doorColor = "border-red-500 bg-red-900/30";
              icon = <Skull size={48} className="text-red-400 mb-4" />;
            }
          }

          return (
            <motion.button
              key={idx}
              whileHover={!isRevealed ? { scale: 1.05, borderColor: '#f59e0b' } : {}}
              whileTap={!isRevealed ? { scale: 0.95 } : {}}
              onClick={() => !isRevealed && onSelect(idx)}
              className={`
                relative h-64 rounded-t-full rounded-b-lg border-4 flex flex-col items-center justify-center p-4 transition-colors duration-500
                ${doorColor}
                ${!isRevealed ? 'cursor-pointer hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'cursor-default'}
              `}
            >
              {/* Door Texture */}
              <div className={`absolute inset-2 rounded-t-full rounded-b-md border-2 border-dashed border-white/10 ${isRevealed && isCorrect ? 'bg-green-500/10' : ''}`} />
              
              <div className="z-10 flex flex-col items-center text-center">
                {icon}
                <span className="text-slate-200 font-semibold text-lg">{option}</span>
              </div>

              {/* Door Knob */}
              <div className="absolute right-4 top-1/2 w-3 h-3 rounded-full bg-amber-600 shadow-inner" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};