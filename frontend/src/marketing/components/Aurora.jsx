import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

// Premium ambient background: a gradient mesh of large blurred "aurora" blobs
// that drift slowly and parallax on scroll, finished with a fine noise grain.
// Pure transform/opacity animation → GPU-accelerated, 60fps friendly.
export default function Aurora({ className = '' }) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const drift = (dx, dy) =>
    reduce
      ? {}
      : { x: [0, dx, 0], y: [0, dy, 0], transition: { duration: 18, ease: 'easeInOut', repeat: Infinity } };

  return (
    <div className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden="true">
      {/* Blob 1 — brand */}
      <motion.div
        style={{ y: y1, willChange: 'transform' }}
        animate={drift(40, 30)}
        className="absolute -left-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-brand-500/30 blur-[120px] dark:bg-brand-500/25"
      />
      {/* Blob 2 — accent */}
      <motion.div
        style={{ y: y2, willChange: 'transform' }}
        animate={drift(-50, 40)}
        className="absolute -right-24 top-10 h-[30rem] w-[30rem] rounded-full bg-accent-500/25 blur-[120px] dark:bg-accent-500/20"
      />
      {/* Blob 3 — soft cyan/teal for depth */}
      <motion.div
        style={{ y: y1, willChange: 'transform' }}
        animate={drift(30, -30)}
        className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-sky-400/20 blur-[120px] dark:bg-sky-500/10"
      />
      {/* Grain */}
      <div className="absolute inset-0 bg-noise opacity-[0.035] dark:opacity-[0.05]" />
    </div>
  );
}
