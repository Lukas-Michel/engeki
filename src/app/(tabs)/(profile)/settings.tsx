import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Screen, ScreenHeader } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { Avatar, Card, GradientButton } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isClerkConfigured, isConvexConfigured, isTmdbConfigured } from '@/lib/config';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow="Preferences"
        title="Settings"
        subtitle="Account, data sync, integrations, and appearance."
      />

      <View style={styles.section}>
        <SectionHeader title="Account" />
        {isClerkConfigured ? <ClerkAccount /> : <MissingClerkCard />}
      </View>

      <View style={styles.section}>
        <SectionHeader title="Integrations" caption="Environment variables" />
        <Card style={styles.group}>
          <IntegrationRow label="TMDB" enabled={isTmdbConfigured} value="EXPO_PUBLIC_TMDB_ACCESS_TOKEN" icon="film" />
          <Divider />
          <IntegrationRow label="Clerk" enabled={isClerkConfigured} value="EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" icon="lock" />
          <Divider />
          <IntegrationRow label="Convex" enabled={isConvexConfigured} value="EXPO_PUBLIC_CONVEX_URL" icon="database" />
        </Card>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Appearance" />
        <Card style={styles.infoCard}>
          <View style={styles.infoHead}>
            <Feather name="moon" size={18} color={theme.accent} />
            <ThemedText type="smallBold">Always dark</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Engeki is tuned as a dark-only, cinematic experience with a vivid red accent — it stays dark regardless of your device setting.
          </ThemedText>
        </Card>
      </View>

      <Card tone="accent" style={styles.infoCard}>
        <View style={styles.infoHead}>
          <Feather name="key" size={18} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            Where secrets go
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Put local values in .env.local at the project root. Public Expo variables are embedded in the app bundle.
        </ThemedText>
      </Card>
    </Screen>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

function IntegrationRow({
  label,
  enabled,
  value,
  icon,
}: {
  label: string;
  enabled: boolean;
  value: string;
  icon: React.ComponentProps<typeof Feather>['name'];
}) {
  const theme = useTheme();

  return (
    <View style={styles.integrationRow}>
      <View style={[styles.integrationIcon, { backgroundColor: theme.surfaceMuted }]}>
        <Feather name={icon} size={16} color={theme.textSecondary} />
      </View>
      <View style={styles.integrationCopy}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="code" themeColor="textTertiary" numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
      <View style={[styles.status, { backgroundColor: enabled ? theme.success : theme.surfaceMuted }]}>
        <Feather
          name={enabled ? 'check' : 'minus'}
          size={11}
          color={enabled ? '#FFFFFF' : theme.textTertiary}
        />
        <ThemedText type="label" style={{ color: enabled ? '#FFFFFF' : theme.textTertiary }}>
          {enabled ? 'Set' : 'Missing'}
        </ThemedText>
      </View>
    </View>
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
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();
  const { signOut } = useAuth();

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
  group: {
    gap: 0,
    paddingVertical: Spacing.one,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  integrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  integrationIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationCopy: {
    flex: 1,
    gap: 2,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
