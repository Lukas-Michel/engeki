import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { Card, ReactionPill } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { historyEntries } from '@/lib/library';

const reactionStats = historyEntries.reduce(
  (acc, entry) => {
    acc[entry.reaction] += 1;
    return acc;
  },
  { love: 0, like: 0, dislike: 0 },
);

export default function HistoryScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Your activity"
        title="History"
        subtitle="Everything you watched, rated, and finished — in one timeline."
      />

      <View style={styles.statsRow}>
        <StatBox label="Loved" value={reactionStats.love} />
        <StatBox label="Liked" value={reactionStats.like} />
        <StatBox label="Watched" value={historyEntries.length} />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Recent activity" caption={`${historyEntries.length} entries`} />
        <View style={styles.timeline}>
          {historyEntries.map((entry, index) => (
            <View style={styles.timelineRow} key={entry.id}>
              <View style={styles.rail}>
                <View style={[styles.node, { backgroundColor: theme.accent, borderColor: theme.background }]} />
                {index < historyEntries.length - 1 ? (
                  <View style={[styles.line, { backgroundColor: theme.border }]} />
                ) : null}
              </View>

              <Card style={styles.entry}>
                <Image source={{ uri: entry.imageUrl }} style={styles.image} contentFit="cover" transition={200} />
                <View style={styles.copy}>
                  <ThemedText type="label" themeColor="textTertiary">
                    {entry.watchedAt}
                  </ThemedText>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {entry.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {entry.detail}
                  </ThemedText>
                  <View style={styles.reactionRow}>
                    <ReactionPill reaction={entry.reaction} />
                  </View>
                </View>
              </Card>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <Card tone="muted" style={styles.stat}>
      <ThemedText type="title" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textTertiary">
        {label}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.three,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 32,
  },
  section: {
    gap: Spacing.three,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    alignItems: 'center',
    width: 14,
    paddingTop: 6,
  },
  node: {
    width: 12,
    height: 12,
    borderRadius: 999,
    borderWidth: 3,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  entry: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
    padding: Spacing.two,
  },
  image: {
    width: 58,
    height: 78,
    borderRadius: Radius.sm,
    backgroundColor: '#1A1822',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  reactionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
});
