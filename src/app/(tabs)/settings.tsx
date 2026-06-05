import { useAuth, useUser } from '@clerk/expo';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/media/screen';
import { SectionHeader } from '@/components/media/section-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isClerkConfigured, isConvexConfigured, isTmdbConfigured } from '@/lib/config';

export default function SettingsScreen() {
  const theme = useTheme();

  return (
    <Screen>
      <View>
        <ThemedText type="subtitle">Settings</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Secrets, account, data sync, and appearance.
        </ThemedText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Integrations" />
        <IntegrationRow label="TMDB" enabled={isTmdbConfigured} value="EXPO_PUBLIC_TMDB_ACCESS_TOKEN" />
        <IntegrationRow label="Clerk" enabled={isClerkConfigured} value="EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" />
        <IntegrationRow label="Convex" enabled={isConvexConfigured} value="EXPO_PUBLIC_CONVEX_URL" />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Account" />
        {isClerkConfigured ? <ClerkAccount /> : <MissingClerkCard />}
      </View>

      <ThemedView type="surface" style={styles.card}>
        <ThemedText type="smallBold">Appearance</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Light and dark mode follow the device setting through Expo automatic user interface style.
        </ThemedText>
      </ThemedView>

      <ThemedView type="accentSoft" style={styles.card}>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          Where secrets go
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Put local values in .env.local at the project root. Public Expo variables are embedded in the app bundle.
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

function IntegrationRow({ label, enabled, value }: { label: string; enabled: boolean; value: string }) {
  const theme = useTheme();

  return (
    <ThemedView type="surface" style={styles.integrationRow}>
      <View>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {value}
        </ThemedText>
      </View>
      <View
        style={[
          styles.status,
          {
            backgroundColor: enabled ? theme.success : theme.surfaceMuted,
          },
        ]}>
        <ThemedText type="code" style={{ color: enabled ? '#FFFFFF' : theme.textSecondary }}>
          {enabled ? 'Set' : 'Missing'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

function MissingClerkCard() {
  return (
    <ThemedView type="surface" style={styles.card}>
      <ThemedText type="smallBold">Authentication disabled</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Add a Clerk publishable key to enable the sign-in gate and account controls.
      </ThemedText>
    </ThemedView>
  );
}

function ClerkAccount() {
  const theme = useTheme();
  const { isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const { user } = useUser();
  const { signOut } = useAuth();

  return (
    <ThemedView type="surface" style={styles.card}>
      <ThemedText type="smallBold">{isSignedIn ? user?.primaryEmailAddress?.emailAddress : 'Signed out'}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Clerk is configured and protecting the app when signed out.
      </ThemedText>
      {isSignedIn ? (
        <Pressable style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => signOut()}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            Sign out
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  integrationRow: {
    borderRadius: 8,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  status: {
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  card: {
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  button: {
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: Spacing.one,
  },
  buttonText: {
    color: '#FFFFFF',
  },
});
