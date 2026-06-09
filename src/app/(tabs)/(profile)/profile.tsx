import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, GradientButton, ReactionPill } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isClerkConfigured } from '@/lib/config';
import { historyEntries } from '@/lib/library';

const reactionStats = historyEntries.reduce(
  (acc, entry) => {
    acc[entry.reaction] += 1;
    return acc;
  },
  { love: 0, like: 0, dislike: 0 },
);

export default function ProfileScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="You"
        title="Profile"
        subtitle="Account controls, settings access, and your watch history in one place."
      />

      <View style={styles.section}>
        <SectionHeader title="Account" />
        {isClerkConfigured ? <ClerkAccount /> : <MissingClerkCard />}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Quick links" />
        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [pressed && styles.pressed]}>
          <Card style={styles.linkCard}>
            <View style={[styles.linkIcon, { backgroundColor: theme.surfaceMuted }]}>
              <Feather name="settings" size={18} color={theme.accent} />
            </View>
            <View style={styles.linkCopy}>
              <ThemedText type="smallBold">Settings</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Open integrations, appearance, and environment setup.
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={18} color={theme.textTertiary} />
          </Card>
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeader title="History" caption={`${historyEntries.length} entries`} />

        <View style={styles.statsRow}>
          <StatBox label="Loved" value={reactionStats.love} />
          <StatBox label="Liked" value={reactionStats.like} />
          <StatBox label="Watched" value={historyEntries.length} />
        </View>

        <View style={styles.timeline}>
          {historyEntries.map((entry, index) => (
            <View style={styles.timelineRow} key={entry.id}>
              <View style={styles.rail}>
                <View
                  style={[
                    styles.node,
                    { backgroundColor: theme.accent, borderColor: theme.background },
                  ]}
                />
                {index < historyEntries.length - 1 ? (
                  <View style={[styles.line, { backgroundColor: theme.border }]} />
                ) : null}
              </View>

              <Card style={styles.entry}>
                <Image
                  source={{ uri: entry.imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
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

function MissingClerkCard() {
  const theme = useTheme();

  return (
    <Card style={styles.infoCard}>
      <View style={styles.infoHead}>
        <Feather name="lock" size={18} color={theme.textSecondary} />
        <ThemedText type="smallBold">Authentication disabled</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        Add a Clerk publishable key to enable the sign-in gate and account controls.
      </ThemedText>
    </Card>
  );
}

function ClerkAccount() {
  const { isSignedIn, signOut } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress;
  const name = user?.fullName ?? email ?? 'Guest';

  return (
    <Card style={styles.accountCard}>
      <View style={styles.accountRow}>
        <Avatar seed={name} size={52} />
        <View style={styles.accountCopy}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {isSignedIn ? name : 'Signed out'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {isSignedIn ? email ?? 'Clerk session active' : 'Clerk is protecting the app'}
          </ThemedText>
        </View>
      </View>
      {isSignedIn ? <GradientButton label="Sign out" icon="log-out" onPress={() => signOut()} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  linkIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCopy: {
    flex: 1,
    gap: 2,
  },
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
  accountCard: {
    gap: Spacing.three,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  accountCopy: {
    flex: 1,
    gap: 3,
  },
  infoCard: {
    gap: Spacing.two,
  },
  infoHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});