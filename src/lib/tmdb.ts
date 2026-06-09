import { isTmdbConfigured, tmdbAccessToken, tmdbApiKey, tmdbImage } from '@/lib/config';

const API_BASE = 'https://api.themoviedb.org/3';

export type MediaType = 'movie' | 'tv';
export type MediaReaction = 'like' | 'love' | 'dislike';

export type MediaSummary = {
  id: number;
  mediaType: MediaType;
  title: string;
  subtitle: string;
  overview: string;
  posterUrl?: string;
  backdropUrl?: string;
  voteAverage: number;
  releaseDate?: string;
  genreIds: number[];
};

export type MediaDetails = MediaSummary & {
  runtime?: number;
  episodeRuntime?: number;
  status?: string;
  tagline?: string;
  genres: string[];
  cast: CastMember[];
  seasons?: SeasonSummary[];
  videos: VideoSummary[];
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  imageUrl?: string;
};

export type SeasonSummary = {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  airDate?: string;
  posterUrl?: string;
};

export type EpisodeSummary = {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
  airDate?: string;
  runtime?: number;
  stillUrl?: string;
};

export type VideoSummary = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
};

type TmdbMedia = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  tagline?: string;
  credits?: {
    cast?: {
      id: number;
      name: string;
      character?: string;
      roles?: { character?: string }[];
      profile_path?: string | null;
    }[];
  };
  aggregate_credits?: {
    cast?: {
      id: number;
      name: string;
      roles?: { character?: string }[];
      profile_path?: string | null;
    }[];
  };
  seasons?: {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    air_date?: string;
    poster_path?: string | null;
  }[];
  videos?: {
    results?: {
      id: string;
      key: string;
      name: string;
      site: string;
      type: string;
    }[];
  };
};

type TmdbListResponse = {
  results?: TmdbMedia[];
};

type TmdbSeasonResponse = {
  episodes?: {
    id: number;
    season_number: number;
    episode_number: number;
    name?: string;
    overview?: string;
    air_date?: string;
    runtime?: number;
    still_path?: string | null;
  }[];
};

export class MissingTmdbCredentialsError extends Error {
  constructor() {
    super('Add EXPO_PUBLIC_TMDB_ACCESS_TOKEN or EXPO_PUBLIC_TMDB_API_KEY to .env.local.');
  }
}

export async function getTrending(): Promise<MediaSummary[]> {
  if (!isTmdbConfigured) {
    return fallbackTrending;
  }

  const data = await request<TmdbListResponse>('/trending/all/week');
  return normalizeList(data.results ?? []);
}

export async function getRecentlyReleased(): Promise<MediaSummary[]> {
  if (!isTmdbConfigured) {
    return fallbackRecent;
  }

  const [movies, shows] = await Promise.all([
    request<TmdbListResponse>('/movie/now_playing'),
    request<TmdbListResponse>('/tv/on_the_air'),
  ]);

  return normalizeList([...(movies.results ?? []), ...(shows.results ?? [])]).sort((a, b) =>
    (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''),
  );
}

export async function getUpcomingMovies(): Promise<MediaSummary[]> {
  const minimumReleaseDate = formatTmdbDate(addDays(new Date(), 1));
  const maximumReleaseDate = formatTmdbDate(addDays(new Date(), 180));

  if (!isTmdbConfigured) {
    return fallbackUpcomingMovies.filter(
      (item) =>
        item.releaseDate &&
        item.releaseDate >= minimumReleaseDate &&
        item.releaseDate <= maximumReleaseDate,
    );
  }

  const data = await request<TmdbListResponse>('/discover/movie', {
    include_adult: 'false',
    include_video: 'false',
    'primary_release_date.gte': minimumReleaseDate,
    'primary_release_date.lte': maximumReleaseDate,
    sort_by: 'popularity.desc',
  });

  return normalizeList(data.results ?? [])
    .filter(
      (item) =>
        item.mediaType === 'movie' &&
        item.releaseDate !== undefined &&
        item.releaseDate >= minimumReleaseDate &&
        item.releaseDate <= maximumReleaseDate,
    );
}

export async function getPopular(mediaType: MediaType): Promise<MediaSummary[]> {
  if (!isTmdbConfigured) {
    return fallbackDiscoverItems.filter((item) => item.mediaType === mediaType);
  }

  const data = await request<TmdbListResponse>(`/${mediaType}/popular`);
  return normalizeList(data.results ?? []).filter((item) => item.mediaType === mediaType);
}

export async function getTopRated(mediaType: MediaType): Promise<MediaSummary[]> {
  if (!isTmdbConfigured) {
    return fallbackDiscoverItems
      .filter((item) => item.mediaType === mediaType)
      .sort((a, b) => b.voteAverage - a.voteAverage);
  }

  const data = await request<TmdbListResponse>(`/${mediaType}/top_rated`);
  return normalizeList(data.results ?? []).filter((item) => item.mediaType === mediaType);
}

