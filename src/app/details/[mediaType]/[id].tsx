import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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

const reactions: { value: MediaReaction; label: string }[] = [
  { value: 'like', label: 'Like' },
  { value: 'love', label: 'Love' },
  { value: 'dislike', label: 'Dislike' },
];

export default function DetailsScreen() {
  const theme = useTheme();
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
  const item = details.data;
  const runtime = mediaType === 'movie' ? formatRuntime(item.runtime) : formatRuntime(item.episodeRuntime);

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.hero}>
        <Image source={{ uri: item.backdropUrl ?? item.posterUrl }} style={styles.backdrop} contentFit="cover" />
        <View style={styles.scrim} />
        {details.loading ? <ActivityIndicator style={styles.loader} color="#FFFFFF" /> : null}
      </View>

      <View style={styles.summaryRow}>
        <Image source={{ uri: item.posterUrl ?? item.backdropUrl }} style={styles.poster} contentFit="cover" />
        <View style={styles.summaryCopy}>
          <ThemedText type="subtitle" style={styles.title}>
            {item.title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDate(item.releaseDate)} · {runtime} · {item.status ?? item.subtitle}
          </ThemedText>
          <View style={styles.chips}>
            {[item.subtitle, ...item.genres.slice(0, 2)].map((chip) => (
              <View style={[styles.chip, { backgroundColor: theme.surfaceMuted }]} key={chip}>
                <ThemedText type="code" themeColor="textSecondary">
                  {chip}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>

      <ThemedView type="surface" style={styles.ratingCard}>
        <View>
          <ThemedText type="smallBold">Your rating</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Simple reactions keep history fast.
          </ThemedText>
        </View>
        <View style={styles.reactionRow}>
          {reactions.map((item) => {
            const active = reaction === item.value;

            return (
              <Pressable
                key={item.value}
                onPress={() => setReaction(active ? undefined : item.value)}
                style={[
                  styles.reaction,
                  {
                    backgroundColor: active ? theme.accent : theme.surfaceMuted,
                  },
                ]}>
                <ThemedText type="smallBold" style={{ color: active ? '#FFFFFF' : theme.text }}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </ThemedView>

      <View style={styles.section}>
        <SectionHeader title="Synopsis" />
        <ThemedText themeColor="textSecondary">{item.overview || 'No synopsis is available yet.'}</ThemedText>
      </View>

      {mediaType === 'tv' && item.seasons?.length ? (
        <View style={styles.section}>
          <SectionHeader title="Seasons" action={`${item.seasons.length} listed`} />
          {item.seasons.slice(0, 6).map((season) => (
            <ThemedView type="surface" style={styles.seasonRow} key={season.id}>
              <Image source={{ uri: season.posterUrl ?? item.posterUrl }} style={styles.seasonPoster} contentFit="cover" />
              <View style={styles.seasonCopy}>
                <ThemedText type="smallBold">{season.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {season.episodeCount} episodes · {formatDate(season.airDate)}
                </ThemedText>
              </View>
            </ThemedView>
          ))}
        </View>
      ) : null}

      {item.cast.length ? (
        <View style={styles.section}>
          <SectionHeader title="Cast" />
          <View style={styles.castGrid}>
            {item.cast.slice(0, 8).map((member) => (
              <ThemedView type="surface" style={styles.castCard} key={member.id}>
                <Image source={{ uri: member.imageUrl }} style={styles.castImage} contentFit="cover" />
                <ThemedText type="smallBold" numberOfLines={1}>
                  {member.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {member.character}
                </ThemedText>
              </ThemedView>
            ))}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  hero: {
    height: 310,
    marginBottom: -88,
    backgroundColor: '#111111',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  loader: {
    marginTop: 150,
  },
  summaryRow: {
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
  },
  poster: {
    width: 116,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    backgroundColor: '#222222',
  },
  summaryCopy: {
    flex: 1,
    gap: Spacing.two,
    paddingBottom: Spacing.one,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  ratingCard: {
    marginHorizontal: Spacing.three,
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  reaction: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
  },
  section: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  seasonRow: {
    borderRadius: 8,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  seasonPoster: {
    width: 58,
    height: 84,
    borderRadius: 7,
    backgroundColor: '#222222',
  },
  seasonCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  castGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  castCard: {
    width: '48%',
    borderRadius: 8,
    padding: Spacing.two,
    gap: Spacing.one,
  },
  castImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 7,
    backgroundColor: '#222222',
  },
});
