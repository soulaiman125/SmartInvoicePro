import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext.jsx';
import MockBrowser from './MockBrowser.jsx';

// An interactive product mockup: real dashboard screenshot inside a browser
// frame that tilts toward the cursor (3D parallax), with floating glass accent
// cards that drift at different depths. GPU-only transforms.
export default function FloatingMockup({
  url = 'app.smartinvoice.pro/dashboard',
  lightSrc = '/screenshots/dashboard-light.png',
  darkSrc = '/screenshots/dashboard-dark.png',
  alt = 'SmartInvoice Pro dashboard',
  cards = [],
  eager = false,
}) {
  const { theme } = useTheme();
  const reduce = useReducedMotion();
  const ref = useRef(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 150, damping: 18 });
  const sy = useSpring(my, { stiffness: 150, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [8, -8]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [-6, 6]);
  const glareX = useTransform(sx, [-0.5, 0.5], ['0%', '100%']);

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const src = theme === 'dark' ? darkSrc : lightSrc;

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="perspective-1200">
      <motion.div
        initial={{ opacity: 0, y: 48, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', willChange: 'transform' }}
        className="relative"
      >
        {/* Glow */}
        <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-500/30 via-accent-500/20 to-transparent blur-3xl" />

        <MockBrowser url={url} className="relative">
          <div className="relative">
            <img
              src={src}
              alt={alt}
              loading={eager ? 'eager' : 'lazy'}
              className="block w-full select-none"
              draggable={false}
            />
            {/* moving sheen */}
            {!reduce && (
              <motion.div
                style={{ backgroundPositionX: glareX }}
                className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
              >
                <div className="h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </motion.div>
            )}
          </div>
        </MockBrowser>

        {/* Floating accent cards */}
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ translateZ: 60, willChange: 'transform' }}
            className={`absolute hidden sm:block ${c.pos}`}
          >
            <motion.div
              animate={reduce ? {} : { y: [0, -8, 0] }}
              transition={{ duration: 4 + i, ease: 'easeInOut', repeat: Infinity }}
              className="glass flex items-center gap-3 rounded-2xl px-4 py-3 shadow-popover"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.tone}`}>{c.icon}</span>
              <div>
                <p className="text-[11px] text-ink-500 dark:text-ink-400">{c.label}</p>
                <p className="text-sm font-bold text-ink-900 dark:text-white">{c.value}</p>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
