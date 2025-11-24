
import React from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { DoorOpen, Search, Brain, KeyRound, Trophy, Settings as SettingsIcon, PlayCircle } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { audioManager } from '../utils/audio';
import { RewardChest } from './RewardChest';

interface MainMenuProps {
  onStart: () => void;
  onShowLeaderboard: () => void;
  onShowSettings: () => void;
  language: Language;
  lastRewardClaimed: number;
  onClaimReward: () => void;
  hasSavedGame: boolean;
  onResume: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ 
  onStart, 
  onShowLeaderboard, 
  onShowSettings, 
  language,
  lastRewardClaimed,
  onClaimReward,
  hasSavedGame,
  onResume
}) => {
  const t = translations[language];

  const handleStart = () => {
    audioManager.playClick();
    onStart();
  };

  const handleResume = () => {
    audioManager.playClick();
    onResume();
  };

  const handleSettings = () => {
    audioManager.playClick();
    onShowSettings();
  };

  const handleLeaderboard = () => {
    audioManager.playClick();
    onShowLeaderboard();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
        {/* Background Ambient Effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-900/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="z-10 mb-8 space-y-4 mt-12 md:mt-0"
        >
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <DoorOpen size={80} className="text-amber-500" />
                    <motion.div 
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"
                    />
                </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-500 tracking-tight">
                Mystery Doors
            </h1>
            <p className="text-xl text-amber-500/80 font-light tracking-[0.2em] uppercase">{t.titleSub}</p>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="grid grid-cols-3 gap-8 mb-10 max-w-lg w-full"
        >
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 shadow-lg">
                    <Brain size={24} />
                </div>
                <span className="text-xs text-slate-500 font-semibold">{t.intelligence}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-lg">
                    <Search size={24} />
                </div>
                <span className="text-xs text-slate-500 font-semibold">{t.investigation}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-red-400 shadow-lg">
                    <KeyRound size={24} />
                </div>
                <span className="text-xs text-slate-500 font-semibold">{t.luck}</span>
            </div>
        </motion.div>

        <motion.div
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.6 }}
             className="w-full max-w-xs space-y-4 relative z-20"
        >
            {hasSavedGame && (
                <Button onClick={handleResume} fullWidth className="text-xl py-4 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse border border-emerald-400">
                    <PlayCircle size={24} />
                    {t.resumeGame}
                </Button>
            )}

            <Button onClick={handleStart} fullWidth className={`text-xl py-4 ${!hasSavedGame ? 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' : ''}`}>
                {t.start}
            </Button>

            <Button onClick={handleSettings} fullWidth variant="secondary" className="text-lg">
                <SettingsIcon size={20} />
                {t.settings}
            </Button>

            <Button onClick={handleLeaderboard} fullWidth variant="secondary" className="text-lg bg-slate-800/50">
                <Trophy size={20} />
                {t.leaderboard}
            </Button>

            {/* Reward Box Section */}
            <RewardChest 
              lastClaimed={lastRewardClaimed} 
              onClaim={onClaimReward}
              language={language}
            />

        </motion.div>

        <div className="absolute bottom-2 text-slate-600 text-xs">
            {t.developer}
        </div>
    </div>
  );
};
