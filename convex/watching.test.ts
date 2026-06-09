/// <reference types="vite/client" />

import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';

import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

const movie = {
  tmdbId: 101,
  mediaType: 'movie' as const,
  title: 'Test Film',
  subtitle: 'Movie',
  overview: 'A test film.',
  posterUrl: 'https://example.com/movie.jpg',
  voteAverage: 8.1,
  releaseDate: '2026-01-15',
  genreIds: [18],
};

const show = {
  tmdbId: 202,
  mediaType: 'tv' as const,
  title: 'Test Show',
  subtitle: 'TV Show',
  overview: 'A test show.',
  backdropUrl: 'https://example.com/show.jpg',
  voteAverage: 7.6,
  releaseDate: '2025-09-10',
  genreIds: [18, 9648],
};

const seasons = [{ seasonNumber: 1, episodeCount: 3 }];

function authenticatedTest() {
  const t = convexTest(schema, modules);
  return {
    sarah: t.withIdentity({
      name: 'Sarah',
      subject: 'sarah',
      issuer: 'https://clerk.test',
      tokenIdentifier: 'https://clerk.test|sarah',
    }),
    lee: t.withIdentity({
      name: 'Lee',
      subject: 'lee',
      issuer: 'https://clerk.test',
      tokenIdentifier: 'https://clerk.test|lee',
    }),
  };
}

describe('watching', () => {
  test('keeps watchlists private and removes completed movies from the watchlist', async () => {
    const { sarah, lee } = authenticatedTest();

    await sarah.mutation(api.watching.setWatchlist, { media: movie, saved: true });
    await sarah.mutation(api.watching.setReaction, {
      media: movie,
      seasons: [],
      reaction: 'love',
      markFinished: true,
    });

    expect(await sarah.query(api.watching.listWatchlist)).toEqual([]);
    expect(await lee.query(api.watching.listWatchlist)).toEqual([]);
    expect(await sarah.query(api.watching.getForMedia, {
      mediaType: 'movie',
      tmdbId: movie.tmdbId,
    })).toMatchObject({ status: 'finished' });
    expect(await sarah.query(api.watching.getReaction, {
      mediaType: 'movie',
      tmdbId: movie.tmdbId,
    })).toBe('love');
    expect(await lee.query(api.watching.getReaction, {
      mediaType: 'movie',
      tmdbId: movie.tmdbId,
    })).toBeNull();

    await sarah.mutation(api.watching.setWatchlist, { media: movie, saved: true });
    expect(await sarah.query(api.watching.listWatchlist)).toEqual([]);
    expect(await sarah.query(api.watching.getForMedia, {
      mediaType: 'movie',
      tmdbId: movie.tmdbId,
    })).toMatchObject({ status: 'finished' });

    await sarah.mutation(api.watching.markUnwatched, { media: movie });
    expect(await sarah.query(api.watching.listWatchlist)).toEqual([]);
    expect(await sarah.query(api.watching.getForMedia, {
      mediaType: 'movie',
      tmdbId: movie.tmdbId,
    })).toBeNull();
    expect(await sarah.query(api.watching.getReaction, {
      mediaType: 'movie',
      tmdbId: movie.tmdbId,
    })).toBeNull();
  });

  test('persists show progress and supports rating, abandoning, and resetting', async () => {
    const { sarah } = authenticatedTest();

    await sarah.mutation(api.watching.setWatchlist, { media: show, saved: true });
    await sarah.mutation(api.watching.setEpisodeWatched, {
      media: show,
      seasons,
      seasonNumber: 1,
      episodeNumber: 2,
      watched: true,
      markPrevious: true,
    });

    expect(await sarah.query(api.watching.getForMedia, {
      mediaType: 'tv',
      tmdbId: show.tmdbId,
    })).toMatchObject({
      status: 'watching',
      watchedEpisodes: 2,
      totalEpisodes: 3,
      seasonNumber: 1,
      episodeNumber: 2,
    });

    await expect(
      sarah.mutation(api.watching.setReaction, {
        media: show,
        seasons,
        reaction: 'like',
        markFinished: false,
      }),
    ).rejects.toThrow('Finish all episodes before rating this show');

    await sarah.mutation(api.watching.abandonShow, { media: show, seasons });
    expect(await sarah.query(api.watching.getForMedia, {
      mediaType: 'tv',
      tmdbId: show.tmdbId,
    })).toMatchObject({ status: 'abandoned', watchedEpisodes: 2 });
    expect(await sarah.query(api.watching.listWatchlist)).toEqual([]);

    await sarah.mutation(api.watching.setReaction, {
      media: show,
      seasons,
      reaction: 'love',
      markFinished: true,
    });
    expect(await sarah.query(api.watching.listWatchlist)).toEqual([]);
    expect(await sarah.query(api.watching.getForMedia, {
      mediaType: 'tv',
      tmdbId: show.tmdbId,
    })).toMatchObject({
      status: 'finished',
      watchedEpisodes: 3,
      totalEpisodes: 3,
      allEpisodesWatched: true,
    });
    expect(await sarah.query(api.watching.getReaction, {
      mediaType: 'tv',
      tmdbId: show.tmdbId,
    })).toBe('love');

    await sarah.mutation(api.watching.markUnwatched, { media: show });
    expect(await sarah.query(api.watching.getForMedia, {
      mediaType: 'tv',
      tmdbId: show.tmdbId,
    })).toBeNull();
    expect(await sarah.query(api.watching.getReaction, {
      mediaType: 'tv',
      tmdbId: show.tmdbId,
    })).toBeNull();
  });

  test('rejects show-only statuses for movies', async () => {
    const { sarah } = authenticatedTest();

    await expect(
      sarah.mutation(api.watching.setStatus, {
        media: movie,
        seasons: [],
        status: 'watching',
      }),
    ).rejects.toThrow('Movies can only be marked watched or unwatched');
  });
});
