import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';

const mediaTypeValidator = v.union(v.literal('movie'), v.literal('tv'));
const editableStatusValidator = v.union(
  v.literal('watching'),
  v.literal('finished'),
  v.literal('abandoned'),
  v.null(),
);
const mediaValidator = v.object({
  tmdbId: v.number(),
  mediaType: mediaTypeValidator,
  title: v.string(),
  subtitle: v.optional(v.string()),
  overview: v.optional(v.string()),
  posterUrl: v.optional(v.string()),
  backdropUrl: v.optional(v.string()),
  voteAverage: v.optional(v.number()),
  releaseDate: v.optional(v.string()),
  genreIds: v.optional(v.array(v.number())),
});
const seasonValidator = v.object({
  seasonNumber: v.number(),
  episodeCount: v.number(),
});

type TrackingStatus = 'watching' | 'planned' | 'finished' | 'abandoned';
type MediaInput = {
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  subtitle?: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  voteAverage?: number;
  releaseDate?: string;
  genreIds?: number[];
};
type SeasonInput = {
  seasonNumber: number;
  episodeCount: number;
};
type AuthenticatedCtx = QueryCtx | MutationCtx;

export const getForMedia = query({
  args: {
    mediaType: mediaTypeValidator,
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await findUser(ctx, identity.tokenIdentifier);
    const media = await findMedia(ctx, args.mediaType, args.tmdbId);
    if (!user || !media) {
      return null;
    }

    const tracking = await findTracking(ctx, user._id, media._id);
    if (!tracking) {
      return null;
    }

    const seasons: { seasonNumber: number; watched: boolean }[] = [];
    for await (const progress of ctx.db
      .query('seasonProgress')
      .withIndex('by_user_and_media', (q) => q.eq('userId', user._id).eq('mediaId', media._id))) {
      seasons.push({ seasonNumber: progress.seasonNumber, watched: progress.watched });
    }

    const episodes: { seasonNumber: number; episodeNumber: number; watched: boolean }[] = [];
    for await (const progress of ctx.db
      .query('watchedEvents')
      .withIndex('by_user_and_media', (q) => q.eq('userId', user._id).eq('mediaId', media._id))) {
      if (progress.seasonNumber !== undefined && progress.episodeNumber !== undefined) {
        episodes.push({
          seasonNumber: progress.seasonNumber,
          episodeNumber: progress.episodeNumber,
          watched: progress.watched ?? true,
        });
      }
    }

    return {
      status: tracking.status === 'planned' ? null : tracking.status,
      watchedEpisodes: tracking.watchedEpisodes ?? 0,
      totalEpisodes: tracking.totalEpisodes ?? 0,
      allEpisodesWatched: tracking.allEpisodesWatched ?? false,
      seasonNumber: tracking.seasonNumber,
      episodeNumber: tracking.episodeNumber,
      seasons,
      episodes,
    };
  },
});

export const getReaction = query({
  args: {
    mediaType: mediaTypeValidator,
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await findUser(ctx, identity.tokenIdentifier);
    const media = await findMedia(ctx, args.mediaType, args.tmdbId);
    if (!user || !media) {
      return null;
    }

    const reaction = await ctx.db
      .query('reactions')
      .withIndex('by_user_media', (q) => q.eq('userId', user._id).eq('mediaId', media._id))
      .unique();

    return reaction?.reaction ?? null;
  },
});

