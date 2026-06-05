import { useSignUp } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/media/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isClerkConfigured } from '@/lib/config';

export default function SignUpScreen() {
  if (!isClerkConfigured) {
    return (
      <Screen>
        <ThemedView type="surface" style={styles.authCard}>
          <ThemedText type="subtitle">Clerk setup</ThemedText>
          <ThemedText themeColor="textSecondary">
            Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.local to enable sign-up.
          </ThemedText>
        </ThemedView>
      </Screen>
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
    <Screen>
      <ThemedView type="surface" style={styles.authCard}>
        <View>
          <ThemedText type="subtitle">{needsCode ? 'Verify email' : 'Create account'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {needsCode ? 'Enter the code Clerk sent to your email.' : 'Start tracking shows, seasons, and movies.'}
          </ThemedText>
        </View>

        {needsCode ? (
          <>
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="Verification code"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
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
            <Pressable
              onPress={verify}
              disabled={!code || fetchStatus === 'fetching'}
              style={[
                styles.primaryButton,
                { backgroundColor: theme.accent, opacity: !code || fetchStatus === 'fetching' ? 0.56 : 1 },
              ]}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Verify
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <TextInput
              value={emailAddress}
              onChangeText={setEmailAddress}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email address"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
            />
            {errors.fields.emailAddress ? (
              <ThemedText type="small" themeColor="danger">
                {errors.fields.emailAddress.message}
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
              onPress={createAccount}
              disabled={!emailAddress || !password || fetchStatus === 'fetching'}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.accent,
                  opacity: !emailAddress || !password || fetchStatus === 'fetching' ? 0.56 : 1,
                },
              ]}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Create account
              </ThemedText>
            </Pressable>
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
