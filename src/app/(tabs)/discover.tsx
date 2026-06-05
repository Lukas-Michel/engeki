import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { Screen } from '@/components/media/screen';
import { ThemedText } from '@/components/themed-text';
import { Icon, RatingBadge, Tag } from '@/components/ui/kit';
import { Elevation, Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { fallbackTrending, formatDate, searchMulti, type MediaSummary } from '@/lib/tmdb';
import { useWatchlist } from '@/lib/watchlist';

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

export default function DiscoverScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const loadSearch = useCallback(() => searchMulti(query), [query]);
  const search = useAsync(loadSearch, fallbackTrending);
  const isSearching = query.trim().length > 0;

  return (
    <Screen contentStyle={styles.content}>
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
        {search.loading ? (
          <ActivityIndicator size="small" color={theme.accent} />
        ) : isSearching ? (
          <Feather name="x" size={18} color={theme.textTertiary} onPress={() => setQuery('')} />
        ) : null}
      </View>

      {search.error ? (
        <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
          <Feather name="alert-circle" size={15} color={theme.accent} />
          <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
            {search.error}
          </ThemedText>
        </View>
      ) : null}

      {search.data.length === 0 && !search.loading ? (
        <View style={[styles.empty, { borderColor: theme.border }]}>
          <Feather name="film" size={22} color={theme.textTertiary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Nothing matched. Try a different title.
          </ThemedText>
        </View>
      ) : (
        <TrendingCarousel items={search.data} label={isSearching ? 'Search results' : 'Trending now'} />
      )}
    </Screen>
  );
}

function TrendingCarousel({ items, label }: { items: MediaSummary[]; label: string }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { isWatchlisted, toggleWatchlist } = useWatchlist();
  const [activeIndex, setActiveIndex] = useState(0);
  const slideWidth = Math.min(width - Spacing.three * 2, 520);
  const posterWidth = Math.min(208, Math.max(164, width * 0.48));
  const posterHeight = posterWidth * 1.5;
  const sideWidth = posterWidth * 0.74;
  const sideHeight = sideWidth * 1.5;
  const safeActiveIndex = Math.min(activeIndex, items.length - 1);
  const activeItem = items[safeActiveIndex] ?? items[0];
  const prevItem = items[(safeActiveIndex - 1 + items.length) % items.length];
  const nextItem = items[(safeActiveIndex + 1) % items.length];
  const watchlisted = activeItem ? isWatchlisted(activeItem.mediaType, activeItem.id) : false;
  const dataKey = items.map((item) => `${item.mediaType}-${item.id}`).join(':');

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), items.length - 1));
  };

  if (!activeItem) {
    return null;
  }

  return (
    <View style={styles.carousel}>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.carouselLabel}>
        {label}
      </ThemedText>

      <View style={[styles.posterStage, { height: posterHeight + 54 }]}>
        <View style={styles.indicator}>
          {items.map((item, index) => (
            <View
              key={`${item.mediaType}-${item.id}`}
              style={[
                styles.dot,
                {
                  backgroundColor: index === safeActiveIndex ? theme.text : theme.borderStrong,
                  width: index === safeActiveIndex ? 16 : 5,
                },
              ]}
            />
          ))}
        </View>

        {items.length > 1 ? (
          <>
            <Image
              source={{ uri: prevItem.posterUrl ?? prevItem.backdropUrl }}
              style={[
                styles.sidePoster,
                styles.leftPoster,
                {
                  width: sideWidth,
                  height: sideHeight,
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
              contentFit="cover"
              transition={200}
            />
            <Image
              source={{ uri: nextItem.posterUrl ?? nextItem.backdropUrl }}
              style={[
                styles.sidePoster,
                styles.rightPoster,
                {
                  width: sideWidth,
                  height: sideHeight,
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
              contentFit="cover"
              transition={200}
            />
          </>
        ) : null}

        <ScrollView
          key={dataKey}
          horizontal
          pagingEnabled
          snapToInterval={slideWidth}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumEnd}
          style={styles.posterScroller}
          contentContainerStyle={styles.posterScrollerContent}>
          {items.map((item) => (
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
        </ScrollView>
      </View>

      <View style={styles.copy}>
        <ThemedText type="label" themeColor="textSecondary" style={styles.release}>
          {formatDate(activeItem.releaseDate)}
        </ThemedText>
        <ThemedText type="subtitle" numberOfLines={2} style={styles.title}>
          {activeItem.title}
        </ThemedText>

        <View style={styles.tags}>
          <Tag label={activeItem.mediaType === 'tv' ? 'Series' : 'Film'} tone="soft" />
          {getGenreTags(activeItem).map((genre) => (
            <Tag label={genre} tone="outline" key={genre} />
          ))}
          {activeItem.voteAverage > 0 ? <RatingBadge score={activeItem.voteAverage} /> : null}
        </View>

        <Pressable
          onPress={() => toggleWatchlist(activeItem)}
          style={({ pressed }) => [
            styles.watchlistButton,
            {
              backgroundColor: watchlisted ? theme.accent : theme.surface,
              borderColor: watchlisted ? theme.accent : theme.border,
            },
            pressed && styles.pressed,
          ]}>
          <Icon name="bookmark" size={17} color={watchlisted ? theme.onAccent : theme.accent} />
          <ThemedText type="smallBold" style={{ color: watchlisted ? theme.onAccent : theme.accent }}>
            {watchlisted ? 'In Watchlist' : 'Add to Watchlist'}
          </ThemedText>
        </Pressable>
      </View>
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
    gap: Spacing.four,
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
  carousel: {
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  carouselLabel: {
    alignSelf: 'flex-start',
  },
  posterStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    height: 5,
    borderRadius: Radius.pill,
  },
  sidePoster: {
    position: 'absolute',
    top: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    opacity: 0.72,
  },
  leftPoster: {
    left: 20,
    transform: [{ rotate: '-5deg' }, { scale: 0.98 }],
  },
  rightPoster: {
    right: 20,
    transform: [{ rotate: '5deg' }, { scale: 0.98 }],
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
    ...Elevation.floating,
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    width: '100%',
  },
  release: {
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
    maxWidth: 340,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    maxWidth: 340,
  },
  watchlistButton: {
    marginTop: Spacing.one,
    minWidth: 186,
    height: 46,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
