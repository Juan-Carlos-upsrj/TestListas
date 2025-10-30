import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Sub-components for animations ---

const ConfettiPiece: React.FC<{ i: number }> = ({ i }) => {
  const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
  return (
    <motion.div
      className="absolute top-0 w-2 h-4 pointer-events-none"
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

const Balloon: React.FC<{ i: number }> = ({ i }) => {
    const colors = ['rgba(239, 68, 68, 0.8)', 'rgba(59, 130, 246, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(168, 85, 247, 0.8)'];
    const sideSway = (Math.random() - 0.5) * 100;
    return (
        <motion.div
            className="absolute bottom-0 w-12 h-16 rounded-full pointer-events-none"
            style={{
                backgroundColor: colors[i % colors.length],
                left: `${Math.random() * 80 + 10}%`, // Avoid edges
                filter: 'blur(1px)'
            }}
            initial={{ y: '20vh' }}
            animate={{
                y: '-120vh',
                x: [0, sideSway, 0], // Gentle side-to-side motion
            }}
            transition={{
                duration: Math.random() * 8 + 10,
                repeat: Infinity,
                delay: Math.random() * 8,
                ease: 'linear',
                repeatType: 'loop',
            }}
        />
    );
};

const FireworkBurst: React.FC<{ i: number }> = () => {
    const numSparks = 12;
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const delay = Math.random() * 4;

    return (
        <div 
            className="absolute pointer-events-none" 
            style={{ top: `${Math.random() * 50 + 10}%`, left: `${Math.random() * 80 + 10}%` }}
        >
            {Array.from({ length: numSparks }).map((_, j) => (
                <motion.div
                    key={j}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color, top: 0, left: 0 }}
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{
                        scale: [0.5, 1, 0],
                        opacity: [1, 1, 0],
                        x: Math.cos((j / numSparks) * 2 * Math.PI) * (Math.random() * 40 + 60),
                        y: Math.sin((j / numSparks) * 2 * Math.PI) * (Math.random() * 40 + 60),
                    }}
                    transition={{
                        duration: 1.2,
                        ease: 'easeOut',
                        delay: delay,
                        repeat: Infinity,
                        repeatDelay: 4
                    }}
                />
            ))}
        </div>
    );
};


const BirthdayCelebration: React.FC<{ name: string; show: boolean }> = ({ name, show }) => {
    const [isVisible, setIsVisible] = useState(show);

    useEffect(() => {
        setIsVisible(show);
    }, [show]);

    const numConfetti = 50;
    const numBalloons = 15;
    const numFireworks = 8;
    
    return (
        <AnimatePresence>
            {isVisible && (
                 <motion.div 
                    className="fixed inset-0 z-[99] pointer-events-auto cursor-pointer overflow-hidden"
                    onClick={() => setIsVisible(false)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="absolute inset-0 bg-black/30" />
                    
                    {Array.from({ length: numConfetti }).map((_, i) => <ConfettiPiece key={`c-${i}`} i={i} />)}
                    {Array.from({ length: numBalloons }).map((_, i) => <Balloon key={`b-${i}`} i={i} />)}
                    {Array.from({ length: numFireworks }).map((_, i) => <FireworkBurst key={`f-${i}`} i={i} />)}

                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1, transition: { delay: 0.2, duration: 0.5 } }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-12 rounded-2xl shadow-2xl text-center cursor-default"
                    >
                        <p className="text-6xl mb-6">🎉</p>
                        <h2 className="text-4xl font-bold">¡Feliz Cumpleaños!</h2>
                        <p className="text-3xl text-indigo-500 font-semibold mt-2">{name}</p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BirthdayCelebration;