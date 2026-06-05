import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { MediaSummary, MediaType } from '@/lib/tmdb';

const STORAGE_KEY = 'engeki.watchlist.v1';

export type WatchlistItem = MediaSummary & {
  addedAt: number;
};

let loaded = false;
let watchlist: WatchlistItem[] = [];
const listeners = new Set<() => void>();

export function mediaKey(mediaType: MediaType, id: number) {
  return `${mediaType}:${id}`;
}

export function useWatchlist() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const keys = useMemo(() => new Set(items.map((item) => mediaKey(item.mediaType, item.id))), [items]);

  useEffect(() => {
    void loadWatchlist();
  }, []);

  const isWatchlisted = useCallback(
    (mediaType: MediaType, id: number) => keys.has(mediaKey(mediaType, id)),
    [keys],
  );

  const toggleWatchlist = useCallback((item: MediaSummary) => {
    toggleItem(item);
  }, []);

  return {
    items,
    isWatchlisted,
    toggleWatchlist,
  };
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  void loadWatchlist();

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return watchlist;
}

async function loadWatchlist() {
  if (loaded) {
    return;
  }

  loaded = true;

  try {
    const raw = await readStoredValue();
    const parsed = raw ? JSON.parse(raw) : [];

    if (Array.isArray(parsed)) {
      watchlist = parsed.filter(isWatchlistItem);
      notify();
    }
  } catch {
    watchlist = [];
    notify();
  }
}

function toggleItem(item: MediaSummary) {
  const key = mediaKey(item.mediaType, item.id);
  const exists = watchlist.some((entry) => mediaKey(entry.mediaType, entry.id) === key);

  watchlist = exists
    ? watchlist.filter((entry) => mediaKey(entry.mediaType, entry.id) !== key)
    : [{ ...item, addedAt: Date.now() }, ...watchlist];

  notify();
  void saveWatchlist();
}

async function saveWatchlist() {
  const value = JSON.stringify(watchlist);

  if (Platform.OS === 'web') {
    window.localStorage.setItem(STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(STORAGE_KEY, value);
}

async function readStoredValue() {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(STORAGE_KEY);
  }

  return SecureStore.getItemAsync(STORAGE_KEY);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function isWatchlistItem(value: unknown): value is WatchlistItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const item = value as Partial<WatchlistItem>;
  return (
    typeof item.id === 'number' &&
    (item.mediaType === 'movie' || item.mediaType === 'tv') &&
    typeof item.title === 'string' &&
    typeof item.subtitle === 'string' &&
    typeof item.overview === 'string' &&
    typeof item.voteAverage === 'number' &&
    Array.isArray(item.genreIds) &&
    typeof item.addedAt === 'number'
  );
}
