import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { historyEntries } from '@/lib/library';

const reactionCopy = {
  love: 'Loved',
  like: 'Liked',
  dislike: 'Disliked',
};

export default function HistoryScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View>
        <ThemedText type="subtitle">History</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Everything you watched, rated, and finished.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent activity" action={`${historyEntries.length} entries`} />
        {historyEntries.map((entry) => (
          <ThemedView type="surface" style={styles.row} key={entry.id}>
            <Image source={{ uri: entry.imageUrl }} style={styles.image} contentFit="cover" />
            <View style={styles.copy}>
              <ThemedText type="smallBold">{entry.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {entry.detail}
              </ThemedText>
            </View>
            <View style={[styles.reaction, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="code" style={{ color: theme.accent }}>
                {reactionCopy[entry.reaction]}
              </ThemedText>
            </View>
          </ThemedView>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  row: {
    borderRadius: 8,
    padding: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  image: {
    width: 58,
    height: 74,
    borderRadius: 7,
    backgroundColor: '#222222',
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  reaction: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
});
