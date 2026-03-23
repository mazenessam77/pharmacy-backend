'use client';

import { motion } from 'framer-motion';

export function PillBottle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="50" width="70" height="110" rx="8" fill="white" stroke="black" strokeWidth="2" />
      <rect x="20" y="35" width="80" height="20" rx="4" fill="black" />
      <rect x="35" y="70" width="50" height="30" rx="2" fill="none" stroke="black" strokeWidth="1.5" />
      <text x="60" y="89" textAnchor="middle" fill="black" fontSize="8" fontFamily="Helvetica" fontWeight="300" letterSpacing="0.1em">Rx</text>
      <line x1="35" y1="115" x2="85" y2="115" stroke="black" strokeWidth="1" opacity="0.3" />
      <line x1="35" y1="125" x2="70" y2="125" stroke="black" strokeWidth="1" opacity="0.3" />
      <line x1="35" y1="135" x2="75" y2="135" stroke="black" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

export function Capsule({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="140" height="60" rx="30" fill="white" stroke="black" strokeWidth="2" />
      <rect x="80" y="10" width="70" height="60" rx="30" fill="black" />
      <line x1="80" y1="10" x2="80" y2="70" stroke="black" strokeWidth="2" />
    </svg>
  );
}

export function Tablet({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" fill="white" stroke="black" strokeWidth="2" />
      <line x1="50" y1="15" x2="50" y2="85" stroke="black" strokeWidth="1.5" opacity="0.4" />
      <text x="50" y="54" textAnchor="middle" fill="black" fontSize="10" fontFamily="Helvetica" fontWeight="300">500mg</text>
    </svg>
  );
}

export function Syringe({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="15" width="100" height="30" rx="2" fill="white" stroke="black" strokeWidth="2" />
      <rect x="40" y="15" width="50" height="30" fill="black" opacity="0.1" />
      <rect x="140" y="20" width="30" height="20" rx="1" fill="black" />
      <line x1="170" y1="30" x2="180" y2="30" stroke="black" strokeWidth="3" />
      <rect x="10" y="25" width="30" height="10" fill="white" stroke="black" strokeWidth="2" />
      <line x1="65" y1="15" x2="65" y2="45" stroke="black" strokeWidth="1" opacity="0.3" />
      <line x1="90" y1="15" x2="90" y2="45" stroke="black" strokeWidth="1" opacity="0.3" />
      <line x1="115" y1="15" x2="115" y2="45" stroke="black" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}

export function Stethoscope({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 20 Q30 70 60 90 Q90 70 90 20" stroke="black" strokeWidth="2.5" fill="none" />
      <circle cx="30" cy="15" r="6" fill="black" />
      <circle cx="90" cy="15" r="6" fill="black" />
      <circle cx="60" cy="105" r="15" fill="white" stroke="black" strokeWidth="2.5" />
      <circle cx="60" cy="105" r="6" fill="black" />
      <line x1="60" y1="90" x2="60" y2="95" stroke="black" strokeWidth="2.5" />
    </svg>
  );
}

export function HeartPulse({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M70 85 C30 55, 10 30, 35 15 C50 7, 65 15, 70 30 C75 15, 90 7, 105 15 C130 30, 110 55, 70 85Z"
        fill="none" stroke="black" strokeWidth="2" />
      <polyline points="20,55 45,55 55,35 65,70 75,45 85,55 120,55"
        stroke="black" strokeWidth="2" fill="none" />
    </svg>
  );
}

const floatVariants = {
  animate: (i: number) => ({
    y: [0, -12, 0],
    rotate: [0, i % 2 === 0 ? 3 : -3, 0],
    transition: {
      duration: 4 + i * 0.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  }),
};

export function FloatingMedicines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div custom={0} variants={floatVariants} animate="animate"
        className="absolute top-[10%] left-[5%] opacity-[0.07]">
        <PillBottle className="w-24 h-36" />
      </motion.div>
      <motion.div custom={1} variants={floatVariants} animate="animate"
        className="absolute top-[20%] right-[8%] opacity-[0.07]">
        <Capsule className="w-32 h-16" />
      </motion.div>
      <motion.div custom={2} variants={floatVariants} animate="animate"
        className="absolute bottom-[25%] left-[10%] opacity-[0.07]">
        <Tablet className="w-20 h-20" />
      </motion.div>
      <motion.div custom={3} variants={floatVariants} animate="animate"
        className="absolute bottom-[15%] right-[5%] opacity-[0.07]">
        <Syringe className="w-36 h-12" />
      </motion.div>
      <motion.div custom={4} variants={floatVariants} animate="animate"
        className="absolute top-[50%] left-[50%] -translate-x-1/2 opacity-[0.04]">
        <HeartPulse className="w-40 h-28" />
      </motion.div>
    </div>
  );
}
