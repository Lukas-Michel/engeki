import { useSignUp } from '@clerk/expo';
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

export default function SignUpScreen() {
  if (!isClerkConfigured) {
    return (
      <AuthShell title="Clerk setup" subtitle="Authentication needs configuration.">
        <ThemedText type="small" themeColor="textSecondary">
          Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local to enable sign-up.
        </ThemedText>
      </AuthShell>
    );
  }

  return <SignUpForm />;
}

function SignUpForm() {
  const router = useRouter();
  const theme = useTheme();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [needsCode, setNeedsCode] = useState(false);
  const [message, setMessage] = useState('');
  const busy = fetchStatus === 'fetching';

  const createAccount = async () => {
    setMessage('');
    const { error } = await signUp.password({ emailAddress, password });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (signUp.status === 'complete') {
      await signUp.finalize();
      router.replace('/');
      return;
    }

    await signUp.verifications.sendEmailCode();
    setNeedsCode(true);
  };

  const verify = async () => {
    setMessage('');
    const { error } = await signUp.verifications.verifyEmailCode({ code });

    if (error) {
      setMessage(error.message);
      return;
    }

    if (signUp.status === 'complete') {
      const finalized = await signUp.finalize();
      if (finalized.error) {
        setMessage(finalized.error.message);
        return;
      }
      router.replace('/');
      return;
    }

    setMessage('Sign-up is not complete yet.');
  };

  return (
    <AuthShell
      title={needsCode ? 'Verify email' : 'Create account'}
      subtitle={needsCode ? 'Enter the code Clerk sent to your inbox.' : 'Start tracking shows, seasons, and films.'}>
      {needsCode ? (
        <>
          <AuthInput
            icon="hash"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            placeholder="Verification code"
          />
          {errors.fields.code ? (
            <ThemedText type="small" themeColor="danger">
              {errors.fields.code.message}
            </ThemedText>
          ) : null}
          {message ? (
            <ThemedText type="small" themeColor="danger">
              {message}
            </ThemedText>
          ) : null}
          <GradientButton label="Verify" icon="check" onPress={verify} loading={busy} disabled={!code} />
        </>
      ) : (
        <>
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
          {errors.fields.emailAddress ? (
            <ThemedText type="small" themeColor="danger">
              {errors.fields.emailAddress.message}
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
            label="Create account"
            icon="arrow-right"
            onPress={createAccount}
            loading={busy}
            disabled={!emailAddress || !password}
          />
        </>
      )}

      <View style={styles.inline}>
        <ThemedText type="small" themeColor="textSecondary">
          Already registered?
        </ThemedText>
        <Link href="/sign-in">
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            Sign in
          </ThemedText>
        </Link>
      </View>
      <View nativeID="clerk-captcha" />
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
