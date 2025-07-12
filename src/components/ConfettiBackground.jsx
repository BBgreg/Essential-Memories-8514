import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfettiBackground = ({ burst = false }) => {
  const [particles, setParticles] = useState([]);
  const [burstParticles, setBurstParticles] = useState([]);

  const colors = ['#FFB3D9', '#A8E6CF', '#FFE066', '#D4A5FF', '#FFB3A7'];

  // Background floating confetti
  useEffect(() => {
    const generateParticles = () => {
      const newParticles = [];
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2,
          delay: Math.random() * 3
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 30000);
    return () => clearInterval(interval);
  }, []);

  // Burst confetti effect
  useEffect(() => {
    if (burst) {
      const newBurstParticles = [];
      for (let i = 0; i < 50; i++) {
        newBurstParticles.push({
          id: `burst-${i}`,
          x: 50 + (Math.random() - 0.5) * 20,
          y: 50,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 6 + 3,
          vx: (Math.random() - 0.5) * 100,
          vy: (Math.random() - 0.5) * 100
        });
      }
      setBurstParticles(newBurstParticles);
      
      setTimeout(() => setBurstParticles([]), 3000);
    }
  }, [burst]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Background floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 360],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Burst particles */}
      <AnimatePresence>
        {burstParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
            }}
            initial={{
              opacity: 1,
              scale: 0
            }}
            animate={{
              opacity: 0,
              scale: 1,
              x: particle.vx,
              y: particle.vy,
              rotate: 360
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 2,
              ease: "easeOut"
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ConfettiBackground;