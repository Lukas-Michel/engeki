import { useSignIn } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthDivider, AuthInput, AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { ThemedText } from '@/components/themed-text';
import { GradientButton } from '@/components/ui/kit';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isClerkConfigured } from '@/lib/config';

export default function SignInScreen() {
  if (!isClerkConfigured) {
    return (
      <AuthShell title="Clerk setup" subtitle="Authentication needs configuration.">
        <ThemedText type="small" themeColor="textSecondary">
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local to enable authentication.
        </ThemedText>
      </AuthShell>
    );
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
  const busy = fetchStatus === 'fetching';

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
    <AuthShell title="Welcome back" subtitle="Sign in to sync your history and friend feed.">
      <GoogleSignInButton onError={setMessage} />
      <AuthDivider />

      <AuthInput
        icon="mail"
        value={emailAddress}
        onChangeText={setEmailAddress}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email address"
      />
      {errors.fields.identifier ? (
        <ThemedText type="small" themeColor="danger">
          {errors.fields.identifier.message}
        </ThemedText>
      ) : null}

      <AuthInput icon="lock" value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" />
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

      <GradientButton
        label="Sign in"
        icon="arrow-right"
        onPress={submit}
        loading={busy}
        disabled={!emailAddress || !password}
      />

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
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
