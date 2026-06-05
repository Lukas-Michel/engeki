import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon, RatingBadge } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, type MediaSummary } from '@/lib/tmdb';

type PosterCardProps = {
  item: MediaSummary;
  /** Fixed width for horizontal rails; omit for flex grid items. */
  width?: number;
  meta?: 'date' | 'subtitle';
};

export function PosterCard({ item, width, meta = 'date' }: PosterCardProps) {
  const theme = useTheme();
  const metaText = meta === 'subtitle' ? item.subtitle : formatDate(item.releaseDate);
  const imageUrl = item.posterUrl;

  return (
    <Link
      href={{
        pathname: '/details/[mediaType]/[id]',
        params: { mediaType: item.mediaType, id: String(item.id) },
      }}
      asChild>
      <Pressable
        accessibilityLabel={item.title}
        style={({ pressed }) => [width ? { width } : styles.flex, pressed && styles.pressed]}>
        <View style={[styles.posterWrap, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.poster} contentFit="cover" transition={220} />
          ) : (
            <View style={styles.posterFallback}>
              <Icon name="film" size={24} themeColor="textTertiary" />
            </View>
          )}
          <LinearGradient
            colors={['rgba(6,4,12,0)', 'rgba(6,4,12,0.55)']}
            style={styles.scrim}
          />
          {item.voteAverage > 0 ? (
            <View style={styles.ratingSlot}>
              <RatingBadge score={item.voteAverage} onDark />
            </View>
          ) : null}
        </View>

        <View style={styles.copy}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText type="label" themeColor="textTertiary" numberOfLines={1}>
            {metaText}
          </ThemedText>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  posterWrap: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  poster: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  posterFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  ratingSlot: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
  },
  copy: {
    marginTop: Spacing.two,
    gap: 2,
  },
});
