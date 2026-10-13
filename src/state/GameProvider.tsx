import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { createInitialState, fromDateKey, loadState, reduce, type GameAction, type GameEvent, type GameState } from '@/game';
import { deleteAllSelfies } from '@/services/selfies';

import { backupCorrupt, clearState, readRaw, writeState } from './storage';

type Listener = (events: GameEvent[], state: GameState, action: GameAction) => void;

interface GameContextValue {
  state: GameState;
  ready: boolean;
  /** True when the stored data could not be read and defaults were used. */
  recoveredFromCorruptData: boolean;
  /** Days between the last recorded day and today at launch (0 when same day). */
  returnGapDays: number;
  /** What the launch rollover did to the streak while the app was closed, if anything. */
  launchNotice: string | null;
  /** True once a save to disk has failed since launch. */
  persistFailed: boolean;
  /** Replace the whole state (backup restore). */
  restore: (state: GameState) => void;
  dispatch: (action: GameAction) => GameEvent[];
  subscribe: (listener: Listener) => () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function describeLaunch(events: GameEvent[]): string | null {
  const used = events.filter((e) => e.type === 'freezeUsed').length;
  const lost = events.find((e) => e.type === 'streakLost');
  if (lost && lost.type === 'streakLost') return `Your ${lost.previous}-day streak ended while you were away. Today starts a new one.`;
  if (used > 0) return `A streak freeze covered ${used === 1 ? 'a missed day' : `${used} missed days`}, so your streak is still alive.`;
  return null;
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);
  const [ready, setReady] = useState(false);
  const [recovered, setRecovered] = useState(false);
  const [returnGapDays, setReturnGapDays] = useState(0);
  const [launchNotice, setLaunchNotice] = useState<string | null>(null);
  const [persistFailed, setPersistFailed] = useState(false);
  const listeners = useRef(new Set<Listener>());
  // The latest committed state, kept in a ref so dispatch can be synchronous.
  const stateRef = useRef<GameState>(state);

  // Hydrate from disk once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let next = createInitialState();
      try {
        const stored = await readRaw();
        if (stored) {
          if (stored.parseError) {
            await backupCorrupt(stored.raw);
            setRecovered(true);
          } else {
            const outcome = loadState(stored.raw);
            if (outcome.kind === 'ok') next = outcome.state;
            else if (outcome.kind === 'corrupt') {
              await backupCorrupt(stored.raw);
              setRecovered(true);
            }
          }
        }
      } catch {
        setRecovered(true);
      }
      if (cancelled) return;
      // Roll the day forward before the first render, remembering how long the player was away.
      const before = next.today.date;
      const rolled = reduce(next, { type: 'sync', now: Date.now() });
      next = rolled.state;
      if (next.createdOn && before && before !== next.today.date) {
        const gap = Math.round((fromDateKey(next.today.date).getTime() - fromDateKey(before).getTime()) / 86_400_000);
        setReturnGapDays(Math.max(0, gap));
      }
      setLaunchNotice(describeLaunch(rolled.events));
      stateRef.current = next;
      setState(next);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change after hydration; a failed save is reported once.
  useEffect(() => {
    if (!ready) return;
    writeState(state).then((ok) => {
      if (!ok) setPersistFailed(true);
    });
  }, [state, ready]);

  const dispatch = useCallback((action: GameAction): GameEvent[] => {
    const sink: GameEvent[] = [];
    // Compute synchronously so callers get the events immediately, then commit.
    const result = reduce(stateRef.current, action);
    sink.push(...result.events);
    stateRef.current = result.state;
    setState(result.state);
    if (action.type === 'reset' || action.type === 'restore') {
      // Launch-time context belongs to the previous player.
      setReturnGapDays(0);
      setLaunchNotice(null);
    }
    if (action.type === 'reset') {
      clearState();
      deleteAllSelfies();
    }
    for (const l of listeners.current) l(sink, result.state, action);
    return sink;
  }, []);

  // Re-check the local date whenever the app returns to the foreground.
  useEffect(() => {
    if (!ready) return;
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') dispatch({ type: 'sync', now: Date.now() });
    });
    const interval = setInterval(() => dispatch({ type: 'sync', now: Date.now() }), 60_000);
    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [ready, dispatch]);

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const restore = useCallback(
    (next: GameState) => {
      dispatch({ type: 'restore', state: next, now: Date.now() });
    },
    [dispatch],
  );

  const value = useMemo<GameContextValue>(
    () => ({ state, ready, recoveredFromCorruptData: recovered, returnGapDays, launchNotice, persistFailed, dispatch, subscribe, restore }),
    [state, ready, recovered, returnGapDays, launchNotice, persistFailed, dispatch, subscribe, restore],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

export function useGameState(): GameState {
  return useGame().state;
}
