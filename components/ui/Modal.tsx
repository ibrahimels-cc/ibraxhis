import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { XCircle, CheckCircle2, AlertTriangle, Trophy } from 'lucide-react';

interface ModalProps {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'achievement';
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  showInput?: boolean;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputPlaceholder?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  title, 
  message, 
  type, 
  actionLabel, 
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  showInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder = ''
}) => {
  const getIcon = () => {
    switch(type) {
        case 'success': return <CheckCircle2 size={64} className="text-green-500" />;
        case 'error': return <XCircle size={64} className="text-red-500" />;
        case 'achievement': return <Trophy size={64} className="text-yellow-500" />;
        default: return <AlertTriangle size={64} className="text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
      >
        <div className="flex justify-center mb-6">
            {getIcon()}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 mb-8 leading-relaxed whitespace-pre-line">{message}</p>
        
        {showInput && (
          <div className="mb-6">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => onInputChange?.(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-amber-500 transition-colors text-center font-bold"
              autoFocus
            />
          </div>
        )}

        <div className="space-y-3">
            <Button onClick={onAction} fullWidth variant={type === 'error' ? 'primary' : 'primary'}>
                {actionLabel}
            </Button>
            {secondaryActionLabel && onSecondaryAction && (
                <Button onClick={onSecondaryAction} fullWidth variant="secondary">
                    {secondaryActionLabel}
                </Button>
            )}
        </div>
      </motion.div>
    </div>
  );
};