export const setReaction = mutation({
  args: {
    media: mediaValidator,
    seasons: v.array(seasonValidator),
    reaction: v.union(v.literal('like'), v.literal('love'), v.literal('dislike'), v.null()),
    markFinished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const mediaId = await upsertMedia(ctx, args.media);
    await upsertSeasons(ctx, mediaId, args.seasons);

    const existing = await ctx.db
      .query('reactions')
      .withIndex('by_user_media', (q) => q.eq('userId', userId).eq('mediaId', mediaId))
      .unique();

    if (args.reaction === null) {
      if (existing) {
        await ctx.db.delete('reactions', existing._id);
      }
      return null;
    }

    const tracking = await findTracking(ctx, userId, mediaId);
    if (args.media.mediaType === 'movie') {
      await markFinished(ctx, userId, mediaId, args.seasons, tracking);
    } else if (tracking?.status !== 'finished') {
      if (!args.markFinished) {
        throw new Error('Finish all episodes before rating this show');
      }
      await markFinished(ctx, userId, mediaId, args.seasons, tracking);
    }

    if (existing) {
      await ctx.db.patch('reactions', existing._id, {
        reaction: args.reaction,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('reactions', {
        userId,
        mediaId,
        reaction: args.reaction,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

export const markUnwatched = mutation({
  args: {
    media: mediaValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const mediaId = await upsertMedia(ctx, args.media);
    const tracking = await findTracking(ctx, userId, mediaId);
    const reaction = await ctx.db
      .query('reactions')
      .withIndex('by_user_media', (q) => q.eq('userId', userId).eq('mediaId', mediaId))
      .unique();

    await clearProgress(ctx, userId, mediaId);
    if (tracking) {
      await ctx.db.delete('tracking', tracking._id);
    }
    if (reaction) {
      await ctx.db.delete('reactions', reaction._id);
    }
    await setWatchlistValue(ctx, userId, mediaId, false, Date.now());
    return null;
  },
});

export const abandonShow = mutation({
  args: {
    media: mediaValidator,
    seasons: v.array(seasonValidator),
  },
  handler: async (ctx, args) => {
    if (args.media.mediaType !== 'tv') {
      throw new Error('Only shows can be abandoned');
    }

    const userId = await getOrCreateUser(ctx);
    const mediaId = await upsertMedia(ctx, args.media);
    await upsertSeasons(ctx, mediaId, args.seasons);
    const tracking = await findTracking(ctx, userId, mediaId);
    const watchedEpisodes = tracking?.watchedEpisodes ?? 0;
    const totalEpisodes = totalEpisodeCount(args.seasons);

    if (!tracking || watchedEpisodes <= 0 || (totalEpisodes > 0 && watchedEpisodes >= totalEpisodes)) {
      throw new Error('Only partially watched shows can be abandoned');
    }

    await ctx.db.patch('tracking', tracking._id, {
      status: 'abandoned',
      totalEpisodes,
      updatedAt: Date.now(),
    });
    await setWatchlistValue(ctx, userId, mediaId, false, Date.now());
    return null;
  },
});

export const listWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await findUser(ctx, identity.tokenIdentifier);
    if (!user) {
      return [];
    }

    const saved = await ctx.db
      .query('watchlist')
      .withIndex('by_user_and_added_at', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(200);
    const legacyPlanned = await ctx.db
      .query('tracking')
      .withIndex('by_user_and_status_and_updated_at', (q) =>
        q.eq('userId', user._id).eq('status', 'planned'),
      )
      .order('desc')
      .take(200);

    const items = new Map<string, ReturnType<typeof watchlistItem>>();
    for (const entry of saved) {
      const tracking = await findTracking(ctx, user._id, entry.mediaId);
      if (tracking?.status === 'finished') {
        continue;
      }
      const media = await ctx.db.get('mediaItems', entry.mediaId);
      if (media) {
        items.set(mediaKey(media.mediaType, media.tmdbId), watchlistItem(media, entry.addedAt));
      }
    }
    for (const entry of legacyPlanned) {
      const media = await ctx.db.get('mediaItems', entry.mediaId);
      if (media) {
        const key = mediaKey(media.mediaType, media.tmdbId);
        if (!items.has(key)) {
          items.set(key, watchlistItem(media, entry.updatedAt));
        }
      }
    }

    return [...items.values()].sort((a, b) => b.addedAt - a.addedAt);
  },
});

export const setWatchlist = mutation({
  args: {
    media: mediaValidator,
    saved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const mediaId = await upsertMedia(ctx, args.media);
    await setWatchlistValue(ctx, userId, mediaId, args.saved, Date.now());
    return null;
  },
});

export const importWatchlist = mutation({
  args: {
    items: v.array(
      v.object({
        media: mediaValidator,
        addedAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    if (args.items.length > 200) {
      throw new Error('Watchlist import is limited to 200 titles at a time');
    }

    const userId = await getOrCreateUser(ctx);
    for (const item of args.items) {
      const mediaId = await upsertMedia(ctx, item.media);
      await setWatchlistValue(ctx, userId, mediaId, true, item.addedAt);
    }
    return null;
  },
});

export const listWatching = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await findUser(ctx, identity.tokenIdentifier);
    if (!user) {
      return [];
    }

    const tracking = await ctx.db
      .query('tracking')
      .withIndex('by_user_and_status_and_updated_at', (q) =>
        q.eq('userId', user._id).eq('status', 'watching'),
      )
      .order('desc')
      .take(30);

    const items = await Promise.all(
      tracking.map(async (entry) => {
        const media = await ctx.db.get('mediaItems', entry.mediaId);
        if (!media || media.mediaType !== 'tv') {
          return null;
        }

        return {
          id: media._id,
          tmdbId: media.tmdbId,
          mediaType: media.mediaType,
          title: media.title,
          posterUrl: media.posterPath,
          backdropUrl: media.backdropPath,
          seasonNumber: entry.seasonNumber,
          episodeNumber: entry.episodeNumber,
          watchedEpisodes: entry.watchedEpisodes ?? 0,
          totalEpisodes: entry.totalEpisodes ?? 0,
          updatedAt: entry.updatedAt,
        };
      }),
    );

    return items.filter((item) => item !== null);
  },
});

export const listDiscoverExclusions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await findUser(ctx, identity.tokenIdentifier);
    if (!user) {
      return [];
    }

    const watchlist = await ctx.db
      .query('watchlist')
      .withIndex('by_user_and_added_at', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(200);
    const statuses = ['watching', 'planned', 'finished'] as const;
    const tracking = (
      await Promise.all(
        statuses.map((status) =>
          ctx.db
            .query('tracking')
            .withIndex('by_user_and_status_and_updated_at', (q) =>
              q.eq('userId', user._id).eq('status', status),
            )
            .order('desc')
            .take(50),
        ),
      )
    ).flat();

    const items = await Promise.all(
      [...tracking, ...watchlist].map(async (entry) => {
        const media = await ctx.db.get('mediaItems', entry.mediaId);
        if (!media) {
          return null;
        }

        return {
          tmdbId: media.tmdbId,
          mediaType: media.mediaType,
        };
      }),
    );

    return items.filter((item) => item !== null);
  },
});

export const setStatus = mutation({
  args: {
    media: mediaValidator,
    seasons: v.array(seasonValidator),
    status: editableStatusValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const mediaId = await upsertMedia(ctx, args.media);
    await upsertSeasons(ctx, mediaId, args.seasons);

    const existing = await findTracking(ctx, userId, mediaId);
    if (args.status === null) {
      if (existing) {
        await clearProgress(ctx, userId, mediaId);
        await ctx.db.delete('tracking', existing._id);
      }
      return null;
    }
    if (args.media.mediaType === 'movie' && args.status !== 'finished') {
      throw new Error('Movies can only be marked watched or unwatched');
    }

    const totalEpisodes = totalEpisodeCount(args.seasons);
    const now = Date.now();
    const lastSeason = [...args.seasons].sort((a, b) => a.seasonNumber - b.seasonNumber).at(-1);
    const finished = args.status === 'finished';
    const resetFinishedShow =
      existing?.status === 'finished' && args.media.mediaType === 'tv' && !finished;

    if (finished || resetFinishedShow) {
      await clearProgress(ctx, userId, mediaId);
    }

    const values = {
      userId,
      mediaId,
      status: args.status,
      watchedEpisodes: finished ? totalEpisodes : resetFinishedShow ? 0 : (existing?.watchedEpisodes ?? 0),
      totalEpisodes,
      allEpisodesWatched: finished ? true : resetFinishedShow ? false : (existing?.allEpisodesWatched ?? false),
      seasonNumber: finished
        ? lastSeason?.seasonNumber
        : resetFinishedShow
          ? undefined
          : existing?.seasonNumber,
      episodeNumber: finished
        ? lastSeason?.episodeCount
        : resetFinishedShow
          ? undefined
          : existing?.episodeNumber,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch('tracking', existing._id, values);
    } else {
      await ctx.db.insert('tracking', values);
    }

    return null;
  },
});

export const setEpisodeWatched = mutation({
  args: {
    media: mediaValidator,
    seasons: v.array(seasonValidator),
    seasonNumber: v.number(),
    episodeNumber: v.number(),
    watched: v.boolean(),
    markPrevious: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const mediaId = await upsertMedia(ctx, args.media);
    await upsertSeasons(ctx, mediaId, args.seasons);
    const tracking = await ensureTracking(ctx, userId, mediaId, args.seasons);

    if (args.markPrevious && args.watched) {
      for (const season of args.seasons) {
        if (season.seasonNumber < args.seasonNumber) {
          await setSeasonDefault(ctx, userId, mediaId, season.seasonNumber, true, tracking);
          await clearEpisodeProgressForSeason(ctx, userId, mediaId, season.seasonNumber);
        }
      }

      for (let episodeNumber = 1; episodeNumber < args.episodeNumber; episodeNumber += 1) {
        await setEpisodeOverride(
          ctx,
          userId,
          mediaId,
          args.seasonNumber,
          episodeNumber,
          true,
          tracking,
        );
      }
    }

    await setEpisodeOverride(
      ctx,
      userId,
      mediaId,
      args.seasonNumber,
      args.episodeNumber,
      args.watched,
      tracking,
    );
    await recalculateTracking(ctx, tracking, args.seasons);
    return null;
  },
});

export const setSeasonWatched = mutation({
  args: {
    media: mediaValidator,
    seasons: v.array(seasonValidator),
    seasonNumber: v.number(),
    watched: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getOrCreateUser(ctx);
    const mediaId = await upsertMedia(ctx, args.media);
    await upsertSeasons(ctx, mediaId, args.seasons);
    const tracking = await ensureTracking(ctx, userId, mediaId, args.seasons);

    await setSeasonDefault(ctx, userId, mediaId, args.seasonNumber, args.watched, tracking);
    await clearEpisodeProgressForSeason(ctx, userId, mediaId, args.seasonNumber);
    await recalculateTracking(ctx, tracking, args.seasons);
    return null;
  },
});

async function findUser(ctx: AuthenticatedCtx, tokenIdentifier: string) {
  return ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', tokenIdentifier))
    .unique();
}

async function getOrCreateUser(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }

  const existing = await findUser(ctx, identity.tokenIdentifier);
  if (existing) {
    return existing._id;
  }

  return ctx.db.insert('users', {
    clerkId: identity.tokenIdentifier,
    ...(identity.name ? { displayName: identity.name } : {}),
    ...(identity.pictureUrl ? { imageUrl: identity.pictureUrl } : {}),
  });
}

async function findMedia(ctx: AuthenticatedCtx, mediaType: 'movie' | 'tv', tmdbId: number) {
  return ctx.db
    .query('mediaItems')
    .withIndex('by_tmdb', (q) => q.eq('mediaType', mediaType).eq('tmdbId', tmdbId))
    .unique();
}

function watchlistItem(media: Doc<'mediaItems'>, addedAt: number) {
  return {
    id: media.tmdbId,
    mediaType: media.mediaType,
    title: media.title,
    subtitle: media.subtitle ?? (media.mediaType === 'movie' ? 'Movie' : 'TV Show'),
    overview: media.overview ?? '',
    posterUrl: media.posterPath,
    backdropUrl: media.backdropPath,
    voteAverage: media.voteAverage ?? 0,
    releaseDate: media.releaseDate,
    genreIds: media.genreIds ?? [],
    addedAt,
  };
}

function mediaKey(mediaType: 'movie' | 'tv', tmdbId: number) {
  return `${mediaType}:${tmdbId}`;
}

async function upsertMedia(ctx: MutationCtx, media: MediaInput) {
  const existing = await findMedia(ctx, media.mediaType, media.tmdbId);
  const values = {
    title: media.title,
    ...(media.subtitle !== undefined ? { subtitle: media.subtitle } : {}),
    ...(media.overview !== undefined ? { overview: media.overview } : {}),
    ...(media.posterUrl ? { posterPath: media.posterUrl } : {}),
    ...(media.backdropUrl ? { backdropPath: media.backdropUrl } : {}),
    ...(media.voteAverage !== undefined ? { voteAverage: media.voteAverage } : {}),
    ...(media.releaseDate !== undefined ? { releaseDate: media.releaseDate } : {}),
    ...(media.genreIds !== undefined ? { genreIds: media.genreIds } : {}),
  };

  if (existing) {
    await ctx.db.patch('mediaItems', existing._id, values);
    return existing._id;
  }

  return ctx.db.insert('mediaItems', {
    tmdbId: media.tmdbId,
    mediaType: media.mediaType,
    ...values,
  });
}

async function setWatchlistValue(
  ctx: MutationCtx,
  userId: Id<'users'>,
  mediaId: Id<'mediaItems'>,
  saved: boolean,
  addedAt: number,
) {
  const existing = await ctx.db
    .query('watchlist')
    .withIndex('by_user_and_media', (q) => q.eq('userId', userId).eq('mediaId', mediaId))
    .unique();
  const legacyTracking = await findTracking(ctx, userId, mediaId);

  if (saved) {
    if (!existing) {
      await ctx.db.insert('watchlist', { userId, mediaId, addedAt });
    }
  } else if (existing) {
    await ctx.db.delete('watchlist', existing._id);
  }

  if (legacyTracking?.status === 'planned') {
    await ctx.db.delete('tracking', legacyTracking._id);
  }
}

async function upsertSeasons(ctx: MutationCtx, mediaId: Id<'mediaItems'>, seasons: SeasonInput[]) {
  for (const season of seasons) {
    const existing = await ctx.db
      .query('mediaSeasons')
      .withIndex('by_media_and_season', (q) =>
        q.eq('mediaId', mediaId).eq('seasonNumber', season.seasonNumber),
      )
      .unique();

    if (existing) {
      if (existing.episodeCount !== season.episodeCount) {
        await ctx.db.patch('mediaSeasons', existing._id, { episodeCount: season.episodeCount });
      }
    } else {
      await ctx.db.insert('mediaSeasons', { mediaId, ...season });
    }
  }
}

async function findTracking(
  ctx: AuthenticatedCtx,
  userId: Id<'users'>,
  mediaId: Id<'mediaItems'>,
) {
  return ctx.db
    .query('tracking')
    .withIndex('by_user_and_media', (q) => q.eq('userId', userId).eq('mediaId', mediaId))
    .unique();
}

async function ensureTracking(
  ctx: MutationCtx,
  userId: Id<'users'>,
  mediaId: Id<'mediaItems'>,
  seasons: SeasonInput[],
) {
  const existing = await findTracking(ctx, userId, mediaId);
  if (existing) {
    return existing;
  }

  const _id = await ctx.db.insert('tracking', {
    userId,
    mediaId,
    status: 'watching',
    watchedEpisodes: 0,
    totalEpisodes: totalEpisodeCount(seasons),
    allEpisodesWatched: false,
    updatedAt: Date.now(),
  });
  const created = await ctx.db.get('tracking', _id);
  if (!created) {
    throw new Error('Unable to create tracking record');
  }
  return created;
}

async function markFinished(
  ctx: MutationCtx,
  userId: Id<'users'>,
  mediaId: Id<'mediaItems'>,
  seasons: SeasonInput[],
  existing: Doc<'tracking'> | null,
) {
  const totalEpisodes = totalEpisodeCount(seasons);
  const lastSeason = [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber).at(-1);
  await clearProgress(ctx, userId, mediaId);

  const values = {
    userId,
    mediaId,
    status: 'finished' as const,
    watchedEpisodes: totalEpisodes,
    totalEpisodes,
    allEpisodesWatched: true,
    seasonNumber: lastSeason?.seasonNumber,
    episodeNumber: lastSeason?.episodeCount,
    updatedAt: Date.now(),
  };

  if (existing) {
    await ctx.db.patch('tracking', existing._id, values);
  } else {
    await ctx.db.insert('tracking', values);
  }

  await setWatchlistValue(ctx, userId, mediaId, false, Date.now());
}

async function setSeasonDefault(
  ctx: MutationCtx,
  userId: Id<'users'>,
  mediaId: Id<'mediaItems'>,
  seasonNumber: number,
  watched: boolean,
  tracking: Doc<'tracking'>,
) {
  const existing = await ctx.db
    .query('seasonProgress')
    .withIndex('by_user_and_media_and_season', (q) =>
      q.eq('userId', userId).eq('mediaId', mediaId).eq('seasonNumber', seasonNumber),
    )
    .unique();
  const defaultWatched = tracking.allEpisodesWatched ?? false;

  if (watched === defaultWatched) {
    if (existing) {
      await ctx.db.delete('seasonProgress', existing._id);
    }
    return;
  }

  if (existing) {
    await ctx.db.patch('seasonProgress', existing._id, { watched, updatedAt: Date.now() });
  } else {
    await ctx.db.insert('seasonProgress', {
      userId,
      mediaId,
      seasonNumber,
      watched,
      updatedAt: Date.now(),
    });
  }
}

async function setEpisodeOverride(
  ctx: MutationCtx,
  userId: Id<'users'>,
  mediaId: Id<'mediaItems'>,
  seasonNumber: number,
  episodeNumber: number,
  watched: boolean,
  tracking: Doc<'tracking'>,
) {
  const season = await ctx.db
    .query('seasonProgress')
    .withIndex('by_user_and_media_and_season', (q) =>
      q.eq('userId', userId).eq('mediaId', mediaId).eq('seasonNumber', seasonNumber),
    )
    .unique();
  const existing = await ctx.db
    .query('watchedEvents')
    .withIndex('by_user_and_media_and_season_and_episode', (q) =>
      q
        .eq('userId', userId)
        .eq('mediaId', mediaId)
        .eq('seasonNumber', seasonNumber)
        .eq('episodeNumber', episodeNumber),
    )
    .unique();
  const defaultWatched = season?.watched ?? tracking.allEpisodesWatched ?? false;

  if (watched === defaultWatched) {
    if (existing) {
      await ctx.db.delete('watchedEvents', existing._id);
    }
    return;
  }

  const now = Date.now();
  if (existing) {
    await ctx.db.patch('watchedEvents', existing._id, { watched, watchedAt: now, updatedAt: now });
  } else {
    await ctx.db.insert('watchedEvents', {
      userId,
      mediaId,
      seasonNumber,
      episodeNumber,
      watched,
      watchedAt: now,
      updatedAt: now,
    });
  }
}

async function clearEpisodeProgressForSeason(
  ctx: MutationCtx,
  userId: Id<'users'>,
  mediaId: Id<'mediaItems'>,
  seasonNumber: number,
) {
  for await (const episode of ctx.db
    .query('watchedEvents')
    .withIndex('by_user_and_media_and_season', (q) =>
      q.eq('userId', userId).eq('mediaId', mediaId).eq('seasonNumber', seasonNumber),
    )) {
    await ctx.db.delete('watchedEvents', episode._id);
  }
}

async function clearProgress(ctx: MutationCtx, userId: Id<'users'>, mediaId: Id<'mediaItems'>) {
  for await (const season of ctx.db
    .query('seasonProgress')
    .withIndex('by_user_and_media', (q) => q.eq('userId', userId).eq('mediaId', mediaId))) {
    await ctx.db.delete('seasonProgress', season._id);
  }
  for await (const episode of ctx.db
    .query('watchedEvents')
    .withIndex('by_user_and_media', (q) => q.eq('userId', userId).eq('mediaId', mediaId))) {
    await ctx.db.delete('watchedEvents', episode._id);
  }
}

async function recalculateTracking(
  ctx: MutationCtx,
  tracking: Doc<'tracking'>,
  seasons: SeasonInput[],
) {
  const seasonDefaults = new Map<number, boolean>();
  for await (const season of ctx.db
    .query('seasonProgress')
    .withIndex('by_user_and_media', (q) =>
      q.eq('userId', tracking.userId).eq('mediaId', tracking.mediaId),
    )) {
    seasonDefaults.set(season.seasonNumber, season.watched);
  }

  const episodeOverrides = new Map<string, boolean>();
  for await (const episode of ctx.db
    .query('watchedEvents')
    .withIndex('by_user_and_media', (q) =>
      q.eq('userId', tracking.userId).eq('mediaId', tracking.mediaId),
    )) {
    if (episode.seasonNumber !== undefined && episode.episodeNumber !== undefined) {
      episodeOverrides.set(
        episodeKey(episode.seasonNumber, episode.episodeNumber),
        episode.watched ?? true,
      );
    }
  }

  const allDefault = tracking.allEpisodesWatched ?? false;
  let watchedEpisodes = 0;
  let lastWatchedSeason: number | undefined;
  let lastWatchedEpisode: number | undefined;

  for (const season of [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber)) {
    const seasonDefault = seasonDefaults.get(season.seasonNumber) ?? allDefault;
    for (let episodeNumber = 1; episodeNumber <= season.episodeCount; episodeNumber += 1) {
      const watched =
        episodeOverrides.get(episodeKey(season.seasonNumber, episodeNumber)) ?? seasonDefault;
      if (watched) {
        watchedEpisodes += 1;
        lastWatchedSeason = season.seasonNumber;
        lastWatchedEpisode = episodeNumber;
      }
    }
  }

  const totalEpisodes = totalEpisodeCount(seasons);
  const finished = totalEpisodes > 0 && watchedEpisodes === totalEpisodes;
  const status: TrackingStatus = finished ? 'finished' : 'watching';

  if (finished && !allDefault) {
    await clearProgress(ctx, tracking.userId, tracking.mediaId);
  }

  await ctx.db.patch('tracking', tracking._id, {
    status,
    watchedEpisodes,
    totalEpisodes,
    allEpisodesWatched: finished ? true : allDefault,
    seasonNumber: lastWatchedSeason,
    episodeNumber: lastWatchedEpisode,
    updatedAt: Date.now(),
  });
}

function totalEpisodeCount(seasons: SeasonInput[]) {
  return seasons.reduce((total, season) => total + season.episodeCount, 0);
}

function episodeKey(seasonNumber: number, episodeNumber: number) {
  return `${seasonNumber}:${episodeNumber}`;
}
