import { useEffect, useRef, useState } from 'react';

import { useReduceMotion } from './useMotion';

/** Animates a displayed integer toward `target` (e.g. coin and XP counters). */
export function useAnimatedNumber(target: number, duration = 600): number {
  const reduce = useReduceMotion();
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  useEffect(() => {
    if (reduce) return;
    const begin = shownRef.current;
    if (begin === target) return;
    const start = Date.now();
    let raf: ReturnType<typeof requestAnimationFrame>;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(begin + (target - begin) * eased);
      shownRef.current = value;
      setShown(value);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduce]);
  if (reduce) return target;
  return shown;
}
