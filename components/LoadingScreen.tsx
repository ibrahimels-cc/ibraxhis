
import React from 'react';
import { motion } from 'framer-motion';
import { DoorOpen, KeyRound, Sparkles, Brain, Search } from 'lucide-react';

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
  // Puzzle icons that float around the center
  const icons = [
    { Icon: KeyRound, color: 'text-red-400', delay: 0, x: -60, y: -40 },
    { Icon: Brain, color: 'text-purple-400', delay: 0.5, x: 60, y: -40 },
    { Icon: Search, color: 'text-blue-400', delay: 1, x: 0, y: 60 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden z-50">
      {/* Background Animated Gradient */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute w-[500px] h-[500px] bg-gradient-to-r from-indigo-900/30 to-purple-900/30 rounded-full blur-[100px]"
      />

      <div className="relative z-10 flex flex-col items-center">
        {/* Central Door Animation */}
        <div className="relative mb-12">
            <motion.div
                animate={{ 
                    scale: [1, 1.05, 1],
                    filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <DoorOpen size={100} className="text-amber-500" />
            </motion.div>
            
            {/* Sparkles appearing around */}
            <motion.div 
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, times: [0, 0.5, 1] }}
                className="absolute -top-2 -right-2 text-yellow-200"
            >
                <Sparkles size={32} />
            </motion.div>

            {/* Orbiting Icons */}
            {icons.map(({ Icon, color, delay, x, y }, index) => (
                <motion.div
                    key={index}
                    animate={{ 
                        x: [0, x, 0],
                        y: [0, y, 0],
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                        duration: 3, 
                        repeat: Infinity, 
                        delay: delay,
                        ease: "easeInOut"
                    }}
                    className={`absolute inset-0 flex items-center justify-center ${color}`}
                >
                    <Icon size={24} />
                </motion.div>
            ))}
        </div>

        {/* Text Animation */}
        <div className="text-center space-y-6 px-4">
            <motion.h2 
                key={message}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-amber-200 to-slate-200"
            >
                {message}
            </motion.h2>
            
            {/* Progress Bar styled */}
            <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden mx-auto relative shadow-inner">
                {/* Shimmer effect */}
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 z-10"
                />
                {/* Filling bar */}
                <motion.div 
                    animate={{ width: ["10%", "90%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
            </div>
        </div>
      </div>
    </div>
  );
};
