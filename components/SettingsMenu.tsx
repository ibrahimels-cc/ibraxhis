
import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Globe, Music, BarChart2 } from 'lucide-react';
import { Language, AppSettings, Difficulty } from '../types';
import { translations } from '../utils/translations';
import { audioManager } from '../utils/audio';

interface SettingsMenuProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onUpdateSettings, onClose }) => {
  const t = translations[settings.language];

  const changeLanguage = (lang: Language) => {
    audioManager.playClick();
    onUpdateSettings({ ...settings, language: lang });
  };

  const changeDifficulty = (diff: Difficulty) => {
      audioManager.playClick();
      onUpdateSettings({ ...settings, difficulty: diff });
  };

  const toggleMusic = () => {
    audioManager.playClick();
    const newVol = settings.musicVolume > 0 ? 0 : 0.3;
    onUpdateSettings({ ...settings, musicVolume: newVol });
  };

  const toggleSfx = () => {
    audioManager.playClick();
    const newVol = settings.sfxVolume > 0 ? 0 : 0.5;
    onUpdateSettings({ ...settings, sfxVolume: newVol });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
      >
        <button 
            onClick={() => { audioManager.playClick(); onClose(); }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
            <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Globe className="text-amber-500" />
            {t.settings}
        </h2>
        
        <div className="space-y-8">
            {/* Language Section */}
            <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">{t.language}</h3>
                <div className="grid grid-cols-3 gap-3">
                    {(['ar', 'en', 'jp'] as Language[]).map((lang) => (
                        <button
                            key={lang}
                            onClick={() => changeLanguage(lang)}
                            className={`
                                py-3 px-4 rounded-xl font-bold transition-all border-2
                                ${settings.language === lang 
                                    ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}
                            `}
                        >
                            {lang === 'ar' ? 'العربية' : (lang === 'jp' ? '日本語' : 'English')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty Section */}
            <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BarChart2 size={16} /> {t.difficulty}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                        <button
                            key={diff}
                            onClick={() => changeDifficulty(diff)}
                            className={`
                                py-3 px-2 rounded-xl font-bold transition-all border-2 text-sm capitalize
                                ${settings.difficulty === diff
                                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'}
                            `}
                        >
                            {t[diff]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Audio Section */}
            <div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-4">Audio</h3>
                <div className="space-y-3">
                    <button 
                        onClick={toggleMusic}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Music size={20} className="text-indigo-400" />
                            <span className="font-semibold text-slate-200">{t.music}</span>
                        </div>
                        {settings.musicVolume > 0 ? <Volume2 className="text-green-400" /> : <VolumeX className="text-slate-500" />}
                    </button>

                    <button 
                        onClick={toggleSfx}
                        className="w-full flex items-center justify-between p-4 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Volume2 size={20} className="text-pink-400" />
                            <span className="font-semibold text-slate-200">{t.sfx}</span>
                        </div>
                        {settings.sfxVolume > 0 ? <Volume2 className="text-green-400" /> : <VolumeX className="text-slate-500" />}
                    </button>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
