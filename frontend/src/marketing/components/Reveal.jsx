import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../lib/animations.js';

// Scroll-triggered reveal. Children fade + rise into view once, with an optional
// stagger delay. Respects prefers-reduced-motion.
export default function Reveal({ children, delay = 0, y = 16, className = '', as = 'div' }) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] || motion.div;
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}
