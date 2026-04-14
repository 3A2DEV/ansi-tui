import { useMemo, useSyncExternalStore } from 'react';

interface AnimationStore {
  index: number;
  readonly frameCount: number;
  readonly intervalMs: number;
  timer: ReturnType<typeof setInterval> | null;
  readonly listeners: Set<() => void>;
}

const MIN_ANIMATION_INTERVAL_MS = 120;
const STORES = new Map<string, AnimationStore>();

const buildStoreKey = (frameCount: number, intervalMs: number): string => `${frameCount}:${intervalMs}`;

const getStore = (frameCount: number, intervalMs: number): AnimationStore => {
  const safeFrameCount = Math.max(frameCount, 1);
  const safeIntervalMs = Math.max(intervalMs, MIN_ANIMATION_INTERVAL_MS);
  const key = buildStoreKey(safeFrameCount, safeIntervalMs);
  const existing = STORES.get(key);

  if (existing) {
    return existing;
  }

  const store: AnimationStore = {
    index: 0,
    frameCount: safeFrameCount,
    intervalMs: safeIntervalMs,
    timer: null,
    listeners: new Set(),
  };

  STORES.set(key, store);
  return store;
};

const startStore = (store: AnimationStore): void => {
  if (store.timer !== null || store.listeners.size === 0) {
    return;
  }

  store.timer = setInterval(() => {
    store.index = (store.index + 1) % store.frameCount;
    for (const listener of store.listeners) {
      listener();
    }
  }, store.intervalMs);
};

const stopStore = (store: AnimationStore): void => {
  if (store.listeners.size > 0 || store.timer === null) {
    return;
  }

  clearInterval(store.timer);
  store.timer = null;
  store.index = 0;
};

export const useAnimation = (frames: string[], intervalMs: number): string => {
  const store = useMemo(() => getStore(frames.length, intervalMs), [frames.length, intervalMs]);
  const index = useSyncExternalStore(
    (listener) => {
      store.listeners.add(listener);
      startStore(store);

      return () => {
        store.listeners.delete(listener);
        stopStore(store);
      };
    },
    () => store.index,
    () => 0,
  );

  return frames[index] ?? frames[0] ?? '';
};
