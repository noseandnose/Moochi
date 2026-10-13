import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { GameEvent } from '@/game';

import { useGame } from './GameProvider';

export interface Celebration {
  id: number;
  events: GameEvent[];
}

interface CelebrationContextValue {
  /** The next celebration to present, oldest first. */
  pending: Celebration | null;
  /** Queue events for the Today screen to present (banner, pet reaction, haptic). */
  queue: (events: GameEvent[]) => void;
  /** Mark a celebration as shown so the next one can play. */
  consume: (id: number) => void;
}

const Ctx = createContext<CelebrationContextValue>({ pending: null, queue: () => undefined, consume: () => undefined });

let counter = 0;

/** A FIFO of celebrations: one plays at a time and none is lost while another is animating. */
export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Celebration[]>([]);
  const { subscribe } = useGame();
  const queue = useCallback((events: GameEvent[]) => {
    const meaningful = events.filter(
      (e) => e.type === 'reward' || e.type === 'stageChanged' || e.type === 'goalCompleted' || e.type === 'allGoalsCompleted' || e.type === 'streakExtended' || e.type === 'freezeEarned',
    );
    if (!meaningful.length) return;
    counter += 1;
    const item = { id: counter, events: meaningful };
    setItems((list) => [...list, item]);
  }, []);
  const consume = useCallback((id: number) => {
    setItems((list) => list.filter((c) => c.id !== id));
  }, []);
  // A reset or restore makes anything still queued meaningless.
  useEffect(
    () =>
      subscribe((_events, _state, action) => {
        if (action.type === 'reset' || action.type === 'restore') setItems([]);
      }),
    [subscribe],
  );
  const pending = items[0] ?? null;
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
