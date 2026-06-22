import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../lib/animations.js';

/**
 * Animated SmartInvoice Pro mark — the brand centerpiece.
 *
 * Composition (on the established identity):
 *   • invoice document page        → fades + scales in
 *   • invoice lines                → draw themselves left→right
 *   • "S" monogram                 → self-draws (pathLength)
 *   • growth arrow                 → draws, rises, and glows
 *
 * Props:
 *   size        px (default 36)
 *   animate     play the draw-in once on mount (default true)
 *   interactive hover: scale 1.05 + arrow glow (for the navbar)
 *   variant     'plain' (transparent) | 'tile' (gradient squircle)
 *   loop        gently re-pulse the arrow forever (for the splash)
 */
export default function BrandMark({
  size = 36,
  animate = true,
  interactive = false,
  variant = 'plain',
  loop = false,
  className = '',
  uid = 'bm',
}) {
  const reduce = useReducedMotion();
  const play = animate && !reduce;
  const state = play ? 'show' : 'shown';

  const tile = variant === 'tile';
  const blue = tile ? '#FFFFFF' : '#2563EB';
  const cyan = tile ? '#22D3EE' : '#06B6D4';
  const paper = tile ? '#FFFFFF' : '#2563EB';

  // Static = jump straight to the resolved values, no transition.
  const draw = (showTransition, shownExtra = {}) => ({
    hidden: { pathLength: 0, opacity: 0 },
    show: { pathLength: 1, opacity: 1, transition: showTransition },
    shown: { pathLength: 1, opacity: 1, ...shownExtra },
  });

  const lineVar = (delay, opacity) => ({
    hidden: { pathLength: 0, opacity: 0 },
    show: {
      pathLength: 1,
      opacity,
      transition: { pathLength: { duration: 0.5, ease: EASE, delay }, opacity: { duration: 0.2, delay } },
    },
    shown: { pathLength: 1, opacity },
  });

  return (
    <motion.div
      className={`relative inline-flex shrink-0 ${interactive ? 'group cursor-pointer' : ''} ${className}`}
      style={{ width: size, height: size }}
      whileHover={interactive && !reduce ? { scale: 1.05 } : undefined}
      whileTap={interactive && !reduce ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 26 }}
    >
      <motion.svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        fill="none"
        initial={play ? 'hidden' : 'shown'}
        animate={state}
        role="img"
        aria-label="SmartInvoice Pro"
        style={{ overflow: 'visible' }}
      >
        {tile && (
          <defs>
            <linearGradient id={`${uid}-tile`} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3563e9" />
              <stop offset="1" stopColor="#1d3bb0" />
            </linearGradient>
          </defs>
        )}

        {/* Squircle background (tile variant only) */}
        {tile && (
          <motion.rect
            width="48"
            height="48"
            rx="11"
            fill={`url(#${uid}-tile)`}
            variants={{
              hidden: { opacity: 0, scale: 0.9 },
              show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE } },
              shown: { opacity: 1, scale: 1 },
            }}
            style={{ transformOrigin: 'center' }}
          />
        )}

        {/* Invoice document page */}
        <motion.rect
          x="11"
          y="9"
          width="26"
          height="30"
          rx="6"
          fill={paper}
          variants={{
            hidden: { opacity: 0, scale: 0.85 },
            show: { opacity: tile ? 0.16 : 0.08, scale: 1, transition: { duration: 0.4, ease: EASE } },
            shown: { opacity: tile ? 0.16 : 0.08, scale: 1 },
          }}
          style={{ transformOrigin: '24px 24px' }}
        />

        {/* Invoice lines — draw themselves */}
        <motion.path d="M16.5 15 H29" stroke={blue} strokeWidth="1.6" strokeLinecap="round" variants={lineVar(0.28, tile ? 0.5 : 0.28)} />
        <motion.path d="M16.5 22 H32" stroke={blue} strokeWidth="1.6" strokeLinecap="round" variants={lineVar(0.36, tile ? 0.4 : 0.22)} />
        <motion.path d="M16.5 29 H26" stroke={blue} strokeWidth="1.6" strokeLinecap="round" variants={lineVar(0.44, tile ? 0.32 : 0.18)} />

        {/* S monogram — self-draws */}
        <motion.path
          d="M34.2 17.4C34.2 13.6 30.2 12 24 12C17.8 12 13.8 14.2 13.8 17.9C13.8 21.3 17 22.9 24 23.9C31 24.9 34.2 26.7 34.2 30.2C34.2 34 30.1 35.8 24 35.8C18.2 35.8 14.2 34.2 13.4 31"
          stroke={blue}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={draw({ pathLength: { duration: 0.8, ease: EASE, delay: 0.2 }, opacity: { duration: 0.15, delay: 0.2 } })}
        />

        {/* Growth arrow — draws, rises, glows */}
        <motion.g
          variants={{
            hidden: { y: 4, opacity: 0 },
            show: {
              y: 0,
              opacity: 1,
              transition: { y: { duration: 0.4, ease: EASE, delay: 0.78 }, opacity: { duration: 0.2, delay: 0.78 } },
            },
            shown: { y: 0, opacity: 1 },
          }}
          className={interactive ? 'transition-[filter] duration-300 group-hover:[filter:drop-shadow(0_0_5px_rgba(6,182,212,0.85))]' : ''}
        >
          <motion.path
            d="M29.5 20L38.6 11M33.8 10.8H39V16"
            stroke={cyan}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw({ pathLength: { duration: 0.4, ease: EASE, delay: 0.82 } })}
          />
          {/* Loop pulse for the splash hero */}
          {loop && !reduce && (
            <motion.circle
              cx="38.6"
              cy="11"
              r="2.4"
              fill={cyan}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.6, 0.6] }}
              transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity, delay: 1.2 }}
              style={{ transformOrigin: '38.6px 11px' }}
            />
          )}
        </motion.g>
      </motion.svg>
    </motion.div>
  );
}
