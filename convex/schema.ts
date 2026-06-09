import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    displayName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index('by_clerk_id', ['clerkId']),

  mediaItems: defineTable({
    tmdbId: v.number(),
    mediaType: v.union(v.literal('movie'), v.literal('tv')),
    title: v.string(),
    subtitle: v.optional(v.string()),
    overview: v.optional(v.string()),
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
    voteAverage: v.optional(v.number()),
    releaseDate: v.optional(v.string()),
    genreIds: v.optional(v.array(v.number())),
  }).index('by_tmdb', ['mediaType', 'tmdbId']),

  watchlist: defineTable({
    userId: v.id('users'),
    mediaId: v.id('mediaItems'),
    addedAt: v.number(),
  })
    .index('by_user_and_added_at', ['userId', 'addedAt'])
    .index('by_user_and_media', ['userId', 'mediaId']),

  mediaSeasons: defineTable({
    mediaId: v.id('mediaItems'),
    seasonNumber: v.number(),
    episodeCount: v.number(),
  }).index('by_media_and_season', ['mediaId', 'seasonNumber']),

  tracking: defineTable({
    userId: v.id('users'),
    mediaId: v.id('mediaItems'),
    status: v.union(
      v.literal('watching'),
      v.literal('planned'),
      v.literal('finished'),
      v.literal('abandoned'),
    ),
    seasonNumber: v.optional(v.number()),
    episodeNumber: v.optional(v.number()),
    watchedEpisodes: v.optional(v.number()),
    totalEpisodes: v.optional(v.number()),
    allEpisodesWatched: v.optional(v.boolean()),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_media', ['userId', 'mediaId'])
    .index('by_user_and_status_and_updated_at', ['userId', 'status', 'updatedAt']),

  seasonProgress: defineTable({
    userId: v.id('users'),
    mediaId: v.id('mediaItems'),
    seasonNumber: v.number(),
    watched: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_user_and_media', ['userId', 'mediaId'])
    .index('by_user_and_media_and_season', ['userId', 'mediaId', 'seasonNumber']),

  reactions: defineTable({
    userId: v.id('users'),
    mediaId: v.id('mediaItems'),
    reaction: v.union(v.literal('like'), v.literal('love'), v.literal('dislike')),
    updatedAt: v.number(),
  }).index('by_user_media', ['userId', 'mediaId']),

  watchedEvents: defineTable({
    userId: v.id('users'),
    mediaId: v.id('mediaItems'),
    seasonNumber: v.optional(v.number()),
    episodeNumber: v.optional(v.number()),
    watchedAt: v.number(),
    watched: v.optional(v.boolean()),
    updatedAt: v.optional(v.number()),
  })
    .index('by_user_time', ['userId', 'watchedAt'])
    .index('by_user_and_media', ['userId', 'mediaId'])
    .index('by_user_and_media_and_season', ['userId', 'mediaId', 'seasonNumber'])
    .index('by_user_and_media_and_season_and_episode', [
      'userId',
      'mediaId',
      'seasonNumber',
      'episodeNumber',
    ]),

  friendships: defineTable({
    followerId: v.id('users'),
    followingId: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_follower', ['followerId'])
    .index('by_following', ['followingId']),
});
