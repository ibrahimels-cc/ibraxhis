
import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';
import { generateAppCode } from '../services/geminiService';
import { Code, Play, Download, Copy, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AppGeneratorScreenProps {
  language: Language;
}

export const AppGeneratorScreen: React.FC<AppGeneratorScreenProps> = ({ language }) => {
  const t = translations[language];
  const [prompt, setPrompt] = useState('');
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullScreenPreview, setShowFullScreenPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setShowFullScreenPreview(false);
    setCode('');
    
    const result = await generateAppCode(prompt);
    setCode(result);
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 pt-16 px-4 pb-4 gap-4 relative">
      
      {/* Header & Input */}
      <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            {t.genTitle}
          </h1>
          <p className="text-slate-400 text-sm">{t.developer}</p>
        </motion.div>

        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-3">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.genPlaceholder}
                className="flex-1 bg-slate-800 border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none h-24 md:h-auto"
            />
            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold rounded-xl px-8 py-3 flex items-center justify-center gap-2 transition-all"
            >
                {isGenerating ? <Loader2 className="animate-spin" /> : <Code />}
                {isGenerating ? t.generating : t.genButton}
            </button>
        </div>
      </div>

      {/* Results Area */}
      {code && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col max-w-5xl mx-auto w-full overflow-hidden bg-slate-900 rounded-2xl border border-slate-800"
        >
            <div className="bg-slate-800 p-3 flex items-center justify-between border-b border-slate-700">
                <span className="text-xs font-mono text-slate-400">index.html</span>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setShowFullScreenPreview(true)} 
                        className="text-xs bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded text-white flex items-center gap-2 font-bold shadow-lg shadow-emerald-900/20 transition-all hover:scale-105"
                     >
                        <Play size={14} fill="currentColor" /> {t.preview}
                    </button>
                    <button onClick={handleCopy} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-300 flex items-center gap-1 transition-colors">
                        <Copy size={12} /> {copySuccess ? t.copied : t.copy}
                    </button>
                    <button onClick={handleDownload} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-slate-300 flex items-center gap-1 transition-colors">
                        <Download size={12} /> {t.download}
                    </button>
                </div>
            </div>
            <div className="flex-1 relative overflow-auto custom-scrollbar bg-[#1e1e1e]">
                <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-100 leading-relaxed whitespace-pre-wrap">
                    {code}
                </pre>
            </div>
        </motion.div>
      )}

      {/* Full Screen Preview Overlay */}
      <AnimatePresence>
        {showFullScreenPreview && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[200] bg-white flex flex-col"
            >
                {/* Close Button Area */}
                <div className="absolute top-4 left-4 right-4 flex justify-end pointer-events-none z-50">
                     <button 
                        onClick={() => setShowFullScreenPreview(false)}
                        className="pointer-events-auto bg-slate-900/80 hover:bg-red-600 text-white p-3 rounded-full backdrop-blur-md shadow-2xl transition-all hover:scale-110 border border-slate-700"
                    >
                        <X size={28} />
                    </button>
                </div>

                <iframe 
                    srcDoc={code} 
                    title="Full Preview" 
                    className="w-full h-full border-0" 
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                />
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
