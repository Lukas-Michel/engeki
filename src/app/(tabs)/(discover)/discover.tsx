import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  CurvedTransition,
  FadeIn,
  FadeOut,
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PosterCard } from '@/components/media/poster-card';
import { Screen } from '@/components/media/screen';
import { ThemedText } from '@/components/themed-text';
import { Icon, Tag } from '@/components/ui/kit';
import { Elevation, Fonts, MaxContentWidth, Radius, Spacing, TabBar } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { isConvexConfigured } from '@/lib/config';
import {
  fallbackTrending,
  formatDate,
  getPopular,
  getTopRated,
  getTrending,
  getUpcomingMovies,
  searchMulti,
  type MediaSummary,
  type MediaType,
} from '@/lib/tmdb';
import { mediaKey, useWatchlist } from '@/lib/watchlist';

import { api } from '../../../../convex/_generated/api';

const genreLabels: Record<number, string> = {
  12: 'Adventure',
  14: 'Fantasy',
  16: 'Animation',
  18: 'Drama',
  28: 'Action',
  35: 'Comedy',
  53: 'Thriller',
  80: 'Crime',
  878: 'Sci-Fi',
  9648: 'Mystery',
};

const INDICATOR_SLOT_WIDTH = 12;
const SEARCH_GRID_COLUMNS = 4;
const SEARCH_GRID_GAP = Spacing.two;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type DiscoverCategory = 'trending' | 'upcoming' | 'popular' | 'top-rated';
type DiscoverExclusion = {
  tmdbId: number;
  mediaType: MediaType;
};

const discoverCategories: { value: DiscoverCategory; label: string }[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'popular', label: 'Popular' },
  { value: 'top-rated', label: 'Top Rated' },
];

const mediaTypeOptions: { value: MediaType; label: string }[] = [
  { value: 'movie', label: 'Movies' },
  { value: 'tv', label: 'Shows' },
];

const filterWheelTransition = CurvedTransition.duration(280)
  .easingX(Easing.out(Easing.cubic))
  .easingY(Easing.out(Easing.cubic));

type DiscoverFilterItem =
  | { kind: 'category'; value: DiscoverCategory; label: string }
  | { kind: 'mediaType'; value: MediaType; label: string };

function rotateDiscoverCategories(value: DiscoverCategory) {
  const activeIndex = discoverCategories.findIndex((category) => category.value === value);

  return [
    ...discoverCategories.slice(activeIndex),
    ...discoverCategories.slice(0, activeIndex),
  ];
}

export default function DiscoverScreen() {
  return isConvexConfigured ? <ConnectedDiscoverScreen /> : <DiscoverContent exclusions={[]} />;
}

function ConnectedDiscoverScreen() {
  const exclusions = useQuery(api.watching.listDiscoverExclusions) ?? [];
  return <DiscoverContent exclusions={exclusions} />;
}

