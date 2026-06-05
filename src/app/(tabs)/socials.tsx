import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, ReactionPill } from '@/components/ui/kit';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { socialEntries } from '@/lib/library';

export default function SocialsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Your circle"
        title="Socials"
        subtitle="A calm feed of what friends are watching, rating, and finishing."
      />

      <View style={styles.section}>
        <SectionHeader title="Friend feed" caption="Updated moments ago" />
        <View style={styles.feed}>
          {socialEntries.map((entry) => (
            <Card style={styles.item} key={entry.id}>
              <Avatar seed={entry.friend} size={46} />
              <View style={styles.copy}>
                <ThemedText type="smallBold" numberOfLines={2}>
                  <ThemedText type="smallBold" style={{ color: theme.text }}>
                    {entry.friend}{' '}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {entry.action}{' '}
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    {entry.title}
                  </ThemedText>
                </ThemedText>
                <View style={styles.metaRow}>
                  <ThemedText type="label" themeColor="textTertiary">
                    {entry.time}
                  </ThemedText>
                  <View style={[styles.dot, { backgroundColor: theme.borderStrong }]} />
                  <ReactionPill reaction={entry.reaction} />
                </View>
              </View>
            </Card>
          ))}
        </View>
      </View>

      <Card tone="accent" style={styles.cta}>
        <View style={[styles.ctaIcon, { backgroundColor: theme.accent }]}>
          <Feather name="users" size={18} color={theme.onAccent} />
        </View>
        <View style={styles.ctaCopy}>
          <ThemedText type="smallBold">Build your friend graph</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Convex will hold follows, reactions, and watched events once your deployment URL is connected.
          </ThemedText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  feed: {
    gap: Spacing.two,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  ctaIcon: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaCopy: {
    flex: 1,
    gap: 3,
  },
});
