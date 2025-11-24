
import React from 'react';
import { GameState, Language } from '../types';
import { translations } from '../utils/translations';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, DoorOpen, Ghost, Star, Smile } from 'lucide-react';
import { Button } from './ui/Button';

interface GamesHubProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const GamesHub: React.FC<GamesHubProps> = ({ onNavigate, language }) => {
  const t = translations[language];

  const games = [
    {
      id: GameState.MENU, // Mystery Doors (Main)
      title: t.gameMysteryTitle,
      description: t.gameMysteryDesc,
      icon: DoorOpen,
      color: "from-amber-600 to-orange-700",
      textColor: "text-amber-500",
      available: true,
      tag: "Main Game"
    },
    {
      id: GameState.EMOJI_QUEST,
      title: t.gameEmojiTitle,
      description: t.gameEmojiDesc,
      icon: Smile,
      color: "from-yellow-500 to-amber-500",
      textColor: "text-yellow-400",
      available: true,
      tag: "Fun"
    },
    {
      id: GameState.AI_STORY,
      title: t.storyTitle,
      description: t.storyDesc,
      icon: Ghost,
      color: "from-purple-700 to-violet-900",
      textColor: "text-purple-400",
      available: true,
      tag: "Interactive"
    },
    {
      id: GameState.AI_TRIVIA,
      title: t.gameTriviaTitle,
      description: t.gameTriviaDesc,
      icon: Brain,
      color: "from-blue-600 to-indigo-700",
      textColor: "text-blue-500",
      available: true,
      tag: "Endless"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pt-16 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1">
        <div className="mb-8 flex items-center gap-4">
            <button 
                onClick={() => onNavigate(GameState.MENU)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
                {language === 'ar' ? <ArrowLeft size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
            </button>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                {t.gamesHubTitle}
            </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col h-96 group hover:scale-[1.02] transition-transform duration-300 ${!game.available ? 'opacity-70' : ''}`}
                >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
                    
                    {/* Tag */}
                    {game.tag && (
                         <div className="absolute top-4 right-4 bg-slate-950/50 backdrop-blur border border-white/10 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                            {game.tag}
                         </div>
                    )}

                    <div className="relative p-6 flex-1 flex flex-col items-center text-center justify-center space-y-4">
                        <div className={`w-24 h-24 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center ${game.textColor} shadow-xl group-hover:rotate-6 transition-transform duration-300`}>
                            <game.icon size={48} />
                        </div>
                        <h2 className="text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">{game.title}</h2>
                        <p className="text-slate-400">{game.description}</p>
                    </div>

                    <div className="p-6 relative bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
                        {game.available ? (
                            <Button 
                                onClick={() => onNavigate(game.id as GameState)} 
                                fullWidth
                                variant="primary"
                                className="shadow-lg group-hover:shadow-amber-500/20"
                            >
                                <Star size={18} fill="currentColor" /> {t.playNow}
                            </Button>
                        ) : (
                             <div className="w-full py-3 text-center text-slate-500 font-bold bg-slate-800 rounded-xl border border-slate-700">
                                {t.comingSoon}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
      
      <div className="text-center py-6 border-t border-slate-800 mt-8">
        <p className="text-slate-500 text-sm">{t.developer}</p>
      </div>
    </div>
  );
};