export async function getUpcomingTvSeasons(
  watchlistedShows: MediaSummary[],
): Promise<MediaSummary[]> {
  const minimumReleaseDate = formatTmdbDate(addDays(new Date(), 1));
  const maximumReleaseDate = formatTmdbDate(addDays(new Date(), 180));
  const shows = watchlistedShows.filter((item) => item.mediaType === 'tv');

  if (!isTmdbConfigured) {
    const watchlistedIds = new Set(shows.map((item) => item.id));
    return fallbackUpcomingTv.filter(
      (item) =>
        watchlistedIds.has(item.id) &&
        item.releaseDate !== undefined &&
        item.releaseDate >= minimumReleaseDate &&
        item.releaseDate <= maximumReleaseDate,
    );
  }

  const releases = await Promise.all(
    shows.map(async (show): Promise<MediaSummary | undefined> => {
      const details = await request<TmdbMedia>(`/tv/${show.id}`);
      const upcomingSeason = details.seasons
        ?.filter(
          (season) =>
            season.season_number > 0 &&
            season.air_date !== undefined &&
            season.air_date >= minimumReleaseDate &&
            season.air_date <= maximumReleaseDate,
        )
        .sort((a, b) => (a.air_date ?? '').localeCompare(b.air_date ?? ''))[0];
      const firstAirDate = details.first_air_date;

      if (
        !upcomingSeason &&
        firstAirDate !== undefined &&
        firstAirDate >= minimumReleaseDate &&
        firstAirDate <= maximumReleaseDate
      ) {
        return {
          ...show,
          subtitle: 'New Show',
          releaseDate: firstAirDate,
        } satisfies MediaSummary;
      }

      if (!upcomingSeason?.air_date) {
        return undefined;
      }

      return {
        ...show,
        subtitle: upcomingSeason.season_number === 1 ? 'New Show' : 'New Season',
        releaseDate: upcomingSeason.air_date,
      } satisfies MediaSummary;
    }),
  );

  return releases
    .filter((item): item is MediaSummary => item !== undefined)
    .sort((a, b) => (a.releaseDate ?? '').localeCompare(b.releaseDate ?? ''));
}

