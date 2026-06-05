import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, type MediaSummary } from '@/lib/tmdb';

type MediaCardProps = {
  item: MediaSummary;
  compact?: boolean;
};

export function MediaCard({ item, compact = false }: MediaCardProps) {
  const theme = useTheme();

  return (
    <Link
      href={{
        pathname: '/details/[mediaType]/[id]',
        params: { mediaType: item.mediaType, id: String(item.id) },
      }}
      asChild>
      <Pressable style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
        <ThemedView type="surface" style={[styles.card, compact && styles.compactCard]}>
          <Image source={{ uri: item.posterUrl ?? item.backdropUrl }} style={styles.poster} contentFit="cover" />
          <View style={styles.copy}>
            <ThemedText type="smallBold" numberOfLines={2}>
              {item.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {item.subtitle} · {formatDate(item.releaseDate)}
            </ThemedText>
            <View style={styles.metaRow}>
              <View style={[styles.score, { backgroundColor: theme.accentSoft }]}>
                <ThemedText type="code" style={{ color: theme.accent }}>
                  {item.voteAverage.toFixed(1)}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={compact ? 1 : 2} style={styles.overview}>
                {item.overview || 'Details coming soon.'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  card: {
    borderRadius: 8,
    padding: Spacing.two,
    flexDirection: 'row',
    gap: Spacing.three,
    overflow: 'hidden',
  },
  compactCard: {
    minHeight: 112,
  },
  poster: {
    width: 74,
    aspectRatio: 2 / 3,
    borderRadius: 7,
    backgroundColor: '#222222',
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  score: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  overview: {
    flex: 1,
  },
});