function DiscoverContent({ exclusions }: { exclusions: DiscoverExclusion[] }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarClearance =
    Math.max(insets.bottom, Spacing.three) +
    TabBar.bottomOffset +
    TabBar.buttonHeight +
    TabBar.verticalPadding * 2 +
    TabBar.contentGap;
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DiscoverCategory>('trending');
  const [mediaType, setMediaType] = useState<MediaType>('movie');
  const isSearching = query.trim().length > 0;
  const showCarousel = !isSearching;
  const loadItems = useCallback(() => {
    if (query.trim()) {
      return searchMulti(query);
    }

    switch (category) {
      case 'upcoming':
        return getUpcomingMovies();
      case 'popular':
        return getPopular(mediaType);
      case 'top-rated':
        return getTopRated(mediaType);
      default:
        return getTrending();
    }
  }, [category, mediaType, query]);
  const results = useAsync(loadItems, fallbackTrending);
  const { items: watchlistItems } = useWatchlist();
  const excludedKeys = useMemo(() => {
    const keys = new Set(
      watchlistItems.map((item) => mediaKey(item.mediaType, item.id)),
    );
    exclusions.forEach((item) => keys.add(mediaKey(item.mediaType, item.tmdbId)));
    return keys;
  }, [exclusions, watchlistItems]);
  const visibleItems = useMemo(
    () => results.data.filter((item) => !excludedKeys.has(mediaKey(item.mediaType, item.id))),
    [excludedKeys, results.data],
  );

  return (
    <Screen scroll={false}>
      <View
        style={[
          styles.content,
          { paddingBottom: tabBarClearance },
        ]}>
        <View style={[styles.search, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textTertiary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search titles, seasons, people…"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
            returnKeyType="search"
            style={[styles.input, { color: theme.text }]}
          />
          {results.loading && isSearching ? (
            <ActivityIndicator size="small" color={theme.accent} />
          ) : isSearching ? (
            <Feather name="x" size={18} color={theme.textTertiary} onPress={() => setQuery('')} />
          ) : null}
        </View>

        {isSearching ? (
          <ThemedText type="smallBold" style={styles.searchResultsLabel}>
            Search results
          </ThemedText>
        ) : (
          <View style={styles.discoverControls}>
            <DiscoverCategoryTabs
              value={category}
              mediaType={mediaType}
              loading={results.loading}
              onChange={setCategory}
              onMediaTypeChange={setMediaType}
            />
          </View>
        )}

        {results.error ? (
          <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
            <Feather name="alert-circle" size={15} color={theme.accent} />
            <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
              {results.error}
            </ThemedText>
          </View>
        ) : null}

        {visibleItems.length === 0 && !results.loading ? (
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <Feather name="film" size={22} color={theme.textTertiary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              {results.data.length > 0
                ? 'You are all caught up here.'
                : 'Nothing matched. Try a different title.'}
            </ThemedText>
          </View>
        ) : showCarousel ? (
          <DiscoverCarousel items={visibleItems} />
        ) : (
          <DiscoverPosterGrid items={visibleItems} />
        )}
      </View>
    </Screen>
  );
}

function DiscoverPosterGrid({ items }: { items: MediaSummary[] }) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const itemWidth =
    (contentWidth - SEARCH_GRID_GAP * (SEARCH_GRID_COLUMNS - 1)) / SEARCH_GRID_COLUMNS;

  return (
    <FlatList
      data={items}
      numColumns={SEARCH_GRID_COLUMNS}
      keyExtractor={(item) => `${item.mediaType}-${item.id}`}
      renderItem={({ item }) => (
        <View style={{ width: itemWidth }}>
          <PosterCard item={item} />
        </View>
      )}
      style={styles.gridScroller}
      contentContainerStyle={styles.posterGrid}
      columnWrapperStyle={styles.posterGridRow}
      showsVerticalScrollIndicator={false}
    />
  );
}

function DiscoverCategoryTabs({
  value,
  mediaType,
  loading,
  onChange,
  onMediaTypeChange,
}: {
  value: DiscoverCategory;
  mediaType: MediaType;
  loading: boolean;
  onChange: (value: DiscoverCategory) => void;
  onMediaTypeChange: (value: MediaType) => void;
}) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const orderedCategories = rotateDiscoverCategories(value);
  const [activeCategory, ...remainingCategories] = orderedCategories;
  const filters: DiscoverFilterItem[] = [
    { kind: 'category', ...activeCategory },
    ...(value === 'popular' || value === 'top-rated'
      ? mediaTypeOptions.map((option) => ({ kind: 'mediaType' as const, ...option }))
      : []),
    ...remainingCategories.map((category) => ({ kind: 'category' as const, ...category })),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: true });
  }, [value]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryTabs}>
      {filters.map((filter, index) => {
        const isActiveCategory = filter.kind === 'category' && filter.value === value;
        const isActiveMediaType = filter.kind === 'mediaType' && filter.value === mediaType;
        const previous = filters[index - 1];
        const marginLeft =
          index === 0
            ? 0
            : filter.kind === 'mediaType'
              ? Spacing.one
              : previous?.kind === 'mediaType'
                ? Spacing.three
                : Spacing.three;

        return (
          <AnimatedPressable
            key={`${filter.kind}-${filter.value}`}
            entering={filter.kind === 'mediaType' ? FadeIn.duration(180) : undefined}
            exiting={filter.kind === 'mediaType' ? FadeOut.duration(140) : undefined}
            layout={filterWheelTransition}
            onPress={() =>
              filter.kind === 'category'
                ? onChange(filter.value)
                : onMediaTypeChange(filter.value)
            }
            hitSlop={8}
            style={[
              styles.categoryTab,
              isActiveCategory && styles.categoryTabActive,
              { marginLeft },
            ]}>
            <ThemedText
              type={isActiveCategory ? 'heading' : isActiveMediaType ? 'smallBold' : 'small'}
              style={[
                isActiveCategory && styles.categoryTextActive,
                filter.kind === 'category' && !isActiveCategory && styles.categoryTextInactive,
                filter.kind === 'mediaType' && styles.mediaTypeText,
                {
                  color:
                    isActiveCategory || isActiveMediaType ? theme.text : theme.textSecondary,
                },
              ]}>
              {filter.label}
            </ThemedText>
          </AnimatedPressable>
        );
      })}
      {loading ? <ActivityIndicator size="small" color={theme.accent} /> : null}
    </ScrollView>
  );
}

