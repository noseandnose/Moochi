import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import type { GameEvent } from '@/game';

export interface Celebration {
  id: number;
  events: GameEvent[];
}

interface CelebrationContextValue {
  pending: Celebration | null;
  /** Queue events for the Today screen to present (banner, pet reaction, haptic). */
  queue: (events: GameEvent[]) => void;
  /** Mark the pending celebration as shown. */
  consume: (id: number) => void;
}

const Ctx = createContext<CelebrationContextValue>({ pending: null, queue: () => undefined, consume: () => undefined });

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Celebration | null>(null);
  const counter = useRef(0);
  const queue = useCallback((events: GameEvent[]) => {
    const meaningful = events.filter((e) => e.type === 'reward' || e.type === 'stageChanged' || e.type === 'goalCompleted' || e.type === 'allGoalsCompleted' || e.type === 'streakExtended' || e.type === 'freezeEarned');
    if (!meaningful.length) return;
    counter.current += 1;
    setPending({ id: counter.current, events: meaningful });
  }, []);
  const consume = useCallback((id: number) => {
    setPending((p) => (p && p.id === id ? null : p));
  }, []);
  const value = useMemo(() => ({ pending, queue, consume }), [pending, queue, consume]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCelebration() {
  return useContext(Ctx);
}

/** Sums the XP and coins from a batch of events. */
export function summarizeRewards(events: GameEvent[]): { xp: number; coins: number; stageTo: string | null; stageFrom: string | null; streak: number; freezeEarned: boolean } {
  let xp = 0;
  let coins = 0;
  let stageTo: string | null = null;
  let stageFrom: string | null = null;
  let streak = 0;
  let freezeEarned = false;
  for (const e of events) {
    if (e.type === 'reward') {
      xp += e.xp;
      coins += e.coins;
    }
    if (e.type === 'stageChanged') {
      stageTo = e.to;
      stageFrom = e.from;
    }
    if (e.type === 'streakExtended') streak = e.streak;
    if (e.type === 'freezeEarned') freezeEarned = true;
  }
  return { xp, coins, stageTo, stageFrom, streak, freezeEarned };
}
