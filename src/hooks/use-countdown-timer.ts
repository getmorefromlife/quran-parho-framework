import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdownTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [total, setTotal] = useState(initialSeconds);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current !== null) return;
    setActive(true);
    intervalRef.current = window.setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
  }, []);

  const pause = useCallback(() => {
    setActive(false);
    clear();
  }, [clear]);

  const toggle = useCallback(() => {
    if (active) {
      pause();
    } else {
      start();
    }
  }, [active, pause, start]);

  const reset = useCallback(() => {
    pause();
    setSeconds(total);
  }, [pause, total]);

  const setDuration = useCallback(
    (secs: number) => {
      const next = Math.max(1, Math.round(secs));
      setTotal(next);
      setSeconds((s) => (active ? s : next));
    },
    [active],
  );

  useEffect(() => clear, [clear]);

  return { seconds, total, active, start, pause, toggle, reset, setDuration };
}
