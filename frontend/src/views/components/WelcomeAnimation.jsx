import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function WelcomeAnimation({ isOpen, userName, robotImage, onComplete, title, subtitle, hideBubble }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Phase 1: Jump in (0s to 0.8s) -> handled by framer motion initial state
      setPhase(1);

      // Phase 3: Speech bubble pops in and wave at 1.2s
      const phase3Timer = setTimeout(() => {
        setPhase(3);
      }, 1200);

      // Phase 4: Confetti burst at 2.0s
      const phase4Timer = setTimeout(() => {
        setPhase(4);
      }, 2000);

      // Call onComplete at 4.5s
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 4500);

      return () => {
        document.body.style.overflow = '';
        clearTimeout(phase3Timer);
        clearTimeout(phase4Timer);
        clearTimeout(completeTimer);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]); // Removed onComplete from deps to prevent re-triggering timer on parent re-renders

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#090d16]/70 backdrop-blur-md"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {/* Main container */}
          <div className="relative flex flex-col items-center justify-center w-full max-w-2xl h-full">
            
            {/* Robot Image */}
            <motion.div
              initial={{ y: '100vh', scale: 0.5 }}
              animate={{
                y: 0,
                scale: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                mass: 0.8,
              }}
              className="relative z-20 flex flex-col items-center justify-center"
            >
              {/* Floating wrapper */}
              <motion.div
                animate={{ y: [0, -25, 0], rotate: [-2, 2, -2] }}
                transition={{ delay: 0.8, duration: 3, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                className="relative"
              >
                {/* High contrast bright light glow specifically behind the PNG speech bubble (top left of robot) */}
                <div className="absolute top-[2%] left-[2%] w-[60%] h-[40%] bg-white/85 dark:bg-white/80 rounded-full blur-2xl pointer-events-none z-[-1]" />
                <div className="absolute top-[10%] right-[10%] w-[50%] h-[50%] bg-indigo-500/25 blur-3xl rounded-full pointer-events-none z-[-2]" />

                {/* Waving animation wrapper */}
                <motion.div
                  animate={phase >= 3 ? { rotate: [0, 8, -8, 8, 0] } : {}}
                  transition={{ duration: 1.2, ease: 'easeInOut' }}
                >
                  <img
                    src={robotImage}
                    alt="Welcome Robot"
                    className="w-80 h-auto md:w-96 lg:w-[500px] drop-shadow-[0_20px_40px_rgba(64,214,162,0.4)] dark:drop-shadow-[0_0_35px_rgba(255,255,255,0.4)] pointer-events-none"
                  />
                </motion.div>
                
                {/* Glowing subtle face effect */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ delay: 1, duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
                  className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full z-[-1] pointer-events-none"
                />
              </motion.div>
            </motion.div>

            {/* Soft shadow underneath */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute bottom-[20%] z-10 w-56 md:w-72 h-8 bg-black/60 blur-2xl rounded-[100%]"
            />

            {/* Glowing particles / sparkles around robot */}
            <AnimatePresence>
              {phase >= 2 && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0, y: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1.5, 0],
                        y: -150 - (Math.random() * 80)
                      }}
                      transition={{ 
                        duration: 1.5 + Math.random(), 
                        repeat: Infinity, 
                        delay: Math.random() * 1.5 
                      }}
                      className="absolute z-10 w-2 h-2 bg-emerald-300 rounded-full blur-[2px]"
                      style={{
                        left: `${35 + (Math.random() * 30)}%`,
                        top: `${40 + (Math.random() * 30)}%`,
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Speech Bubble */}
            {!hideBubble && (
              <AnimatePresence>
                {phase >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, x: -30, y: 30 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 250, 
                      damping: 18,
                      mass: 0.8
                    }}
                    className="absolute z-30 bottom-[60%] left-[65%] md:left-[70%] max-w-[240px]"
                  >
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                      className="relative bg-slate-900/95 text-white dark:bg-slate-900/95 dark:text-white px-6 py-4 rounded-3xl rounded-bl-sm shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-indigo-500/50 backdrop-blur-md"
                    >
                      <p className="text-white text-sm md:text-base font-extrabold leading-snug">
                        {title ? (
                          <>{title}<br/><span className="text-indigo-300 text-[13px] font-bold">{subtitle}</span></>
                        ) : userName ? (
                          <>Hi <span className="text-amber-300">{userName}</span> 👋<br/><span className="text-indigo-200 text-[13px] font-bold">Welcome back!</span></>
                        ) : (
                          <>👋 Welcome back,<br/><span className="text-indigo-200 text-[13px] font-bold">Have a productive day!</span></>
                        )}
                      </p>
                      {/* Bubble tail */}
                      <div className="absolute -bottom-2 left-0 w-6 h-6 bg-slate-900/95 transform rotate-45 rounded-sm z-[-1] border-r border-b border-indigo-500/50"></div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
