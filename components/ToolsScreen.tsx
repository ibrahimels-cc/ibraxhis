
import React from 'react';
import { GameState, Language } from '../types';
import { translations } from '../utils/translations';
import { motion } from 'framer-motion';
import { Wand2, ArrowLeft, Video, MessageSquare, Code, Hammer, BookOpen } from 'lucide-react';

interface ToolsScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const ToolsScreen: React.FC<ToolsScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];

  const tools = [
    {
      id: GameState.CHAT,
      title: t.menuChat,
      description: t.toolChatDesc,
      icon: MessageSquare,
      color: "from-cyan-500 to-blue-600",
      comingSoon: false
    },
    {
      id: GameState.COMIC_GENERATOR,
      title: t.toolComic,
      description: t.toolComicDesc,
      icon: BookOpen,
      color: "from-yellow-500 to-orange-600",
      comingSoon: false
    },
    {
      id: GameState.GENERATOR,
      title: t.genTitle,
      description: t.toolGenDesc,
      icon: Code,
      color: "from-emerald-500 to-green-600",
      comingSoon: false
    },
    {
      id: GameState.IMAGE_EDITOR,
      title: t.toolImageEditor,
      description: t.toolImageDesc,
      icon: Wand2,
      color: "from-purple-500 to-indigo-600",
      comingSoon: false
    },
    {
      id: GameState.VEO_VIDEO,
      title: t.toolVeoVideo,
      description: t.toolVeoDesc,
      icon: Video,
      color: "from-pink-500 to-rose-600",
      comingSoon: true // Marked as Coming Soon
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pt-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
             <button 
                onClick={() => onNavigate(GameState.MENU)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
                {language === 'ar' ? <ArrowLeft size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
            </button>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                {t.toolsTitle}
            </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {tools.map((tool, index) => (
                <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => !tool.comingSoon && onNavigate(tool.id)}
                    className={`group relative flex flex-col ${tool.comingSoon ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    <div className={`
                        h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative flex flex-col transition-all duration-300
                        ${tool.comingSoon 
                            ? 'opacity-70 grayscale-[0.5]' 
                            : 'hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]'}
                    `}>
                        <div className={`h-2 w-full bg-gradient-to-r ${tool.color}`} />
                        
                        {/* Coming Soon Badge */}
                        {tool.comingSoon && (
                            <div className="absolute top-4 right-4 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full z-10 shadow-lg flex items-center gap-1">
                                <Hammer size={12} />
                                {t.comingSoon}
                            </div>
                        )}

                        <div className="p-6 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <tool.icon className={`${tool.comingSoon ? 'text-slate-500' : 'text-amber-500'}`} size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-100 mb-2">{tool.title}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {tool.description}
                            </p>
                        </div>
                        <div className="px-6 pb-6 pt-0 mt-auto">
                            <div className={`
                                text-sm font-bold flex items-center gap-2 transition-transform
                                ${tool.comingSoon ? 'text-slate-600' : 'text-amber-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1'}
                            `}>
                                {tool.comingSoon ? (
                                    <span>{t.comingSoon}</span>
                                ) : (
                                    <>
                                        <span>{language === 'ar' ? 'افتح الأداة' : 'Open Tool'}</span>
                                        {language === 'ar' ? <ArrowLeft size={16} /> : <ArrowLeft size={16} className="rotate-180" />}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
};