
import React from 'react';
import { Language, GameState } from '../types';
import { translations } from '../utils/translations';
import { ArrowLeft, Hammer, Construction } from 'lucide-react';
import { motion } from 'framer-motion';

interface VeoVideoScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const VeoVideoScreen: React.FC<VeoVideoScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pt-20 flex flex-col items-center justify-center text-center">
       <div className="max-w-2xl mx-auto w-full relative">
        
        {/* Back Button */}
        <div className="absolute top-0 left-0">
            <button 
                onClick={() => onNavigate(GameState.TOOLS)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
                {language === 'ar' ? <ArrowLeft size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
            </button>
        </div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-12 shadow-2xl flex flex-col items-center"
        >
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 relative">
                <Hammer size={48} className="text-amber-500" />
                <motion.div 
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute -top-2 -right-2"
                >
                    <Construction size={32} className="text-slate-400" />
                </motion.div>
            </div>
            
            <h1 className="text-3xl font-black text-white mb-4">
                {t.comingSoon}
            </h1>
            
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
                {t.underConstruction}
            </p>

            <div className="mt-8 h-1 w-24 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full opacity-50" />
        </motion.div>
       </div>
    </div>
  );
};
