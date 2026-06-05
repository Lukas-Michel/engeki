import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, FlatList, Platform, Pressable, StyleSheet, View, type ListRenderItem } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, type MediaSummary } from '@/lib/tmdb';

const SCREEN_WIDTH = Dimensions.get('window').width;
const POSTER_WIDTH = Math.min(SCREEN_WIDTH * 0.7, 292);
const POSTER_HEIGHT = POSTER_WIDTH * 1.48;
const MAX_ITEMS = 10;

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeActions, setActiveActions] = useState<Record<string, Partial<Record<Action, boolean>>>>({});
  const safeItems = useMemo(() => items.slice(0, MAX_ITEMS), [items]);
  const safeActiveIndex = getWrappedIndex(activeIndex, safeItems.length);
  const activeItem = safeItems[safeActiveIndex];
  const activeKey = activeItem ? `${activeItem.mediaType}-${activeItem.id}` : '';

  const toggleAction = (action: Action) => {
    setActiveActions((current) => ({
      ...current,
      [activeKey]: {
        ...current[activeKey],
        [action]: !current[activeKey]?.[action],
      },
    }));
  };

  const renderPoster: ListRenderItem<MediaSummary> = useCallback(
    ({ item, index }) => (
      <View style={styles.slide}>
        <Link
          href={{
            pathname: '/details/[mediaType]/[id]',
            params: { mediaType: item.mediaType, id: String(item.id) },
          }}
          asChild>
          <Pressable style={styles.posterFrame}>
            <Image source={{ uri: item.posterUrl ?? item.backdropUrl }} style={styles.poster} contentFit="cover" />
            <View style={styles.posterShade} />
            <TrendingReason item={item} index={index} />
          </Pressable>
        </Link>
      </View>
    ),
    []
  );

  if (!activeItem) {
    return null;
  }

  return (
    <View style={styles.shell}>
      <View style={styles.topCopy}>
        <ThemedText type="heading" style={[styles.kicker, { color: theme.danger }]}>
          Trending
        </ThemedText>
        <View style={styles.dots}>
          {safeItems.map((item, index) => (
            <View
              key={`${item.mediaType}-${item.id}-dot`}
              style={[
                styles.dot,
                {
                  width: safeActiveIndex === index ? 24 : 7,
                  backgroundColor: safeActiveIndex === index ? theme.danger : theme.border,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={safeItems}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
        })}
        horizontal
        keyExtractor={(item) => `${item.mediaType}-${item.id}`}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(Math.min(Math.max(index, 0), safeItems.length - 1));
        }}
        pagingEnabled
        renderItem={renderPoster}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
      />

      <View style={styles.activeCopy}>
        <ThemedText type="subtitle" style={styles.activeTitle} numberOfLines={2}>
          {activeItem.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
          {activeItem.subtitle} · {formatDate(activeItem.releaseDate)} · {getTrendReason(activeItem, safeActiveIndex)}
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

function getWrappedIndex(index: number, length: number) {
  if (length <= 0) {
    return 0;
  }

  return ((index % length) + length) % length;
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: -Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.four,
    overflow: 'hidden',
    gap: Spacing.three,
  },
  topCopy: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  kicker: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  slide: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
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
    alignItems: 'center',
    gap: Spacing.one,
  },
  dot: {
    height: 7,
    borderRadius: 999,
  },
});
