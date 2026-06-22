import { useEffect } from 'react';
import { motion } from 'framer-motion';
import BrandMark from './BrandMark.jsx';
import { EASE } from '../../lib/animations.js';

/**
 * Premium loading splash. Plays the logo draw-in once on startup, then signals
 * completion. Parent controls mount/unmount via <AnimatePresence>.
 */
export default function SplashScreen({ onDone, duration = 1700 }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), duration);
    return () => clearTimeout(t);
  }, [onDone, duration]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-ink-950"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: EASE } }}
    >
      {/* Ambient gradient field */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-brand-500/25 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent-500/20 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-light bg-[size:34px_34px] opacity-[0.05]" />

      <motion.div
        className="relative flex flex-col items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35, ease: EASE } }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <BrandMark size={104} animate loop variant="tile" uid="splash" />

        <motion.h1
          className="mt-6 text-2xl font-bold tracking-tight text-white"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.55 }}
        >
          SmartInvoice<span className="text-gradient"> Pro</span>
        </motion.h1>
        <motion.p
          className="mt-1.5 text-sm text-ink-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          Smart Billing. Better Business.
        </motion.p>

        {/* Indeterminate progress shimmer */}
        <div className="relative mt-7 h-1 w-44 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-brand-400 to-accent-400"
            initial={{ x: '-110%' }}
            animate={{ x: '210%' }}
            transition={{ duration: 1.1, ease: EASE, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
