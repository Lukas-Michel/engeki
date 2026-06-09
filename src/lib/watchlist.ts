import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  createElement,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Platform } from 'react-native';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';

import type { MediaSummary, MediaType } from '@/lib/tmdb';

const STORAGE_KEY = 'engeki.watchlist.v1';
const IMPORT_BATCH_SIZE = 200;

export type WatchlistItem = MediaSummary & {
  addedAt: number;
};

type WatchlistContextValue = {
  items: WatchlistItem[];
  isLoading: boolean;
  isWatchlisted: (mediaType: MediaType, id: number) => boolean;
  toggleWatchlist: (item: MediaSummary) => void;
};

type OptimisticEntry = {
  item: WatchlistItem;
  saved: boolean;
  requestId: string;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

let localLoaded = false;
let localWatchlist: WatchlistItem[] = [];
const localListeners = new Set<() => void>();

export function mediaKey(mediaType: MediaType, id: number) {
  return `${mediaType}:${id}`;
}

export function useWatchlist() {
  const value = useContext(WatchlistContext);
  if (!value) {
    throw new Error('useWatchlist must be used inside a watchlist provider');
  }
  return value;
}

export function LocalWatchlistProvider({ children }: PropsWithChildren) {
  const items = useSyncExternalStore(subscribeLocal, getLocalSnapshot, getLocalSnapshot);
  const keys = useMemo(
    () => new Set(items.map((item) => mediaKey(item.mediaType, item.id))),
    [items],
  );

  useEffect(() => {
    void loadLocalWatchlist();
  }, []);

  const isWatchlisted = useCallback(
    (mediaType: MediaType, id: number) => keys.has(mediaKey(mediaType, id)),
    [keys],
  );
  const toggleWatchlist = useCallback((item: MediaSummary) => {
    toggleLocalItem(item);
  }, []);
  const value = useMemo(
    () => ({ items, isLoading: !localLoaded, isWatchlisted, toggleWatchlist }),
    [isWatchlisted, items, toggleWatchlist],
  );

  return createElement(WatchlistContext.Provider, { value }, children);
}

export function ConvexWatchlistProvider({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading: isAuthLoading, isRefreshing } = useConvexAuth();
  const remoteItems = useQuery(api.watching.listWatchlist, isAuthenticated ? {} : 'skip');
  const setWatchlist = useMutation(api.watching.setWatchlist);
  const importWatchlist = useMutation(api.watching.importWatchlist);
  const [migrationItems, setMigrationItems] = useState<WatchlistItem[]>([]);
  const [optimistic, setOptimistic] = useState<Record<string, OptimisticEntry>>({});
  const migrationStarted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || remoteItems === undefined || migrationStarted.current) {
      return;
    }

    migrationStarted.current = true;
    void (async () => {
      const stored = await readStoredWatchlist();
      if (!stored.length) {
        return;
      }

      setMigrationItems(stored);
      try {
        for (let index = 0; index < stored.length; index += IMPORT_BATCH_SIZE) {
          const batch = stored.slice(index, index + IMPORT_BATCH_SIZE);
          await importWatchlist({
            items: batch.map((item) => ({
              media: toMediaInput(item),
              addedAt: item.addedAt,
            })),
          });
        }
        await clearStoredWatchlist();
        setMigrationItems([]);
      } catch {
        migrationStarted.current = false;
      }
    })();
  }, [importWatchlist, isAuthenticated, remoteItems]);

  const items = useMemo(() => {
    const merged = new Map<string, WatchlistItem>();
    for (const item of remoteItems ?? []) {
      merged.set(mediaKey(item.mediaType, item.id), item);
    }
    for (const item of migrationItems) {
      const key = mediaKey(item.mediaType, item.id);
      if (!merged.has(key)) {
        merged.set(key, item);
      }
    }
    for (const [key, entry] of Object.entries(optimistic)) {
      if (entry.saved) {
        merged.set(key, entry.item);
      } else {
        merged.delete(key);
      }
    }
    return [...merged.values()].sort((a, b) => b.addedAt - a.addedAt);
  }, [migrationItems, optimistic, remoteItems]);
  const keys = useMemo(
    () => new Set(items.map((item) => mediaKey(item.mediaType, item.id))),
    [items],
  );
  const isWatchlisted = useCallback(
    (mediaType: MediaType, id: number) => keys.has(mediaKey(mediaType, id)),
    [keys],
  );
  const toggleWatchlist = useCallback(
    (item: MediaSummary) => {
      if (!isAuthenticated || isAuthLoading || isRefreshing) {
        return;
      }

      const key = mediaKey(item.mediaType, item.id);
      const saved = !keys.has(key);
      const nextRequestId = `${Date.now()}:${Math.random()}`;
      const optimisticItem = { ...item, addedAt: Date.now() };

      setOptimistic((current) => ({
        ...current,
        [key]: { item: optimisticItem, saved, requestId: nextRequestId },
      }));
      void setWatchlist({ media: toMediaInput(item), saved })
        .catch(() => undefined)
        .finally(() => {
          setOptimistic((current) => {
            if (current[key]?.requestId !== nextRequestId) {
              return current;
            }
            const next = { ...current };
            delete next[key];
            return next;
          });
        });
    },
    [isAuthLoading, isAuthenticated, isRefreshing, keys, setWatchlist],
  );
  const value = useMemo(
    () => ({
      items,
      isLoading: isAuthLoading || isRefreshing || (isAuthenticated && remoteItems === undefined),
      isWatchlisted,
      toggleWatchlist,
    }),
    [
      isAuthLoading,
      isAuthenticated,
      isRefreshing,
      isWatchlisted,
      items,
      remoteItems,
      toggleWatchlist,
    ],
  );

  return createElement(WatchlistContext.Provider, { value }, children);
}

