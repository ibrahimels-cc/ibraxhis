
import React, { useState } from 'react';
import { Language, GameState } from '../types';
import { translations } from '../utils/translations';
import { generateComicScript, generateComicPanelImage, ComicPanel } from '../services/geminiService';
import { ArrowLeft, BookOpen, Download, Loader2, Brush, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';

interface ComicGeneratorScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const ComicGeneratorScreen: React.FC<ComicGeneratorScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];
  const [plot, setPlot] = useState('');
  const [style, setStyle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [panels, setPanels] = useState<ComicPanel[]>([]);

  const handleGenerate = async () => {
    if (!plot.trim() || !style.trim() || isGenerating) return;

    setIsGenerating(true);
    setPanels([]);
    
    try {
        // Step 1: Generate Script
        setCurrentStep(t.comicGenerating);
        const script = await generateComicScript(plot, style, language);
        
        // Initialize placeholders
        setPanels(script);

        // Step 2: Generate Images one by one
        for (let i = 0; i < script.length; i++) {
            setCurrentStep(`${t.comicGenerating} (${i + 1}/${script.length})`);
            
            const imageData = await generateComicPanelImage(script[i].imagePrompt);
            if (imageData) {
                setPanels(prev => {
                    const newPanels = [...prev];
                    newPanels[i] = { ...newPanels[i], imageData };
                    return newPanels;
                });
            }
        }

    } catch (e) {
        console.error(e);
        alert(t.imgEdError);
    } finally {
        setIsGenerating(false);
        setCurrentStep('');
    }
  };

  const downloadComic = () => {
      // Basic print functionality for now
      window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pt-20 flex flex-col">
       <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 print:hidden">
            <button 
                onClick={() => onNavigate(GameState.TOOLS)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
                {language === 'ar' ? <ArrowLeft size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="text-orange-500" />
                {t.comicTitle}
            </h1>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-8">
            
            {/* Input Section (Hidden when printing) */}
            <div className="w-full lg:w-1/3 space-y-4 print:hidden">
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                    <div>
                        <label className="text-sm font-bold text-slate-400 mb-2 block flex items-center gap-2">
                            <PenTool size={16} /> {t.comicTitle}
                        </label>
                        <textarea 
                            value={plot}
                            onChange={(e) => setPlot(e.target.value)}
                            placeholder={t.comicPlotPlaceholder}
                            className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors resize-none h-32"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-400 mb-2 block flex items-center gap-2">
                            <Brush size={16} /> Style
                        </label>
                        <input 
                            type="text"
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            placeholder={t.comicStylePlaceholder}
                            className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-orange-500 transition-colors"
                        />
                    </div>
                    
                    <Button 
                        onClick={handleGenerate} 
                        fullWidth 
                        disabled={!plot.trim() || !style.trim() || isGenerating}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="animate-spin" /> {currentStep}
                            </>
                        ) : (
                            <>
                                <BookOpen /> {t.comicGenerate}
                            </>
                        )}
                    </Button>
                </div>

                {panels.length > 0 && !isGenerating && (
                    <Button onClick={downloadComic} variant="secondary" fullWidth>
                        <Download size={20} /> {t.comicDownload}
                    </Button>
                )}
            </div>

            {/* Comic Output Section */}
            <div className="flex-1 bg-white rounded-xl shadow-2xl p-4 md:p-8 min-h-[600px] print:m-0 print:shadow-none print:w-full">
                {panels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                        {panels.map((panel, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border-4 border-black bg-white flex flex-col relative aspect-[3/4]" // Classic comic ratio
                            >
                                <div className="absolute top-0 left-0 bg-black text-white text-xs font-bold px-2 py-1 z-10">
                                    {idx + 1}
                                </div>
                                
                                <div className="flex-1 overflow-hidden relative bg-slate-100 flex items-center justify-center border-b-4 border-black">
                                    {panel.imageData ? (
                                        <img 
                                            src={`data:image/png;base64,${panel.imageData}`} 
                                            alt={`Panel ${idx + 1}`} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Loader2 className="animate-spin text-slate-400" size={32} />
                                    )}
                                </div>
                                
                                <div className="p-3 bg-white min-h-[80px] flex items-center justify-center text-center">
                                    <p className="font-comic text-black text-sm md:text-base font-bold uppercase leading-tight">
                                        {panel.caption}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <BookOpen size={64} className="mb-4 opacity-50" />
                        <p className="font-bold text-xl">{t.comicTitle}</p>
                    </div>
                )}
            </div>

        </div>
       </div>
       
       <style>{`
           @font-face {
               font-family: 'Comic Sans MS';
               src: local('Comic Sans MS');
           }
           .font-comic {
               font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif;
           }
       `}</style>
    </div>
  );
};
