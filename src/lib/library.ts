import type { MediaReaction, MediaSummary } from '@/lib/tmdb';

export type WatchProgress = {
  id: string;
  title: string;
  season: number;
  episode: number;
  totalEpisodes: number;
  nextRelease: string;
  imageUrl: string;
  posterUrl: string;
};

export type HistoryEntry = {
  id: string;
  title: string;
  detail: string;
  watchedAt: string;
  reaction: MediaReaction;
  imageUrl: string;
};

export type SocialEntry = {
  id: string;
  friend: string;
  action: string;
  title: string;
  time: string;
  reaction: MediaReaction;
  avatar: string;
};

export const watchProgress: WatchProgress[] = [];

export const historyEntries: HistoryEntry[] = [
  {
    id: 'history-1',
    title: 'Second Unit',
    detail: 'Movie watched yesterday',
    watchedAt: 'Yesterday',
    reaction: 'love',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=700&q=80',
  },
  {
    id: 'history-2',
    title: 'North Pier',
    detail: 'S2 E3 watched Monday',
    watchedAt: 'Monday',
    reaction: 'like',
    imageUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=700&q=80',
  },
  {
    id: 'history-3',
    title: 'June Atlas',
    detail: 'Movie watched last week',
    watchedAt: 'Last week',
    reaction: 'dislike',
    imageUrl: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=700&q=80',
  },
];

export const socialEntries: SocialEntry[] = [
  {
    id: 'social-1',
    friend: 'Mina',
    action: 'loved',
    title: 'Signal Room',
    time: '12 min ago',
    reaction: 'love',
    avatar: 'M',
  },
  {
    id: 'social-2',
    friend: 'Jonas',
    action: 'finished',
    title: 'North Pier S2',
    time: '48 min ago',
    reaction: 'like',
    avatar: 'J',
  },
  {
    id: 'social-3',
    friend: 'Ava',
    action: 'disliked',
    title: 'June Atlas',
    time: '2 hr ago',
    reaction: 'dislike',
    avatar: 'A',
  },
];

export function mediaToHistoryItem(media: MediaSummary): HistoryEntry {
  return {
    id: `${media.mediaType}-${media.id}`,
    title: media.title,
    detail: `${media.subtitle} added to history`,
    watchedAt: 'Now',
    reaction: 'like',
    imageUrl: media.posterUrl ?? media.backdropUrl ?? '',
  };
}
