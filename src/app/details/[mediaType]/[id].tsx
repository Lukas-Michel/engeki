import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { Card, IconButton, RatingBadge, Tag, reactionMeta } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import {
    fallbackTrending,
    formatDate,
    formatRuntime,
    getMediaDetails,
    type MediaReaction,
    type MediaType,
} from '@/lib/tmdb';
import { useWatchlist } from '@/lib/watchlist';

const reactions: MediaReaction[] = ['like', 'love', 'dislike'];

export default function DetailsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mediaType: MediaType; id: string }>();
  const mediaType = params.mediaType === 'tv' ? 'tv' : 'movie';
  const id = Number(params.id);
  const fallback = useMemo(
    () => fallbackTrending.find((item) => item.id === id && item.mediaType === mediaType) ?? fallbackTrending[0],
    [id, mediaType],
  );
  const loadDetails = useCallback(() => getMediaDetails(mediaType, id), [id, mediaType]);
  const details = useAsync(loadDetails, { ...fallback, cast: [], genres: [], videos: [] });
  const [reaction, setReaction] = useState<MediaReaction | undefined>();
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const item = details.data;
  const watchlisted = isWatchlisted(item.mediaType, item.id);
  const runtime = mediaType === 'movie' ? formatRuntime(item.runtime) : formatRuntime(item.episodeRuntime);

  return (
    <>
      <Screen topInset={false} contentStyle={styles.content}>
        <View style={styles.hero}>
          <Image source={{ uri: item.backdropUrl ?? item.posterUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(6,4,12,0.15)', 'rgba(6,4,12,0.4)', theme.background]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View style={[styles.heroTopRow, { paddingTop: insets.top + Spacing.two }]}>
            {item.voteAverage > 0 ? <RatingBadge score={item.voteAverage} onDark /> : <View />}
          </View>

          {details.loading ? <ActivityIndicator style={styles.loader} color="#FFFFFF" /> : null}

          <View style={styles.heroContent}>
            <View style={styles.tagRow}>
              <Tag label={item.subtitle} tone="solid" />
              {item.genres.slice(0, 2).map((genre) => (
                <Tag label={genre} tone="outline" key={genre} />
              ))}
            </View>
            <ThemedText type="display" style={styles.heroTitle} numberOfLines={3}>
              {item.title}
            </ThemedText>
            <View style={styles.metaRow}>
              <Feather name="calendar" size={13} color="rgba(255,255,255,0.82)" />
              <ThemedText type="small" style={styles.metaText}>
                {formatDate(item.releaseDate)}
              </ThemedText>
              <View style={styles.dot} />
              <Feather name="clock" size={13} color="rgba(255,255,255,0.82)" />
              <ThemedText type="small" style={styles.metaText}>
                {runtime}
              </ThemedText>
              {item.status ? (
                <>
                  <View style={styles.dot} />
                  <ThemedText type="small" style={styles.metaText} numberOfLines={1}>
                    {item.status}
                  </ThemedText>
                </>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Pressable
            onPress={() => toggleWatchlist(item)}
            style={[
              styles.watchlistCard,
              {
                backgroundColor: watchlisted ? theme.accent : theme.surface,
                borderColor: watchlisted ? theme.accent : theme.border,
              },
            ]}>
            <View style={styles.watchlistCopy}>
              <ThemedText type="smallBold" style={{ color: watchlisted ? theme.onAccent : theme.text }}>
                {watchlisted ? 'In watchlist' : 'Add to watchlist'}
              </ThemedText>
              <ThemedText type="small" style={{ color: watchlisted ? 'rgba(255,255,255,0.78)' : theme.textSecondary }}>
                {watchlisted ? 'This title can appear in your upcoming sections.' : 'Track this title from your home screen.'}
              </ThemedText>
            </View>
            <Feather name="bookmark" size={18} color={watchlisted ? theme.onAccent : theme.accent} />
          </Pressable>

          <Card style={styles.ratingCard}>
            <View style={styles.ratingHead}>
              <ThemedText type="smallBold">How was it?</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Quick reactions keep your history fast.
              </ThemedText>
            </View>
            <View style={styles.reactionRow}>
              {reactions.map((value) => {
                const meta = reactionMeta[value];
                const active = reaction === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setReaction(active ? undefined : value)}
                    style={[
                      styles.reaction,
                      {
                        backgroundColor: active ? theme.accent : theme.surfaceMuted,
                        borderColor: active ? theme.accent : theme.border,
                      },
                    ]}>
                    <Feather name={meta.icon} size={16} color={active ? theme.onAccent : theme.textSecondary} />
                    <ThemedText type="smallBold" style={{ color: active ? theme.onAccent : theme.text }}>
                      {meta.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <View style={styles.section}>
            <SectionHeader title="Synopsis" />
            <ThemedText type="body" themeColor="textSecondary">
              {item.overview || 'No synopsis is available yet.'}
            </ThemedText>
          </View>

          {mediaType === 'tv' && item.seasons?.length ? (
            <View style={styles.section}>
              <SectionHeader title="Seasons" caption={`${item.seasons.length} listed`} />
              <View style={styles.seasonList}>
                {item.seasons.slice(0, 6).map((season) => (
                  <Card style={styles.seasonRow} key={season.id}>
                    <Image source={{ uri: season.posterUrl ?? item.posterUrl }} style={styles.seasonPoster} contentFit="cover" />
                    <View style={styles.seasonCopy}>
                      <ThemedText type="smallBold">{season.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {season.episodeCount} episodes · {formatDate(season.airDate)}
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.textTertiary} />
                  </Card>
                ))}
              </View>
            </View>
          ) : null}

          {item.cast.length ? (
            <View style={styles.section}>
              <SectionHeader title="Cast" caption={`${item.cast.length} credited`} />
              <View style={styles.castGrid}>
                {item.cast.slice(0, 8).map((member) => (
                  <Card style={styles.castCard} key={member.id}>
                    <Image source={{ uri: member.imageUrl }} style={styles.castImage} contentFit="cover" />
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {member.name}
                    </ThemedText>
                    <ThemedText type="label" themeColor="textTertiary" numberOfLines={1}>
                      {member.character}
                    </ThemedText>
                  </Card>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Screen>

      <View style={[styles.backButton, { top: insets.top + Spacing.two }]} pointerEvents="box-none">
        <IconButton name="arrow-left" tone="glass" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    gap: 0,
  },
  hero: {
    height: 480,
    backgroundColor: '#0E0C14',
    justifyContent: 'flex-end',
  },
  heroTopRow: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },
  loader: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
  },
  heroContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 40,
    lineHeight: 44,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  metaText: {
    color: 'rgba(255,255,255,0.82)',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 3,
  },
  body: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.five,
  },
  watchlistCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  watchlistCopy: {
    flex: 1,
    gap: 3,
  },
  ratingCard: {
    gap: Spacing.three,
  },
  ratingHead: {
    gap: 3,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  reaction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 13,
  },
  section: {
    gap: Spacing.three,
  },
  seasonList: {
    gap: Spacing.two,
  },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
  },
  seasonPoster: {
    width: 54,
    height: 78,
    borderRadius: Radius.sm,
    backgroundColor: '#1A1822',
  },
  seasonCopy: {
    flex: 1,
    gap: 3,
  },
  castGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  castCard: {
    width: '48%',
    gap: Spacing.one,
    padding: Spacing.two,
  },
  castImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
    backgroundColor: '#1A1822',
    marginBottom: 2,
  },
  backButton: {
    position: 'absolute',
    left: Spacing.three,
  },
});
