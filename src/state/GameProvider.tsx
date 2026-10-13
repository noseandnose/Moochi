import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  createInitialState,
  loadState,
  reduce,
  type GameAction,
  type GameEvent,
  type GameState,
} from '@/game';

import { backupCorrupt, clearState, readRaw, writeState } from './storage';

type Listener = (events: GameEvent[], state: GameState, action: GameAction) => void;

interface GameContextValue {
  state: GameState;
  ready: boolean;
  /** True when the stored data could not be read and defaults were used. */
  recoveredFromCorruptData: boolean;
  dispatch: (action: GameAction) => GameEvent[];
  subscribe: (listener: Listener) => () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState);
  const [ready, setReady] = useState(false);
  const [recovered, setRecovered] = useState(false);
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
      // Roll the day forward before the first render.
      next = reduce(next, { type: 'sync', now: Date.now() }).state;
      stateRef.current = next;
      setState(next);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist every change after hydration.
  useEffect(() => {
    if (!ready) return;
    writeState(state);
  }, [state, ready]);

  const dispatch = useCallback((action: GameAction): GameEvent[] => {
    const sink: GameEvent[] = [];
    // Compute synchronously so callers get the events immediately, then commit.
    const result = reduce(stateRef.current, action);
    sink.push(...result.events);
    stateRef.current = result.state;
    setState(result.state);
    if (action.type === 'reset') {
      clearState();
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

  const value = useMemo<GameContextValue>(
    () => ({ state, ready, recoveredFromCorruptData: recovered, dispatch, subscribe }),
    [state, ready, recovered, dispatch, subscribe],
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
