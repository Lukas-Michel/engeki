import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { socialEntries } from '@/lib/library';

const reactionLabels = {
  love: 'Love',
  like: 'Like',
  dislike: 'Dislike',
};

export default function SocialsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View>
        <ThemedText type="subtitle">Socials</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          A clean feed of what friends are watching.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Friend feed" action="Live with Convex" />
        {socialEntries.map((entry) => (
          <ThemedView type="surface" style={styles.feedItem} key={entry.id}>
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="smallBold">{entry.avatar}</ThemedText>
            </View>
            <View style={styles.feedCopy}>
              <ThemedText type="smallBold">
                {entry.friend} {entry.action} {entry.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {entry.time}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="code" style={{ color: theme.accent }}>
                {reactionLabels[entry.reaction]}
              </ThemedText>
            </View>
          </ThemedView>
        ))}
      </View>

      <ThemedView type="surfaceMuted" style={styles.emptyState}>
        <ThemedText type="smallBold">Friend graph</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Convex will hold follows, reactions, and watched events once the deployment URL is added.
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  feedItem: {
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedCopy: {
    flex: 1,
    gap: Spacing.half,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  emptyState: {
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
