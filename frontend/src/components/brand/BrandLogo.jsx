import { motion, useReducedMotion } from 'framer-motion';
import BrandMark from './BrandMark.jsx';
import { EASE } from '../../lib/animations.js';

/**
 * Full lockup: animated mark + "SmartInvoice Pro" wordmark (+ optional tagline).
 * Used in the navbar (interactive), auth pages and splash (animated entrance).
 */
export default function BrandLogo({
  size = 32,
  animate = true,
  interactive = false,
  loop = false,
  variant = 'plain',
  tagline = false,
  wordmarkSize = 'text-[15px]',
  className = '',
  uid = 'logo',
}) {
  const reduce = useReducedMotion();
  const play = animate && !reduce;

  const word = {
    hidden: { opacity: 0, x: -6 },
    show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE, delay: play ? 0.5 : 0 } },
  };

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark size={size} animate={animate} interactive={interactive} loop={loop} variant={variant} uid={uid} />
      <motion.span
        initial={play ? 'hidden' : false}
        animate="show"
        variants={word}
        className="flex flex-col leading-none"
      >
        <span className={`${wordmarkSize} font-bold tracking-tight text-ink-900 dark:text-white`}>
          SmartInvoice<span className="text-gradient"> Pro</span>
        </span>
        {tagline && (
          <span className="mt-1 text-[11px] font-medium tracking-wide text-ink-400">
            Smart Billing. Better Business.
          </span>
        )}
      </motion.span>
    </span>
  );
}
