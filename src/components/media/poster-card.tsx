import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, type MediaSummary } from '@/lib/tmdb';

type PosterCardProps = {
  item: MediaSummary;
  /** Fixed width for horizontal rails; omit for flex grid items. */
  width?: number;
  meta?: 'date' | 'subtitle';
  badge?: string;
};

export const PosterCard = memo(function PosterCard({
  item,
  width,
  meta = 'date',
  badge,
}: PosterCardProps) {
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
            <Image source={imageUrl} style={styles.poster} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={styles.posterFallback}>
              <Icon name="film" size={24} themeColor="textTertiary" />
            </View>
          )}
          <LinearGradient
            colors={['rgba(6,3,4,0)', 'rgba(6,3,4,0.55)']}
            style={styles.scrim}
          />
          {badge ? (
            <View style={styles.badgeSlot}>
              <View style={[styles.badge, { backgroundColor: theme.accent }]}>
                <ThemedText style={[styles.badgeText, { color: theme.onAccent }]} numberOfLines={1}>
                  {badge}
                </ThemedText>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.copy}>
          <ThemedText type="label" themeColor="textTertiary" numberOfLines={1} style={styles.meta}>
            {metaText}
          </ThemedText>
        </View>
      </Pressable>
    </Link>
  );
});

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
  badgeSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: Spacing.two,
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
  },
  badge: {
    maxWidth: '100%',
    minHeight: 18,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 8,
    lineHeight: 10,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  copy: {
    marginTop: Spacing.one,
  },
  meta: {
    textAlign: 'center',
  },
});
