import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, type MediaSummary } from '@/lib/tmdb';

const CARD_WIDTH = Math.min(Dimensions.get('window').width - 88, 292);

type HeroCarouselProps = {
  items: MediaSummary[];
};

export function HeroCarousel({ items }: HeroCarouselProps) {
  const theme = useTheme();
  const [scrollX] = useState(() => new Animated.Value(0));
  const [activeIndex, setActiveIndex] = useState(0);
  const safeItems = useMemo(() => items.slice(0, 8), [items]);

  return (
    <View style={styles.wrapper}>
      <Animated.FlatList
        data={safeItems}
        keyExtractor={(item) => `${item.mediaType}-${item.id}`}
        horizontal
        snapToInterval={CARD_WIDTH + Spacing.three}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + Spacing.three));
          setActiveIndex(index);
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: Platform.OS !== 'web',
        })}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + Spacing.three),
            index * (CARD_WIDTH + Spacing.three),
            (index + 1) * (CARD_WIDTH + Spacing.three),
          ];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.92, 1, 0.92],
            extrapolate: 'clamp',
          });

          return (
            <Link
              href={{
                pathname: '/details/[mediaType]/[id]',
                params: { mediaType: item.mediaType, id: String(item.id) },
              }}
              asChild>
              <Pressable>
                <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                  <Image source={{ uri: item.backdropUrl ?? item.posterUrl }} style={styles.image} contentFit="cover" />
                  <View style={styles.scrim} />
                  <View style={styles.cardCopy}>
                    <View style={[styles.pill, { backgroundColor: theme.accent }]}>
                      <ThemedText type="code" style={styles.pillText}>
                        {item.subtitle}
                      </ThemedText>
                    </View>
                    <ThemedText type="subtitle" style={styles.title} numberOfLines={2}>
                      {item.title}
                    </ThemedText>
                    <ThemedText type="small" style={styles.meta} numberOfLines={1}>
                      {formatDate(item.releaseDate)} · {item.voteAverage.toFixed(1)} user score
                    </ThemedText>
                  </View>
                </Animated.View>
              </Pressable>
            </Link>
          );
        }}
      />
      <View style={styles.dots}>
        {safeItems.map((item, index) => (
          <View
            key={`${item.mediaType}-${item.id}-dot`}
            style={[
              styles.dot,
              {
                width: activeIndex === index ? 18 : 6,
                backgroundColor: activeIndex === index ? theme.accent : theme.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: -Spacing.three,
    gap: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    width: CARD_WIDTH,
    height: 396,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  cardCopy: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: Spacing.one,
    padding: Spacing.three,
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  pillText: {
    color: '#FFFFFF',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 34,
  },
  meta: {
    color: 'rgba(255,255,255,0.78)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
});
