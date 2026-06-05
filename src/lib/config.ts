export const tmdbAccessToken = process.env.EXPO_PUBLIC_TMDB_ACCESS_TOKEN;
export const tmdbApiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
export const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

export const isTmdbConfigured = Boolean(tmdbAccessToken || tmdbApiKey);
export const isClerkConfigured = Boolean(clerkPublishableKey);
export const isConvexConfigured = Boolean(convexUrl);

export const tmdbImage = (
  path?: string | null,
  size: 'w342' | 'w500' | 'w780' | 'original' = 'w500',
) => {
  if (!path) {
    return undefined;
  }

  return `https://image.tmdb.org/t/p/${size}${path}`;
};
