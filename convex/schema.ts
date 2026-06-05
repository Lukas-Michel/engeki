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
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
  }).index('by_tmdb', ['mediaType', 'tmdbId']),

  tracking: defineTable({
    userId: v.id('users'),
    mediaId: v.id('mediaItems'),
    status: v.union(v.literal('watching'), v.literal('planned'), v.literal('finished')),
    seasonNumber: v.optional(v.number()),
    episodeNumber: v.optional(v.number()),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

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
  }).index('by_user_time', ['userId', 'watchedAt']),

  friendships: defineTable({
    followerId: v.id('users'),
    followingId: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_follower', ['followerId'])
    .index('by_following', ['followingId']),
});
