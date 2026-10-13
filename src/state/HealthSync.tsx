import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { readTodayActivity } from '@/services/health';

import { useCelebration } from './CelebrationProvider';
import { useGame } from './GameProvider';

const MIN_INTERVAL_MS = 2 * 60 * 1000;

/**
 * Pulls today's steps and workout minutes from the health platform whenever
 * the app becomes active (at most every two minutes) and feeds them to the
 * game, which completes the movement goal when a target is met.
 */
export function HealthSync() {
  const { state, ready, dispatch } = useGame();
  const { queue } = useCelebration();
  const enabled = ready && state.profile.healthEnabled;
  const lastRun = useRef(0);
  const running = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const run = async (force = false) => {
      if (running.current) return;
      if (!force && Date.now() - lastRun.current < MIN_INTERVAL_MS) return;
      running.current = true;
      try {
        const activity = await readTodayActivity(Date.now());
        lastRun.current = Date.now();
        if (cancelled || !activity) return;
        const events = dispatch({ type: 'recordActivity', steps: activity.steps, workoutMinutes: activity.workoutMinutes, now: Date.now() });
        if (events.some((e) => e.type === 'goalCompleted')) queue(events);
      } catch {
        // Health reads are best effort.
      } finally {
        running.current = false;
      }
    };
    run(true);
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') run();
    });
    const interval = setInterval(() => run(), 5 * 60 * 1000);
    return () => {
      cancelled = true;
      sub.remove();
      clearInterval(interval);
    };
  }, [enabled, dispatch, queue]);

  return null;
}