function DiscoverCarousel({ items }: { items: MediaSummary[] }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const carouselItems = items.slice(0, 10);
  const dataKey = carouselItems.map((item) => `${item.mediaType}-${item.id}`).join(':');
  const [activeSlide, setActiveSlide] = useState({ dataKey, index: 0 });
  const slideWidth = Math.min(width - Spacing.three * 2, 520);
  const posterWidth = Math.min(252, Math.max(218, width * 0.62));
  const posterHeight = posterWidth * 1.5;
  const activeIndex = activeSlide.dataKey === dataKey ? activeSlide.index : 0;
  const safeActiveIndex = Math.min(activeIndex, carouselItems.length - 1);
  const activeItem = carouselItems[safeActiveIndex] ?? carouselItems[0];
  const watchlisted = activeItem ? isWatchlisted(activeItem.mediaType, activeItem.id) : false;
  const scrollOffset = useSharedValue(0);
  const lastReportedIndex = useSharedValue(0);
  const watchlistScale = useSharedValue(1);

  useEffect(() => {
    scrollOffset.set(0);
    lastReportedIndex.set(0);
  }, [dataKey, lastReportedIndex, scrollOffset]);

  const updateActiveIndex = (index: number) => {
    setActiveSlide({
      dataKey,
      index: Math.min(Math.max(index, 0), carouselItems.length - 1),
    });
  };

  const activeIndicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (scrollOffset.get() / slideWidth) * INDICATOR_SLOT_WIDTH },
    ],
  }));

  const watchlistAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: watchlistScale.get() }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.set(event.contentOffset.x);
      const nextIndex = Math.round(event.contentOffset.x / slideWidth);
      if (nextIndex !== lastReportedIndex.get()) {
        lastReportedIndex.set(nextIndex);
        runOnJS(updateActiveIndex)(nextIndex);
      }
    },
  });

  const handleWatchlistPress = () => {
    watchlistScale.set(
      withSequence(
        withTiming(0.92, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 9, stiffness: 220, mass: 0.6 }),
      ),
    );
    toggleWatchlist(activeItem);
  };

  if (!activeItem) {
    return null;
  }

  return (
    <View style={styles.carousel}>
      <View style={styles.feature}>
        <View
          style={[
            styles.indicator,
            { width: carouselItems.length * INDICATOR_SLOT_WIDTH },
          ]}>
          <Animated.View
            style={[
              styles.activeDot,
              { backgroundColor: theme.text },
              activeIndicatorStyle,
            ]}
          />
          {carouselItems.map((item) => (
            <View
              key={`${item.mediaType}-${item.id}`}
              style={styles.indicatorSlot}>
              <View style={[styles.dot, { backgroundColor: theme.borderStrong }]} />
            </View>
          ))}
        </View>

        <View style={[styles.posterStage, { height: posterHeight }]}>
          <AnimatedScrollView
            key={dataKey}
            horizontal
            pagingEnabled
            snapToInterval={slideWidth}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            style={styles.posterScroller}
            contentContainerStyle={styles.posterScrollerContent}>
            {carouselItems.map((item) => (
              <Link
                key={`${item.mediaType}-${item.id}`}
                href={{
                  pathname: '/details/[mediaType]/[id]',
                  params: { mediaType: item.mediaType, id: String(item.id) },
                }}
                asChild>
                <Pressable style={StyleSheet.flatten([styles.slide, { width: slideWidth }])}>
                  <Image
                    source={{ uri: item.posterUrl ?? item.backdropUrl }}
                    style={[
                      styles.mainPoster,
                      {
                        width: posterWidth,
                        height: posterHeight,
                        backgroundColor: theme.surfaceMuted,
                        borderColor: theme.border,
                      },
                    ]}
                    contentFit="cover"
                    transition={200}
                  />
                </Pressable>
              </Link>
            ))}
          </AnimatedScrollView>
        </View>

        <Animated.View
          key={`metadata-${activeItem.mediaType}-${activeItem.id}`}
          entering={FadeIn.duration(220)}
          style={styles.metadata}>
          <ThemedText type="label" themeColor="textSecondary" style={styles.release}>
            {formatDate(activeItem.releaseDate)}
          </ThemedText>

          <View style={styles.tags}>
            <Tag label={activeItem.mediaType === 'tv' ? 'Series' : 'Film'} tone="soft" />
            {getGenreTags(activeItem).map((genre) => (
              <Tag label={genre} tone="outline" key={genre} />
            ))}
          </View>
        </Animated.View>
      </View>

      <AnimatedPressable
        onPress={handleWatchlistPress}
        onPressIn={() => watchlistScale.set(withTiming(0.96, { duration: 90 }))}
        onPressOut={() =>
          watchlistScale.set(withSpring(1, { damping: 12, stiffness: 220, mass: 0.6 }))
        }
        style={[
          styles.watchlistButton,
          watchlistAnimatedStyle,
          {
            backgroundColor: watchlisted ? theme.accent : theme.accentSoft,
            borderColor: theme.accent,
          },
        ]}>
        <Icon name="bookmark" size={17} color={watchlisted ? theme.onAccent : theme.accent} />
        <ThemedText type="smallBold" style={{ color: watchlisted ? theme.onAccent : theme.accent }}>
          {watchlisted ? 'In Watchlist' : 'Add to Watchlist'}
        </ThemedText>
      </AnimatedPressable>
    </View>
  );
}

