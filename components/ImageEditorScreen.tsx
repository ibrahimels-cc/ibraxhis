
import React, { useState, useRef } from 'react';
import { Language, GameState } from '../types';
import { translations } from '../utils/translations';
import { editImage } from '../services/geminiService';
import { Upload, Sparkles, Image as ImageIcon, Download, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';

interface ImageEditorScreenProps {
  onNavigate: (state: GameState) => void;
  language: Language;
}

export const ImageEditorScreen: React.FC<ImageEditorScreenProps> = ({ onNavigate, language }) => {
  const t = translations[language];
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get raw base64 for API
        const base64 = result.split(',')[1];
        setImage(base64);
        setMimeType(file.type);
        setResultImage(null); // Clear previous result
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      const resultBase64 = await editImage(image, mimeType, prompt);
      if (resultBase64) {
        setResultImage(resultBase64);
      } else {
        alert(t.imgEdError);
      }
    } catch (error) {
      console.error(error);
      alert(t.imgEdError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${resultImage}`;
      link.download = `magic-edit-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8 pt-20 flex flex-col">
       <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={() => onNavigate(GameState.TOOLS)}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 transition-colors"
            >
                {language === 'ar' ? <ArrowLeft size={24} /> : <ArrowLeft size={24} className="rotate-180" />}
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="text-purple-500" />
                {t.imgEdTitle}
            </h1>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Input Section */}
            <div className="flex flex-col gap-6">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                        border-2 border-dashed rounded-2xl h-64 md:h-80 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                        ${image ? 'border-slate-700 bg-slate-900' : 'border-slate-700 hover:border-amber-500 bg-slate-900 hover:bg-slate-800'}
                    `}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    
                    {image ? (
                        <>
                            <img 
                                src={`data:${mimeType};base64,${image}`} 
                                alt="Original" 
                                className="w-full h-full object-contain p-2"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-bold flex items-center gap-2">
                                    <RefreshCw size={20} /> {t.imgEdUpload}
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-6">
                            <Upload size={48} className="mx-auto text-slate-500 mb-4 group-hover:text-amber-500 transition-colors" />
                            <p className="text-slate-400 font-bold">{t.imgEdUpload}</p>
                        </div>
                    )}
                </div>

                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t.imgEdPromptPlaceholder}
                        className="w-full bg-slate-800 border-slate-700 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500 transition-colors resize-none h-24"
                    />
                    <Button 
                        onClick={handleEdit} 
                        fullWidth 
                        disabled={!image || !prompt.trim() || isLoading}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" /> {t.processing}
                            </>
                        ) : (
                            <>
                                <Sparkles /> {t.imgEdButton}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Output Section */}
            <div className={`
                bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[400px]
                ${resultImage ? 'shadow-[0_0_30px_rgba(168,85,247,0.15)]' : ''}
            `}>
                <h3 className="absolute top-4 left-4 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded">
                    {t.imgEdResult}
                </h3>

                {resultImage ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full h-full flex flex-col items-center justify-center"
                    >
                        <img 
                            src={`data:image/png;base64,${resultImage}`} 
                            alt="Result" 
                            className="max-w-full max-h-[500px] object-contain rounded-lg shadow-2xl mb-4"
                        />
                        <Button onClick={handleDownload} variant="secondary">
                            <Download size={20} /> {t.imgEdDownload}
                        </Button>
                    </motion.div>
                ) : (
                    <div className="text-center text-slate-600">
                        {isLoading ? (
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles size={64} className="text-purple-500/50" />
                            </motion.div>
                        ) : (
                            <>
                                <ImageIcon size={64} className="mx-auto mb-4 opacity-30" />
                                <p className="text-sm">{t.imgEdResult}...</p>
                            </>
                        )}
                    </div>
                )}
            </div>

        </div>
       </div>
    </div>
  );
};
