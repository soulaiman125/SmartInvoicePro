import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';
import { EASE } from '../../lib/animations.js';

/**
 * Counts from 0 → value when scrolled into view. `format` maps the live numeric
 * value to a display string (e.g. currency or a localized integer).
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1.1,
  format = (n) => Math.round(n).toLocaleString(),
  className = '',
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => format(reduce ? value : 0));

  useEffect(() => {
    if (reduce) {
      setDisplay(format(value));
      return;
    }
    if (!inView) return undefined;
    const controls = animate(0, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(format(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