export async function searchMulti(query: string): Promise<MediaSummary[]> {
  if (!query.trim()) {
    return getTrending();
  }

  if (!isTmdbConfigured) {
    return fallbackTrending.filter((item) =>
      item.title.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }

  const data = await request<TmdbListResponse>('/search/multi', { query, include_adult: 'false' });
  return normalizeList(data.results ?? []);
}

export async function getMediaDetails(mediaType: MediaType, id: number): Promise<MediaDetails> {
  if (!isTmdbConfigured) {
    const fallback = [...fallbackTrending, ...fallbackRecent].find(
      (item) => item.id === id && item.mediaType === mediaType,
    );
    return normalizeDetails({
      ...(fallback ?? fallbackTrending[0]),
      media_type: mediaType,
      genres: [{ id: 1, name: mediaType === 'tv' ? 'Drama' : 'Adventure' }],
      runtime: mediaType === 'movie' ? 122 : undefined,
      episode_run_time: mediaType === 'tv' ? [52] : undefined,
      status: 'Returning Series',
      tagline: 'Your next watch, tracked cleanly.',
      credits: { cast: fallbackCast },
      seasons: mediaType === 'tv' ? fallbackSeasons : undefined,
      videos: { results: fallbackVideos },
    } as TmdbMedia, mediaType);
  }

  const appendToResponse = mediaType === 'movie' ? 'credits,videos' : 'aggregate_credits,videos';
  const data = await request<TmdbMedia>(`/${mediaType}/${id}`, { append_to_response: appendToResponse });
  return normalizeDetails(data, mediaType);
}

export async function getSeasonEpisodes(
  seriesId: number,
  seasonNumber: number,
): Promise<EpisodeSummary[]> {
  if (!isTmdbConfigured) {
    const episodeCount =
      fallbackSeasons.find((season) => season.season_number === seasonNumber)?.episode_count ?? 8;

    return Array.from({ length: episodeCount }, (_, index) => ({
      id: seriesId * 10000 + seasonNumber * 100 + index + 1,
      seasonNumber,
      episodeNumber: index + 1,
      name: `Episode ${index + 1}`,
      overview: 'Episode details will appear when TMDB is connected.',
      runtime: 52,
    }));
  }

  const data = await request<TmdbSeasonResponse>(`/tv/${seriesId}/season/${seasonNumber}`);
  return (data.episodes ?? []).map((episode) => ({
    id: episode.id,
    seasonNumber: episode.season_number,
    episodeNumber: episode.episode_number,
    name: episode.name ?? `Episode ${episode.episode_number}`,
    overview: episode.overview ?? '',
    airDate: episode.air_date,
    runtime: episode.runtime,
    stillUrl: tmdbImage(episode.still_path, 'w500'),
  }));
}

async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!isTmdbConfigured) {
    throw new MissingTmdbCredentialsError();
  }

  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set('language', 'en-US');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  if (tmdbAccessToken) {
    headers.Authorization = `Bearer ${tmdbAccessToken}`;
  } else if (tmdbApiKey) {
    url.searchParams.set('api_key', tmdbApiKey);
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeList(items: TmdbMedia[]): MediaSummary[] {
  return items
    .map((item) => normalizeSummary(item))
    .filter((item): item is MediaSummary => Boolean(item));
}

function normalizeSummary(item: TmdbMedia): MediaSummary | undefined {
  const mediaType = normalizeMediaType(item.media_type, item);

  if (!mediaType) {
    return undefined;
  }

  return {
    id: item.id,
    mediaType,
    title: item.title ?? item.name ?? 'Untitled',
    subtitle: mediaType === 'movie' ? 'Movie' : 'TV Show',
    overview: item.overview ?? '',
    posterUrl: tmdbImage(item.poster_path, 'w500'),
    backdropUrl: tmdbImage(item.backdrop_path, 'w780'),
    voteAverage: item.vote_average ?? 0,
    releaseDate: item.release_date ?? item.first_air_date,
    genreIds: item.genre_ids ?? [],
  };
}

function normalizeDetails(item: TmdbMedia, mediaType: MediaType): MediaDetails {
  const summary = normalizeSummary({ ...item, media_type: mediaType }) ?? fallbackTrending[0];
  const castSource = item.aggregate_credits?.cast ?? item.credits?.cast ?? [];

  return {
    ...summary,
    posterUrl: tmdbImage(item.poster_path, 'w780') ?? summary.posterUrl,
    backdropUrl: tmdbImage(item.backdrop_path, 'original') ?? summary.backdropUrl,
    runtime: item.runtime,
    episodeRuntime: item.episode_run_time?.[0],
    status: item.status,
    tagline: item.tagline,
    genres: item.genres?.map((genre) => genre.name) ?? [],
    cast: castSource.slice(0, 14).map((member) => {
      const character = (member as { character?: string }).character ?? member.roles?.[0]?.character ?? 'Cast';

      return {
        id: member.id,
        name: member.name,
        character,
        imageUrl: tmdbImage(member.profile_path, 'w342'),
      };
    }),
    seasons: item.seasons
      ?.filter((season) => season.season_number > 0)
      .map((season) => ({
        id: season.id,
        name: season.name,
        seasonNumber: season.season_number,
        episodeCount: season.episode_count,
        airDate: season.air_date,
        posterUrl: tmdbImage(season.poster_path, 'w342'),
      })),
    videos: item.videos?.results?.filter((video) => video.site === 'YouTube').slice(0, 4) ?? [],
  };
}

function normalizeMediaType(mediaType: string | undefined, item: TmdbMedia): MediaType | undefined {
  if (mediaType === 'movie' || item.title) {
    return 'movie';
  }

  if (mediaType === 'tv' || item.name) {
    return 'tv';
  }

  return undefined;
}

export function formatDate(value?: string) {
  if (!value) {
    return 'TBA';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatRuntime(minutes?: number) {
  if (!minutes) {
    return 'Runtime TBA';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}m`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatTmdbDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const fallbackTrending: MediaSummary[] = [
  {
    id: 101,
    mediaType: 'movie',
    title: 'The Last Horizon',
    subtitle: 'Movie',
    overview: 'A rescue crew follows a signal beyond mapped space and finds a colony rewriting its own history.',
    voteAverage: 8.1,
    releaseDate: '2026-05-22',
    genreIds: [878, 12],
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&q=80',
  },
  {
    id: 102,
    mediaType: 'tv',
    title: 'North Pier',
    subtitle: 'TV Show',
    overview: 'A quiet coastal town becomes the center of a missing-person investigation that spans three decades.',
    voteAverage: 7.7,
    releaseDate: '2026-04-18',
    genreIds: [18, 80],
    backdropUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=700&q=80',
  },
  {
    id: 103,
    mediaType: 'movie',
    title: 'Second Unit',
    subtitle: 'Movie',
    overview: 'A stunt coordinator gets one shot to save a doomed film and the friendships it nearly ruined.',
    voteAverage: 7.4,
    releaseDate: '2026-06-01',
    genreIds: [35, 28],
    backdropUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=700&q=80',
  },
];

export const fallbackRecent: MediaSummary[] = [
  {
    id: 104,
    mediaType: 'tv',
    title: 'Signal Room',
    subtitle: 'TV Show',
    overview: 'Two archivists discover a pirate broadcast predicting impossible crimes before they happen.',
    voteAverage: 8.4,
    releaseDate: '2026-06-05',
    genreIds: [9648, 18],
    backdropUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=700&q=80',
  },
  {
    id: 105,
    mediaType: 'movie',
    title: 'June Atlas',
    subtitle: 'Movie',
    overview: 'A cartographer builds a forbidden map from strangers memories.',
    voteAverage: 7.9,
    releaseDate: '2026-06-03',
    genreIds: [14, 18],
    backdropUrl: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=700&q=80',
  },
];

export const fallbackUpcomingMovies: MediaSummary[] = [
  {
    id: 201,
    mediaType: 'movie',
    title: 'Low Orbit',
    subtitle: 'Movie',
    overview: 'A quiet orbital thriller about a pilot returning with a signal nobody expected.',
    voteAverage: 7.6,
    releaseDate: '2026-06-14',
    genreIds: [878, 53],
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=700&q=80',
  },
  {
    id: 202,
    mediaType: 'movie',
    title: 'The Night Ferry',
    subtitle: 'Movie',
    overview: 'A ferry captain makes one impossible crossing after midnight.',
    voteAverage: 7.2,
    releaseDate: '2026-06-21',
    genreIds: [9648, 18],
    backdropUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&q=80',
  },
  {
    id: 203,
    mediaType: 'movie',
    title: 'Bright Wake',
    subtitle: 'Movie',
    overview: 'A summer drama about memory, distance, and a city waking before sunrise.',
    voteAverage: 7.9,
    releaseDate: '2026-06-28',
    genreIds: [18],
    backdropUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?w=700&q=80',
  },
  {
    id: 204,
    mediaType: 'movie',
    title: 'Cut to Black',
    subtitle: 'Movie',
    overview: 'A production assistant finds a missing frame that changes a director’s last film.',
    voteAverage: 7.1,
    releaseDate: '2026-07-04',
    genreIds: [53],
    backdropUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=700&q=80',
  },
];

export const fallbackUpcomingTv: MediaSummary[] = [
  {
    id: 301,
    mediaType: 'tv',
    title: 'North Pier',
    subtitle: 'New Season',
    overview: 'Season 2 returns to the coast with the town watching every tide.',
    voteAverage: 8.0,
    releaseDate: '2026-06-12',
    genreIds: [18, 80],
    backdropUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=700&q=80',
  },
  {
    id: 302,
    mediaType: 'tv',
    title: 'Signal Room',
    subtitle: 'New Season',
    overview: 'The archive opens a second frequency.',
    voteAverage: 8.4,
    releaseDate: '2026-06-19',
    genreIds: [9648, 18],
    backdropUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=700&q=80',
  },
  {
    id: 303,
    mediaType: 'tv',
    title: 'Gold Mile',
    subtitle: 'New Show',
    overview: 'A new limited series about a family empire collapsing under one contract.',
    voteAverage: 7.8,
    releaseDate: '2026-06-25',
    genreIds: [18],
    backdropUrl: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1527030280862-64139fba04ca?w=700&q=80',
  },
  {
    id: 304,
    mediaType: 'tv',
    title: 'The Exchange',
    subtitle: 'New Season',
    overview: 'Season 3 moves the negotiation to a city under blackout.',
    voteAverage: 7.5,
    releaseDate: '2026-07-02',
    genreIds: [18, 53],
    backdropUrl: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=1200&q=80',
    posterUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=700&q=80',
  },
];

const fallbackDiscoverItems = [
  ...fallbackTrending,
  ...fallbackRecent,
  ...fallbackUpcomingMovies,
  ...fallbackUpcomingTv,
];

const fallbackCast = [
  { id: 1, name: 'Mara Wren', character: 'Ari Vale', profile_path: null },
  { id: 2, name: 'Jon Igar', character: 'Miles Rune', profile_path: null },
  { id: 3, name: 'Celeste Park', character: 'Nina Sato', profile_path: null },
];

const fallbackSeasons = [
  { id: 1, name: 'Season 1', season_number: 1, episode_count: 8, air_date: '2026-04-18' },
  { id: 2, name: 'Season 2', season_number: 2, episode_count: 6, air_date: '2027-02-12' },
];

const fallbackVideos = [
  { id: 'fallback-trailer', key: 'dQw4w9WgXcQ', name: 'Trailer', site: 'YouTube', type: 'Trailer' },
];
