import { Feather } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { MediaCard } from '@/components/media/media-card';
import { Screen, ScreenHeader } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { SegmentedControl } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { fallbackTrending, searchMulti, type MediaType } from '@/lib/tmdb';

const filterOptions: { value: 'all' | MediaType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Films' },
  { value: 'tv', label: 'Series' },
];

export default function DiscoverScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | MediaType>('all');
  const loadSearch = useCallback(() => searchMulti(query), [query]);
  const search = useAsync(loadSearch, fallbackTrending);
  const isSearching = query.trim().length > 0;

  const filtered = useMemo(() => {
    if (filter === 'all') return search.data;
    return search.data.filter((item) => item.mediaType === filter);
  }, [filter, search.data]);

  return (
    <Screen>
      <ScreenHeader title="Discover" />

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

      <SegmentedControl options={filterOptions} value={filter} onChange={setFilter} />

      {search.error ? (
        <View style={[styles.notice, { backgroundColor: theme.accentSoft }]}>
          <Feather name="alert-circle" size={15} color={theme.accent} />
          <ThemedText type="small" style={{ color: theme.accent, flex: 1 }}>
            {search.error}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.section}>
        <SectionHeader
          title={isSearching ? 'Search results' : 'Trending now'}
          caption={`${filtered.length} ${filtered.length === 1 ? 'title' : 'titles'}`}
        />
        {filtered.length === 0 && !search.loading ? (
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <Feather name="film" size={22} color={theme.textTertiary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Nothing matched. Try a different title or filter.
            </ThemedText>
          </View>
        ) : (
          filtered.map((item, index) => (
            <MediaCard
              item={item}
              rank={isSearching ? undefined : index + 1}
              key={`${item.mediaType}-${item.id}`}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  section: {
    gap: Spacing.three,
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
});
