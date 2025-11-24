
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy, Medal, Crown, Loader2, Ghost } from 'lucide-react';
import { Button } from './ui/Button';
import { LeaderboardEntry, Language } from '../types';
import { getLeaderboard } from '../services/leaderboardService';
import { translations } from '../utils/translations';
import { audioManager } from '../utils/audio';

interface LeaderboardProps {
  onBack: () => void;
  language: Language;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, language }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[language];

  useEffect(() => {
    const fetchScores = async () => {
        setLoading(true);
        try {
            const data = await getLeaderboard();
            setScores(data);
        } catch (error) {
            console.error("Failed to fetch scores", error);
        } finally {
            setLoading(false);
        }
    };
    fetchScores();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown size={24} className="text-yellow-400" />;
    if (index === 1) return <Medal size={24} className="text-slate-300" />;
    if (index === 2) return <Medal size={24} className="text-amber-700" />;
    return <span className="font-bold text-slate-500 w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
            <button 
                onClick={() => { audioManager.playClick(); onBack(); }}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
                {language === 'ar' ? <ArrowRight size={24} /> : <ArrowRight size={24} className="rotate-180" />}
            </button>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                {t.leaderboard}
            </h1>
            <Trophy size={32} className="text-amber-500" />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl min-h-[400px]"
        >
            <div className="grid grid-cols-12 gap-2 p-4 bg-slate-800/50 text-xs md:text-sm font-bold text-slate-400 border-b border-slate-700">
                <div className="col-span-2 text-center">{t.rank}</div>
                <div className="col-span-6 px-4 text-start">{t.player}</div>
                <div className="col-span-2 text-center">{t.level}</div>
                <div className="col-span-2 text-center">{t.score}</div>
            </div>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Loader2 className="animate-spin mb-2" size={32} />
                    <p>Loading scores...</p>
                </div>
            ) : scores.length > 0 ? (
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {scores.map((entry, index) => (
                        <motion.div 
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                                grid grid-cols-12 gap-2 p-4 items-center border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors
                                ${index === 0 ? 'bg-yellow-900/10' : ''}
                            `}
                        >
                            <div className="col-span-2 flex justify-center">
                                {getRankIcon(index)}
                            </div>
                            <div className="col-span-6 px-4 font-semibold text-slate-200 truncate text-start">
                                {entry.name}
                            </div>
                            <div className="col-span-2 text-center text-slate-400 font-mono">
                                {entry.level}
                            </div>
                            <div className="col-span-2 text-center text-amber-500 font-bold font-mono">
                                {entry.score}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-600 gap-4">
                    <Ghost size={48} className="opacity-50" />
                    <div className="text-center">
                        <p className="text-lg font-bold text-slate-400 mb-1">
                            {language === 'ar' ? 'لا يوجد أبطال بعد' : 'No champions yet'}
                        </p>
                        <p className="text-sm text-slate-500">
                            {language === 'ar' ? 'سجل أول انتصار لتظهر هنا!' : 'Record the first victory to appear here!'}
                        </p>
                    </div>
                </div>
            )}
        </motion.div>

        <div className="mt-8 text-center">
             <Button onClick={() => { audioManager.playClick(); onBack(); }} variant="secondary">
                {t.back}
             </Button>
        </div>
      </div>
    </div>
  );
};