function getGenreTags(item: MediaSummary) {
  return item.genreIds
    .map((id) => genreLabels[id])
    .filter((label): label is string => Boolean(label))
    .slice(0, 2);
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    height: '100%',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Platform.select({ ios: Spacing.two, android: Spacing.three }),
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope_500Medium',
  },
  searchResultsLabel: {
    alignSelf: 'center',
  },
  discoverControls: {
    width: '100%',
  },
  categoryTabs: {
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
    paddingRight: Spacing.four,
  },
  categoryTab: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
  categoryTabActive: {
    minHeight: 36,
  },
  categoryTextActive: {
    fontFamily: Fonts.bodyExtra,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.7,
  },
  categoryTextInactive: {
    fontSize: 16,
    lineHeight: 22,
  },
  mediaTypeText: {
    fontSize: 12,
    lineHeight: 17,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
  },
  gridScroller: {
    flex: 1,
    width: '100%',
  },
  posterGrid: {
    paddingBottom: Spacing.three,
  },
  posterGridRow: {
    gap: SEARCH_GRID_GAP,
    marginBottom: Spacing.three,
  },
  carousel: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  feature: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 0,
    paddingTop: Platform.select({ ios: Spacing.one, android: Spacing.two }),
  },
  posterStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  indicator: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    height: 5,
    marginBottom: Spacing.three,
  },
  indicatorSlot: {
    width: INDICATOR_SLOT_WIDTH,
    height: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
  },
  activeDot: {
    position: 'absolute',
    zIndex: 1,
    left: -2,
    width: 16,
    height: 5,
    borderRadius: Radius.pill,
  },
  posterScroller: {
    zIndex: 3,
    width: '100%',
  },
  posterScrollerContent: {
    alignItems: 'flex-end',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mainPoster: {
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  metadata: {
    alignItems: 'center',
    gap: Spacing.two,
    width: '100%',
    marginTop: Spacing.two,
  },
  release: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 19,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.one,
    maxWidth: 340,
  },
  watchlistButton: {
    minWidth: 186,
    height: 46,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    ...Elevation.card,
  },
});
