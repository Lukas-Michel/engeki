import { Image } from 'expo-image';
import { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { HeroCarousel } from '@/components/media/hero-carousel';
import { MediaCard } from '@/components/media/media-card';
import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAsync } from '@/hooks/use-async';
import { watchProgress } from '@/lib/library';
import { fallbackRecent, fallbackTrending, getRecentlyReleased, getTrending } from '@/lib/tmdb';

export default function HomeScreen() {
  const theme = useTheme();
  const loadTrending = useCallback(() => getTrending(), []);
  const loadRecent = useCallback(() => getRecentlyReleased(), []);
  const trending = useAsync(loadTrending, fallbackTrending);
  const recent = useAsync(loadRecent, fallbackRecent);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <ThemedText type="small" themeColor="textSecondary">
            Engeki
          </ThemedText>
          <ThemedText type="subtitle">Keep watching</ThemedText>
        </View>
        {(trending.loading || recent.loading) && <ActivityIndicator color={theme.accent} />}
      </View>

      {trending.error ? (
        <ThemedView type="accentSoft" style={styles.notice}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            TMDB setup needed
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Add your TMDB token to .env.local to replace fallback content with live data.
          </ThemedText>
        </ThemedView>
      ) : null}

      <HeroCarousel items={trending.data} />

      <View style={styles.section}>
        <SectionHeader title="Watching progress" action="2 active" />
        {watchProgress.map((item) => {
          const progress = item.episode / item.totalEpisodes;

          return (
            <ThemedView type="surface" style={styles.progressCard} key={item.id}>
              <Image source={{ uri: item.imageUrl }} style={styles.progressImage} contentFit="cover" />
              <View style={styles.progressCopy}>
                <View>
                  <ThemedText type="smallBold">{item.title}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    S{item.season} E{item.episode} · next {item.nextRelease}
                  </ThemedText>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.surfaceMuted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            </ThemedView>
          );
        })}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recently released" action="Movies and TV" />
        {recent.data.slice(0, 5).map((item) => (
          <MediaCard item={item} key={`${item.mediaType}-${item.id}`} compact />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  notice: {
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  section: {
    gap: Spacing.three,
  },
  progressCard: {
    borderRadius: 8,
    padding: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.three,
    overflow: 'hidden',
  },
  progressImage: {
    width: 86,
    height: 86,
    borderRadius: 7,
    backgroundColor: '#222222',
  },
  progressCopy: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
