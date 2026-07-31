import { useCallback, useEffect, useRef, useState } from "react";
import { getActivityJobStatus } from "../api";
import {
  activityJobDlqFailureCount,
  isActivityJobWorkDrained,
} from "../lib/activityJobStatus";

const DEFAULT_POLL_MS = 1_500;

export const useActivityJobStatusWatch = (pollMs = DEFAULT_POLL_MS) => {
  const [failedCount, setFailedCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const watchingRef = useRef(false);
  const pollMsRef = useRef(pollMs);
  const runPollRef = useRef<() => Promise<void>>(async () => undefined);

  useEffect(() => {
    pollMsRef.current = pollMs;
  }, [pollMs]);

  const clearTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopWatching = useCallback(() => {
    watchingRef.current = false;
    clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    runPollRef.current = async () => {
      if (!watchingRef.current) return;
      try {
        const status = await getActivityJobStatus();
        if (!watchingRef.current) return;
        setFailedCount(activityJobDlqFailureCount(status));
        if (isActivityJobWorkDrained(status)) {
          stopWatching();
          return;
        }
      } catch {
        /* keep polling until work drains or unmount */
      }
      if (!watchingRef.current) return;
      clearTimer();
      timerRef.current = setTimeout(() => {
        void runPollRef.current();
      }, pollMsRef.current);
    };
  }, [clearTimer, stopWatching]);

  const watchAfterEnqueue = useCallback(() => {
    stopWatching();
    watchingRef.current = true;
    void runPollRef.current();
  }, [stopWatching]);

  useEffect(() => () => stopWatching(), [stopWatching]);

  return { failedCount, watchAfterEnqueue };
};
