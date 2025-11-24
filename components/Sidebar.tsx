
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Language } from '../types';
import { translations } from '../utils/translations';
import { X, Gamepad2, Ghost, Briefcase, Joystick } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: GameState;
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentState, 
  onNavigate,
  language 
}) => {
  const t = translations[language];

  const menuItems = [
    { id: GameState.MENU, label: t.menuGame, icon: Gamepad2 },
    { id: GameState.GAMES_HUB, label: t.menuGamesHub, icon: Joystick },
    { id: GameState.TOOLS, label: t.menuTools, icon: Briefcase },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
          
          {/* Sidebar */}
          <motion.div 
            initial={{ x: language === 'ar' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: language === 'ar' ? '100%' : '-100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-72 bg-slate-900 border-x border-slate-700 shadow-2xl z-[100] overflow-hidden flex flex-col`}
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-xl">
                <Ghost />
                <span>Mystery Doors</span>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X />
              </button>
            </div>

            <div className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => {
                // Highlight parent menu logic
                const isActive = currentState === item.id || 
                  (item.id === GameState.MENU && (currentState === GameState.PLAYING || currentState === GameState.LEADERBOARD)) ||
                  (item.id === GameState.TOOLS && (currentState === GameState.IMAGE_EDITOR || currentState === GameState.VEO_VIDEO || currentState === GameState.CHAT || currentState === GameState.GENERATOR)) ||
                  (item.id === GameState.GAMES_HUB && (currentState === GameState.AI_TRIVIA));
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onClose();
                    }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                      isActive 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <item.icon size={24} />
                    <span className="font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-6 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-600 font-mono mb-1">Developed by Ibrahim</p>
              <p className="text-[10px] text-slate-700">v2.2.0 AI Hub</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
