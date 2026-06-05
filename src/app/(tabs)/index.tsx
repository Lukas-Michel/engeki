import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { PosterCard } from '@/components/media/poster-card';
import { Screen, ScreenHeader } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { watchProgress, type WatchProgress } from '@/lib/library';
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

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return 'Late show';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Afternoon matinee';
  return 'Tonight on Engeki';
}

export default function HomeScreen() {
  const loadUpcomingMovies = useCallback(() => getUpcomingMovies(), []);
  const loadUpcomingTv = useCallback(() => getUpcomingTvSeasons(), []);
  const movies = useAsync(loadUpcomingMovies, fallbackUpcomingMovies);
  const shows = useAsync(loadUpcomingTv, fallbackUpcomingTv);
  const { isWatchlisted } = useWatchlist();
  const watchlistedMovies = movies.data.filter((item) => isWatchlisted(item.mediaType, item.id));
  const watchlistedShows = shows.data.filter((item) => isWatchlisted(item.mediaType, item.id));
  const upcomingLoading = movies.loading || shows.loading;
  const hasWatchlistedUpcoming = watchlistedMovies.length > 0 || watchlistedShows.length > 0;

  return (
    <Screen contentStyle={styles.screen}>
      <ScreenHeader title={greeting()} />

      <View style={styles.section}>
        <SectionHeader title="Continue watching" />
        {watchProgress.length === 0 ? (
          <EmptyState title="Nothing in progress" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rail}
            style={styles.edgeToEdge}>
            {watchProgress.map((item) => (
              <WatchingCard item={item} key={item.id} />
            ))}
          </ScrollView>
        )}
      </View>

      {!upcomingLoading && !hasWatchlistedUpcoming ? (
        <View style={styles.section}>
          <SectionHeader title="Upcoming" />
          <EmptyState title="No watchlisted titles" large />
        </View>
      ) : (
        <>
          <UpcomingSection title="Upcoming Films" items={watchlistedMovies} loading={movies.loading} />
          <UpcomingSection title="Upcoming Shows" items={watchlistedShows} loading={shows.loading} meta="subtitle" />
        </>
      )}
    </Screen>
  );
}

function WatchingCard({ item }: { item: WatchProgress }) {
  const theme = useTheme();
  const progress = item.episode / item.totalEpisodes;

  return (
    <View style={[styles.watchCard, { borderColor: theme.border }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.watchImage} contentFit="cover" transition={220} />
      <LinearGradient colors={['rgba(6,4,12,0.1)', 'rgba(6,4,12,0.92)']} style={StyleSheet.absoluteFill} />
      <View style={styles.watchBody}>
        <ThemedText type="smallBold" style={styles.watchTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        <View style={styles.watchMetaRow}>
          <ThemedText type="label" style={styles.watchMeta}>
            S{item.season} · E{item.episode} of {item.totalEpisodes}
          </ThemedText>
          <ThemedText type="label" style={styles.watchMeta}>
            {Math.round(progress * 100)}%
          </ThemedText>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.accentBright }]} />
        </View>
        <View style={styles.nextRow}>
          <Feather name="clock" size={11} color="rgba(255,255,255,0.7)" />
          <ThemedText type="label" style={styles.nextText}>
            Next episode {item.nextRelease}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

function UpcomingSection({
  title,
  items,
  loading,
  meta = 'date',
}: {
  title: string;
  items: MediaSummary[];
  loading: boolean;
  meta?: 'date' | 'subtitle';
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const itemWidth = (contentWidth - COLUMN_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
  const visibleItems = expanded ? items : items.slice(0, GRID_COLUMNS);

  return (
    <View style={styles.section}>
      <SectionHeader
        title={title}
        right={loading ? <ActivityIndicator size="small" color={theme.accent} /> : undefined}
        onSeeAll={items.length > GRID_COLUMNS ? () => setExpanded((value) => !value) : undefined}
        seeAllLabel={expanded ? 'Collapse' : 'See all'}
      />

      {items.length === 0 && !loading ? (
        <EmptyState title="No watchlisted titles" />
      ) : (
        <View style={styles.grid}>
          {visibleItems.map((item) => (
            <View key={`${item.mediaType}-${item.id}`} style={{ width: itemWidth }}>
              <PosterCard item={item} meta={meta} />
            </View>
          ))}
        </View>
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
    gap: Spacing.three,
  },
  grid: {
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

  /* Continue watching */
  watchCard: {
    width: 300,
    height: 178,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#111014',
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