function toMediaInput(item: MediaSummary) {
  return {
    tmdbId: item.id,
    mediaType: item.mediaType,
    title: item.title,
    subtitle: item.subtitle,
    overview: item.overview,
    ...(item.posterUrl ? { posterUrl: item.posterUrl } : {}),
    ...(item.backdropUrl ? { backdropUrl: item.backdropUrl } : {}),
    voteAverage: item.voteAverage,
    ...(item.releaseDate ? { releaseDate: item.releaseDate } : {}),
    genreIds: item.genreIds,
  };
}

function subscribeLocal(listener: () => void) {
  localListeners.add(listener);
  void loadLocalWatchlist();

  return () => {
    localListeners.delete(listener);
  };
}

function getLocalSnapshot() {
  return localWatchlist;
}

async function loadLocalWatchlist() {
  if (localLoaded) {
    return;
  }
  localLoaded = true;
  localWatchlist = await readStoredWatchlist();
  notifyLocal();
}

function toggleLocalItem(item: MediaSummary) {
  const key = mediaKey(item.mediaType, item.id);
  const exists = localWatchlist.some(
    (entry) => mediaKey(entry.mediaType, entry.id) === key,
  );

  localWatchlist = exists
    ? localWatchlist.filter((entry) => mediaKey(entry.mediaType, entry.id) !== key)
    : [{ ...item, addedAt: Date.now() }, ...localWatchlist];

  notifyLocal();
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localWatchlist)).catch(() => undefined);
}

async function readStoredWatchlist() {
  try {
    const raw = await readStoredValue();
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isWatchlistItem) : [];
  } catch {
    return [];
  }
}

async function clearStoredWatchlist() {
  await AsyncStorage.removeItem(STORAGE_KEY);
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
  }
  localWatchlist = [];
  localLoaded = true;
  notifyLocal();
}

async function readStoredValue() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored !== null || Platform.OS === 'web') {
    return stored;
  }

  const legacyValue = await SecureStore.getItemAsync(STORAGE_KEY);
  if (legacyValue !== null) {
    await AsyncStorage.setItem(STORAGE_KEY, legacyValue);
    void SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => undefined);
  }
  return legacyValue;
}

function notifyLocal() {
  localListeners.forEach((listener) => listener());
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
