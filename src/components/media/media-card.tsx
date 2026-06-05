import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, RatingBadge, Tag } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, type MediaSummary } from '@/lib/tmdb';
import { useWatchlist } from '@/lib/watchlist';

type MediaCardProps = {
  item: MediaSummary;
  /** Optional leading rank number for ordered lists. */
  rank?: number;
  compact?: boolean;
};

export function MediaCard({ item, rank, compact = false }: MediaCardProps) {
  const theme = useTheme();
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const watchlisted = isWatchlisted(item.mediaType, item.id);

  return (
    <Link
      href={{
        pathname: '/details/[mediaType]/[id]',
        params: { mediaType: item.mediaType, id: String(item.id) },
      }}
      asChild>
      <Pressable style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {rank ? (
            <ThemedText type="display" style={[styles.rank, { color: theme.surfaceStrong }]}>
              {rank}
            </ThemedText>
          ) : null}

          <Image
            source={{ uri: item.posterUrl ?? item.backdropUrl }}
            style={[styles.poster, { backgroundColor: theme.surfaceMuted }]}
            contentFit="cover"
            transition={200}
          />

          <View style={styles.copy}>
            <View style={styles.topLine}>
              <Tag label={item.mediaType === 'tv' ? 'Series' : 'Film'} tone="soft" />
              {item.voteAverage > 0 ? <RatingBadge score={item.voteAverage} /> : null}
            </View>

            <ThemedText type="subtitle" numberOfLines={2} style={styles.title}>
              {item.title}
            </ThemedText>

            <View style={styles.metaRow}>
              <Icon name="calendar" size={12} themeColor="textTertiary" />
              <ThemedText type="label" themeColor="textSecondary">
                {formatDate(item.releaseDate)}
              </ThemedText>
            </View>

            {!compact ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.overview}>
                {item.overview || 'Synopsis coming soon.'}
              </ThemedText>
            ) : null}
          </View>

          <Pressable
            hitSlop={8}
            onPress={(event) => {
              event.preventDefault();
              toggleWatchlist(item);
            }}
            style={[
              styles.watchlistButton,
              {
                backgroundColor: watchlisted ? theme.accent : theme.surfaceMuted,
                borderColor: watchlisted ? theme.accent : theme.border,
              },
            ]}>
            <Icon name="bookmark" size={16} color={watchlisted ? theme.onAccent : theme.textTertiary} />
          </Pressable>

          <View style={styles.chevron}>
            <Icon name="chevron-right" size={18} themeColor="textTertiary" />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.two,
    paddingRight: Spacing.three,
  },
  rank: {
    width: 30,
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 38,
  },
  poster: {
    width: 76,
    aspectRatio: 2 / 3,
    borderRadius: Radius.sm,
  },
  copy: {
    flex: 1,
    gap: Spacing.one,
    justifyContent: 'center',
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  overview: {
    marginTop: 2,
  },
  watchlistButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: -Spacing.one,
  },
});
