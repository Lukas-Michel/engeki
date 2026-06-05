import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, type MediaSummary } from '@/lib/tmdb';

const SCREEN_WIDTH = Dimensions.get('window').width;
const POSTER_WIDTH = Math.min(SCREEN_WIDTH * 0.58, 238);
const POSTER_HEIGHT = POSTER_WIDTH * 1.48;
const SLIDE_GAP = Spacing.four;
const SNAP_INTERVAL = POSTER_WIDTH + SLIDE_GAP;
const SIDE_INSET = Math.max((SCREEN_WIDTH - POSTER_WIDTH) / 2, Spacing.three);

type HeroCarouselProps = {
  items: MediaSummary[];
};

type Action = 'watchlist' | 'tracking' | 'notify';

const actionCopy: Record<Action, { idle: string; active: string }> = {
  watchlist: { idle: '+ Watchlist', active: 'In watchlist' },
  tracking: { idle: 'Track', active: 'Tracking' },
  notify: { idle: 'Notify', active: 'Notifying' },
};

export function HeroCarousel({ items }: HeroCarouselProps) {
  const theme = useTheme();
  const [scrollX] = useState(() => new Animated.Value(0));
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeActions, setActiveActions] = useState<Record<string, Partial<Record<Action, boolean>>>>({});
  const safeItems = useMemo(() => items.slice(0, 8), [items]);
  const activeItem = safeItems[activeIndex] ?? safeItems[0];
  const activeKey = activeItem ? `${activeItem.mediaType}-${activeItem.id}` : '';
  const imageUrl = activeItem?.backdropUrl ?? activeItem?.posterUrl;

  const toggleAction = (action: Action) => {
    setActiveActions((current) => ({
      ...current,
      [activeKey]: {
        ...current[activeKey],
        [action]: !current[activeKey]?.[action],
      },
    }));
  };

  if (!activeItem) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <Image source={{ uri: imageUrl }} style={styles.backdrop} contentFit="cover" blurRadius={36} />
      <View style={[styles.ambientOverlay, { backgroundColor: theme.background }]} />
      <View style={styles.topCopy}>
        <ThemedText type="code" themeColor="textSecondary" style={styles.kicker}>
          TRENDING THIS WEEK
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Swipe the poster rail. Actions below apply to the centered title.
        </ThemedText>
      </View>

      <Animated.FlatList
        data={safeItems}
        keyExtractor={(item) => `${item.mediaType}-${item.id}`}
        horizontal
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
          setActiveIndex(Math.min(Math.max(index, 0), safeItems.length - 1));
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: Platform.OS !== 'web',
        })}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => {
          const inputRange = [(index - 1) * SNAP_INTERVAL, index * SNAP_INTERVAL, (index + 1) * SNAP_INTERVAL];
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.82, 1, 0.82],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.42, 1, 0.42],
            extrapolate: 'clamp',
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [22, 0, 22],
            extrapolate: 'clamp',
          });

          return (
            <Link
              href={{
                pathname: '/details/[mediaType]/[id]',
                params: { mediaType: item.mediaType, id: String(item.id) },
              }}
              asChild>
              <Pressable style={styles.slide}>
                <Animated.View style={[styles.posterFrame, { opacity, transform: [{ translateY }, { scale }] }]}>
                  <Image source={{ uri: item.posterUrl ?? item.backdropUrl }} style={styles.poster} contentFit="cover" />
                  <View style={styles.posterShade} />
                  <TrendingReason item={item} index={index} />
                </Animated.View>
              </Pressable>
            </Link>
          );
        }}
      />

      <View style={styles.activeCopy}>
        <ThemedText type="subtitle" style={styles.activeTitle} numberOfLines={2}>
          {activeItem.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {activeItem.subtitle} · {formatDate(activeItem.releaseDate)} · {getTrendReason(activeItem, activeIndex)}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        {(Object.keys(actionCopy) as Action[]).map((action) => {
          const selected = Boolean(activeActions[activeKey]?.[action]);

          return (
            <Pressable
              key={action}
              onPress={() => toggleAction(action)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: selected ? theme.accent : 'rgba(255,255,255,0.12)',
                  borderColor: selected ? theme.accent : theme.border,
                },
              ]}>
              <ThemedText type="smallBold" style={{ color: selected ? '#FFFFFF' : theme.text }}>
                {selected ? actionCopy[action].active : actionCopy[action].idle}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dots}>
        {safeItems.map((item, index) => (
          <View
            key={`${item.mediaType}-${item.id}-dot`}
            style={[
              styles.dot,
              {
                width: activeIndex === index ? 24 : 7,
                backgroundColor: activeIndex === index ? theme.accent : theme.border,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function TrendingReason({ item, index }: { item: MediaSummary; index: number }) {
  return (
    <View style={styles.reasonOverlay}>
      <View style={styles.rank}>
        <ThemedText type="code" style={styles.rankText}>
          #{index + 1}
        </ThemedText>
      </View>
      <View style={styles.heat}>
        {[0, 1, 2, 3].map((bar) => (
          <View
            key={bar}
            style={[
              styles.heatBar,
              {
                height: 8 + bar * 5,
                opacity: item.voteAverage > 6 + bar * 0.55 ? 1 : 0.34,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function getTrendReason(item: MediaSummary, index: number) {
  if (index < 3) {
    return 'top movement';
  }

  if (item.mediaType === 'tv') {
    return 'new episodes drawing attention';
  }

  return 'high watchlist velocity';
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: -Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    overflow: 'hidden',
    gap: Spacing.three,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    opacity: 0.72,
    transform: [{ scale: 1.18 }],
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.76,
  },
  topCopy: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.one,
  },
  kicker: {
    letterSpacing: 1.8,
  },
  list: {
    paddingHorizontal: SIDE_INSET,
    gap: SLIDE_GAP,
    alignItems: 'center',
  },
  slide: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT + Spacing.four,
    justifyContent: 'center',
  },
  posterFrame: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: '#111111',
    ...Platform.select({
      web: {
        boxShadow: '0 18px 34px rgba(0, 0, 0, 0.34)',
      },
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.36,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 18 },
        elevation: 8,
      },
    }),
  },
  poster: {
    ...StyleSheet.absoluteFill,
  },
  posterShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  reasonOverlay: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    right: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rank: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  rankText: {
    color: '#FFFFFF',
  },
  heat: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: 'rgba(0,0,0,0.46)',
  },
  heatBar: {
    width: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  activeCopy: {
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
  },
  activeTitle: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 35,
  },
  actions: {
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
});
