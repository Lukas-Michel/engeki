import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MediaCard } from '@/components/media/media-card';
import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAsync } from '@/hooks/use-async';
import { useTheme } from '@/hooks/use-theme';
import { fallbackTrending, searchMulti, type MediaType } from '@/lib/tmdb';

const filters: ('all' | MediaType)[] = ['all', 'movie', 'tv'];

export default function DiscoverScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | MediaType>('all');
  const loadSearch = useCallback(() => searchMulti(query), [query]);
  const search = useAsync(loadSearch, fallbackTrending);

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return search.data;
    }

    return search.data.filter((item) => item.mediaType === filter);
  }, [filter, search.data]);

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">Discover</ThemedText>
        {search.loading ? <ActivityIndicator color={theme.accent} /> : null}
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search movies, shows, seasons..."
        placeholderTextColor={theme.textSecondary}
        autoCapitalize="none"
        returnKeyType="search"
        style={[
          styles.search,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />

      <View style={styles.filterRow}>
        {filters.map((item) => {
          const active = item === filter;

          return (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[
                styles.filter,
                {
                  backgroundColor: active ? theme.accent : theme.surface,
                  borderColor: active ? theme.accent : theme.border,
                },
              ]}>
              <ThemedText type="smallBold" style={{ color: active ? '#FFFFFF' : theme.text }}>
                {item === 'all' ? 'All' : item === 'movie' ? 'Movies' : 'TV'}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {search.error ? (
        <ThemedView type="accentSoft" style={styles.notice}>
          <ThemedText type="small" style={{ color: theme.accent }}>
            {search.error}
          </ThemedText>
        </ThemedView>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title={query ? 'Search results' : 'Trending now'} action={`${filtered.length} items`} />
        {filtered.map((item) => (
          <MediaCard item={item} key={`${item.mediaType}-${item.id}`} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  search: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 17,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  filter: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  notice: {
    borderRadius: 8,
    padding: Spacing.three,
  },
  section: {
    gap: Spacing.three,
  },
});
