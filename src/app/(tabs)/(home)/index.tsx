import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { CurvedTransition, Easing } from 'react-native-reanimated';

import { api } from '../../../../convex/_generated/api';

import { PosterCard } from '@/components/media/poster-card';
import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { isConvexConfigured } from '@/lib/config';
import {
  fallbackUpcomingMovies,
  fallbackUpcomingTv,
  getUpcomingMovies,
  getUpcomingTvSeasons,
  type MediaSummary,
} from '@/lib/tmdb';
import { useWatchlist } from '@/lib/watchlist';

const COLUMN_GAP = 12;
const GRID_COLUMNS = 3;

export default function HomeScreen() {
  const { items: watchlistItems, isWatchlisted } = useWatchlist();
  const watchlistedTv = useMemo(
    () => watchlistItems.filter((item) => item.mediaType === 'tv'),
    [watchlistItems],
  );
  const loadUpcomingMovies = useCallback(() => getUpcomingMovies(), []);
  const loadUpcomingTv = useCallback(() => getUpcomingTvSeasons(watchlistedTv), [watchlistedTv]);
  const movies = useAsync(loadUpcomingMovies, fallbackUpcomingMovies);
  const shows = useAsync(loadUpcomingTv, fallbackUpcomingTv);
  const watchlistedMovies = movies.data.filter((item) => isWatchlisted(item.mediaType, item.id));
  const watchlistedShows = shows.data.filter((item) => isWatchlisted(item.mediaType, item.id));
  const upcomingLoading = movies.loading || shows.loading;
  const hasWatchlistedUpcoming = watchlistedMovies.length > 0 || watchlistedShows.length > 0;

  return (
    <Screen contentStyle={styles.screen}>
      <ContinueWatchingSection />

      {!upcomingLoading && !hasWatchlistedUpcoming ? (
        <View style={styles.section}>
          <SectionHeader title="Upcoming" />
          <EmptyState title="No watchlisted titles" large />
        </View>
      ) : (
        <>
          <UpcomingSection title="Upcoming Films" items={watchlistedMovies} loading={movies.loading} />
          <UpcomingSection
            title="Upcoming Shows"
            items={watchlistedShows}
            loading={shows.loading}
            showReleaseBadge
          />
        </>
      )}
    </Screen>
  );
}

type WatchingItem = {
  id: string;
  tmdbId: number;
  mediaType: 'tv';
  title: string;
  posterUrl?: string;
  backdropUrl?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  watchedEpisodes: number;
  totalEpisodes: number;
};

function ContinueWatchingSection() {
  if (!isConvexConfigured) {
    return (
      <View style={styles.section}>
        <SectionHeader title="Up Next" />
        <EmptyState title="Nothing in progress" />
      </View>
    );
  }

  return <ConnectedContinueWatching />;
}

function ConnectedContinueWatching() {
  const theme = useTheme();
  const items = useQuery(api.watching.listWatching);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Up Next"
        right={items === undefined ? <ActivityIndicator size="small" color={theme.accent} /> : undefined}
      />
      {items?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          style={styles.edgeToEdge}>
          {items.map((item) => (
            <WatchingCard item={item as WatchingItem} key={item.id} />
          ))}
        </ScrollView>
      ) : items === undefined ? null : (
        <EmptyState title="Nothing in progress" />
      )}
    </View>
  );
}

function WatchingCard({ item }: { item: WatchingItem }) {
  const theme = useTheme();
  const progress = item.totalEpisodes > 0 ? item.watchedEpisodes / item.totalEpisodes : 0;
  const imageUrl = item.backdropUrl ?? item.posterUrl;
  const progressLabel =
    item.seasonNumber !== undefined && item.episodeNumber !== undefined
      ? `S${item.seasonNumber} · E${item.episodeNumber} watched`
      : 'Not started';

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/details/[mediaType]/[id]',
          params: { mediaType: 'tv', id: String(item.tmdbId) },
        })
      }
      style={({ pressed }) => [
        styles.watchCard,
        { borderColor: theme.border },
        pressed && styles.watchCardPressed,
      ]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.watchImage} contentFit="cover" transition={220} />
      ) : null}
      <LinearGradient colors={['rgba(6,4,12,0.1)', 'rgba(6,4,12,0.92)']} style={StyleSheet.absoluteFill} />
      <View style={styles.watchBody}>
        <ThemedText type="smallBold" style={styles.watchTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <View style={styles.watchMetaRow}>
          <ThemedText type="label" style={styles.watchMeta}>
            {progressLabel}
          </ThemedText>
          <ThemedText type="label" style={styles.watchMeta}>
            {Math.round(progress * 100)}%
          </ThemedText>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.accentBright }]} />
        </View>
        <View style={styles.nextRow}>
          <Feather name="check-circle" size={11} color="rgba(255,255,255,0.7)" />
          <ThemedText type="label" style={styles.nextText}>
            {item.watchedEpisodes} of {item.totalEpisodes} episodes
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

function UpcomingSection({
  title,
  items,
  loading,
  showReleaseBadge = false,
}: {
  title: string;
  items: MediaSummary[];
  loading: boolean;
  showReleaseBadge?: boolean;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const itemWidth = (contentWidth - COLUMN_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        right={loading ? <ActivityIndicator size="small" color={theme.accent} /> : undefined}
        onSeeAll={items.length > GRID_COLUMNS ? () => setExpanded((value) => !value) : undefined}
        seeAllLabel={expanded ? 'See less' : 'See all'}
        expanded={expanded}
      />

      {items.length === 0 && !loading ? (
        <EmptyState title="No watchlisted titles" />
      ) : (
        <ScrollView
          horizontal
          scrollEnabled={!expanded}
          showsHorizontalScrollIndicator={false}
          style={expanded ? undefined : styles.edgeToEdge}
          contentContainerStyle={expanded ? [styles.gridContent, { width: contentWidth }] : styles.rail}>
          {items.map((item) => (
            <Animated.View
              key={`${item.mediaType}-${item.id}`}
              layout={CurvedTransition.duration(180)
                .easingX(Easing.out(Easing.cubic))
                .easingY(Easing.out(Easing.cubic))}
              style={{ width: itemWidth }}>
              <PosterCard item={item} badge={showReleaseBadge ? item.subtitle : undefined} />
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function EmptyState({ title, large = false }: { title: string; large?: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.empty, large && styles.emptyLarge, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <Feather name="bookmark" size={large ? 28 : 20} color={theme.textTertiary} />
      <ThemedText type={large ? 'heading' : 'smallBold'}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.five,
  },
  section: {
    gap: Spacing.three,
  },
  edgeToEdge: {
    marginHorizontal: -Spacing.three,
  },
  rail: {
    paddingHorizontal: Spacing.three,
    gap: COLUMN_GAP,
  },
  gridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COLUMN_GAP,
    rowGap: Spacing.four,
  },
  empty: {
    minHeight: 112,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  emptyLarge: {
    minHeight: 180,
  },

  /* Up Next */
  watchCard: {
    width: 300,
    height: 178,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#111014',
  },
  watchCardPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  watchImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  watchBody: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  watchTitle: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  watchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  watchMeta: {
    color: 'rgba(255,255,255,0.78)',
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.24)',
    marginTop: 2,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  nextText: {
    color: 'rgba(255,255,255,0.7)',
  },
});
