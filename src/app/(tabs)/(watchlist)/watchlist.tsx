import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    View,
    type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, ScreenHeader } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { Icon, SegmentedControl } from '@/components/ui/kit';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWatchlist, type WatchlistItem } from '@/lib/watchlist';

type MediaFilter = 'all' | 'movie' | 'tv';
type GridItem = WatchlistItem | null;

const filterOptions: { value: MediaFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Series' },
];

export default function WatchlistScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { items, isLoading, toggleWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<MediaFilter>('all');
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const today = getLocalDateKey();

  const releasedItems = useMemo(
    () =>
      items
        .filter((item) => item.releaseDate !== undefined && item.releaseDate <= today)
        .sort((a, b) => b.addedAt - a.addedAt),
    [items, today],
  );
  const movieCount = releasedItems.filter((item) => item.mediaType === 'movie').length;
  const showCount = releasedItems.length - movieCount;
  const activeFilter =
    (filter === 'movie' && movieCount === 0) || (filter === 'tv' && showCount === 0)
      ? 'all'
      : filter;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredItems = useMemo(
    () =>
      releasedItems.filter(
        (item) =>
          (activeFilter === 'all' || item.mediaType === activeFilter) &&
          (normalizedQuery.length === 0 || item.title.toLocaleLowerCase().includes(normalizedQuery)),
      ),
    [activeFilter, normalizedQuery, releasedItems],
  );

  const columns = Platform.OS === 'web' ? 5 : 3;
  const gridItems = useMemo<GridItem[]>(() => {
    const visibleItems = expanded ? filteredItems : filteredItems.slice(0, columns);
    if (visibleItems.length === 0) {
      return [];
    }

    const missingCells = (columns - (visibleItems.length % columns)) % columns;
    return [...visibleItems, ...Array<GridItem>(missingCells).fill(null)];
  }, [columns, expanded, filteredItems]);
  const showSearch = releasedItems.length > 12 || query.length > 0;
  const showFilters = movieCount > 0 && showCount > 0;
  const resultLabel =
    activeFilter === 'movie'
      ? 'Released films'
      : activeFilter === 'tv'
        ? 'Released series'
        : 'Available';

  const renderItem = useCallback<ListRenderItem<GridItem>>(
    ({ item }) => (
      <View style={styles.cardCell}>
        {item ? <WatchlistCard item={item} onRemove={() => toggleWatchlist(item)} /> : null}
      </View>
    ),
    [toggleWatchlist],
  );

  const header = (
    <View style={styles.header}>
      <ScreenHeader
        title="Watchlist"
        titleStyle={styles.watchlistTitle}
        right={
          <View style={[styles.headerIcon, { backgroundColor: theme.accentSoft }]}>
            <MaterialCommunityIcons name="popcorn" size={22} color={theme.accent} />
          </View>
        }
      />

      {showSearch ? (
        <View
          style={[
            styles.search,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}>
          <Icon name="search" size={17} themeColor="textTertiary" />
          <TextInput
            accessibilityLabel="Search watchlist"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(value) => {
              setQuery(value);
              setExpanded(false);
            }}
            placeholder="Search your watchlist"
            placeholderTextColor={theme.textTertiary}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.text }]}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              hitSlop={8}
              onPress={() => {
                setQuery('');
                setExpanded(false);
              }}>
              <Icon name="x-circle" size={17} themeColor="textTertiary" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showFilters ? (
        <SegmentedControl
          options={filterOptions}
          value={activeFilter}
          onChange={(value) => {
            setFilter(value);
            setExpanded(false);
          }}
        />
      ) : null}

      {releasedItems.length > 0 ? (
        <SectionHeader
          title={resultLabel}
          onSeeAll={
            filteredItems.length > columns ? () => setExpanded((value) => !value) : undefined
          }
          seeAllLabel={expanded ? 'Show less' : 'View all'}
          expanded={expanded}
        />
      ) : null}
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList
        key={columns}
        data={gridItems}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item ? `${item.mediaType}:${item.id}` : `grid-spacer:${index}`
        }
        numColumns={columns}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={styles.loading} color={theme.accent} />
          ) : (
            <WatchlistEmpty
              hasReleasedItems={releasedItems.length > 0}
              hasSavedItems={items.length > 0}
              filter={activeFilter}
            />
          )
        }
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
          },
        ]}
        initialNumToRender={8}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        maxToRenderPerBatch={8}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        removeClippedSubviews={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        style={styles.list}
      />
    </Screen>
  );
}

