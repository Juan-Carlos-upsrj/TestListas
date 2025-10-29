import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfettiPiece: React.FC<{ i: number }> = ({ i }) => {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
  return (
    <motion.div
      className="absolute top-0 left-0 w-2 h-4"
      style={{
        backgroundColor: colors[i % colors.length],
        left: `${Math.random() * 100}%`,
      }}
      initial={{ y: '-10vh', opacity: 1 }}
      animate={{ 
          y: '110vh', 
          rotate: Math.random() * 360,
          opacity: [1, 1, 0]
      }}
      transition={{ 
          duration: Math.random() * 3 + 4,
          repeat: Infinity,
          delay: Math.random() * 5,
          ease: "linear"
      }}
    />
  );
};

const BirthdayCelebration: React.FC<{ name: string; show: boolean }> = ({ name, show }) => {
    const numConfetti = 50;
    return (
        <AnimatePresence>
            {show && (
                 <div className="fixed inset-0 z-[99] pointer-events-none overflow-hidden">
                    {Array.from({ length: numConfetti }).map((_, i) => <ConfettiPiece key={i} i={i} />)}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: 0.2, duration: 0.5 } }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-8 rounded-2xl shadow-2xl text-center"
                    >
                        <p className="text-4xl mb-4">🎉</p>
                        <h2 className="text-2xl font-bold">¡Feliz Cumpleaños!</h2>
                        <p className="text-xl text-indigo-500 font-semibold">{name}</p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BirthdayCelebration;
