import { useEffect, useState } from "react";

export function usePoll<T>(fetcher: () => Promise<T>, intervalMs = 3000): {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      try {
        const d = await fetcher();
        if (alive) {
          setData(d);
          setError(null);
        }
      } catch (e: any) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    };
    run();
    const id = setInterval(run, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, tick]);

  return { data, error, loading, refresh: () => setTick((t) => t + 1) };
}
