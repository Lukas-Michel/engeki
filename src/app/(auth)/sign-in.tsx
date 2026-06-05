import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/media/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isClerkConfigured } from '@/lib/config';

export default function SignInScreen() {
  if (!isClerkConfigured) {
    return <AuthSetupCard />;
  }

  return <SignInForm />;
}

function SignInForm() {
  const router = useRouter();
  const theme = useTheme();
  const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const submit = async () => {
    setMessage('');
    const { error } = await signIn.password({ identifier: emailAddress, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (signIn.status === 'complete') {
      const finalized = await signIn.finalize();

      if (finalized.error) {
        setMessage(finalized.error.message);
        return;
      }

      router.replace('/');
      return;
    }

    setMessage('Additional verification is required for this account.');
  };

  return (
    <Screen>
      <ThemedView type="surface" style={styles.authCard}>
        <View>
          <ThemedText type="subtitle">Sign in</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Track your watched history and friend feed across devices.
          </ThemedText>
        </View>

        <TextInput
          value={emailAddress}
          onChangeText={setEmailAddress}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email address"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        {errors.fields.identifier ? (
          <ThemedText type="small" themeColor="danger">
            {errors.fields.identifier.message}
          </ThemedText>
        ) : null}

        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text }]}
        />
        {errors.fields.password ? (
          <ThemedText type="small" themeColor="danger">
            {errors.fields.password.message}
          </ThemedText>
        ) : null}

        {message ? (
          <ThemedText type="small" themeColor="danger">
            {message}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!emailAddress || !password || fetchStatus === 'fetching'}
          style={[
            styles.primaryButton,
            {
              backgroundColor: theme.accent,
              opacity: !emailAddress || !password || fetchStatus === 'fetching' ? 0.56 : 1,
            },
          ]}>
          <ThemedText type="smallBold" style={styles.primaryButtonText}>
            Continue
          </ThemedText>
        </Pressable>

        <View style={styles.inline}>
          <ThemedText type="small" themeColor="textSecondary">
            New here?
          </ThemedText>
          <Link href="/sign-up">
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Create account
            </ThemedText>
          </Link>
        </View>
      </ThemedView>
    </Screen>
  );
}

function AuthSetupCard() {
  return (
    <Screen>
      <ThemedView type="surface" style={styles.authCard}>
        <ThemedText type="subtitle">Clerk setup</ThemedText>
        <ThemedText themeColor="textSecondary">
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local to enable authentication.
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  authCard: {
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