function WatchlistCard({ item, onRemove }: {
  item: WatchlistItem;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const releaseLabel = formatReleaseDate(item.releaseDate);

  return (
    <Link
      href={{
        pathname: '/details/[mediaType]/[id]',
        params: { mediaType: item.mediaType, id: String(item.id) },
      }}
      asChild>
      <Pressable
        accessibilityLabel={`${item.title}, ${item.mediaType === 'movie' ? 'film' : 'series'}`}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View
          style={[
            styles.posterWrap,
            { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
          ]}>
          {item.posterUrl ? (
            <Image
              source={item.posterUrl}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={`${item.mediaType}:${item.id}`}
              transition={160}
            />
          ) : (
            <View style={styles.posterFallback}>
              <Icon name="film" size={28} themeColor="textTertiary" />
            </View>
          )}
          <LinearGradient
            colors={['rgba(6,3,4,0)', 'rgba(6,3,4,0.76)']}
            style={styles.posterScrim}
          />
          <View style={styles.mediaType}>
            <ThemedText type="caption" style={styles.mediaTypeText}>
              {item.mediaType === 'movie' ? 'Film' : 'Series'}
            </ThemedText>
          </View>
          <Pressable
            accessibilityLabel={`Remove ${item.title} from watchlist`}
            hitSlop={8}
            onPress={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onRemove();
            }}
            style={({ pressed }) => [
              styles.removeButton,
              { backgroundColor: pressed ? theme.accentBright : theme.accent },
            ]}
          />
        </View>

        <ThemedText
          type="label"
          numberOfLines={1}
          style={styles.cardTitle}>
          {releaseLabel}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

function WatchlistEmpty({
  hasReleasedItems,
  hasSavedItems,
  filter,
}: {
  hasReleasedItems: boolean;
  hasSavedItems: boolean;
  filter: MediaFilter;
}) {
  const theme = useTheme();
  const filteredLabel = filter === 'movie' ? 'films' : filter === 'tv' ? 'series' : 'titles';

  const title = hasReleasedItems
    ? `No matching ${filteredLabel}`
    : hasSavedItems
      ? 'Nothing is ready yet'
      : 'Your watchlist is clear';
  const subtitle = hasReleasedItems
    ? 'Try another filter or search term.'
    : hasSavedItems
      ? 'Upcoming and undated saves will appear here once they release.'
      : 'Save a film or series and it will appear here after release.';

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={hasSavedItems ? 'clock' : 'bookmark'} size={24} color={theme.accent} />
      </View>
      <ThemedText type="heading">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptyCopy}>
        {subtitle}
      </ThemedText>
    </View>
  );
}

function getLocalDateKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatReleaseDate(value?: string) {
  if (!value) {
    return 'TBA';
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: Spacing.three,
  },
  header: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
  },
  watchlistTitle: {
    fontFamily: Fonts.displayBlack,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  searchInput: {
    flex: 1,
    height: 46,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  row: {
    gap: Spacing.two,
    justifyContent: 'flex-start',
  },
  cardCell: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    marginBottom: Spacing.three,
  },
  pressed: {
    opacity: 0.84,
    transform: [{ scale: 0.985 }],
  },
  posterWrap: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  posterFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  mediaType: {
    position: 'absolute',
    left: Spacing.two,
    bottom: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(8,5,6,0.7)',
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  mediaTypeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    minHeight: 20,
    marginTop: Spacing.one,
  },
  empty: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.seven,
  },
  loading: {
    marginTop: Spacing.six,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  emptyCopy: {
    maxWidth: 320,
    marginTop: Spacing.one,
    textAlign: 'center',
  },
});
