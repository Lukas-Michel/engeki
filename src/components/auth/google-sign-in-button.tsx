import { useSSO } from '@clerk/expo';
import type { OAuthStrategy } from '@clerk/shared/types';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInButtonProps = {
  onError?: (message: string) => void;
};

export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  useWarmUpBrowser();

  const router = useRouter();
  const theme = useTheme();
  const { startSSOFlow } = useSSO();
  const [submitting, setSubmitting] = useState(false);

  const signInWithGoogle = async () => {
    setSubmitting(true);
    onError?.('');

    try {
      const { authSessionResult, createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google' as OAuthStrategy,
        redirectUrl: makeGoogleRedirectUrl(),
      });

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        router.replace('/');
        return;
      }

      if (authSessionResult?.type && authSessionResult.type !== 'success') {
        return;
      }

      if (signUp?.status === 'missing_requirements') {
        router.push('/continue');
        return;
      }

      if (signUp?.status === 'complete' && signUp.createdSessionId) {
        await setActive?.({ session: signUp.createdSessionId });
        router.replace('/');
        return;
      }

      if (signIn?.status === 'complete' && signIn.createdSessionId) {
        await setActive?.({ session: signIn.createdSessionId });
        router.replace('/');
        return;
      }

      onError?.(getIncompleteSSOMessage(signIn?.status, signUp?.status));
    } catch (error) {
      onError?.(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Pressable
      onPress={signInWithGoogle}
      disabled={submitting}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          opacity: submitting ? 0.62 : 1,
        },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.googleMark, { borderColor: theme.border }]}>
        <ThemedText type="smallBold">G</ThemedText>
      </View>
      <ThemedText type="smallBold">{submitting ? 'Opening Google...' : 'Continue with Google'}</ThemedText>
    </Pressable>
  );
}

function makeGoogleRedirectUrl() {
  return AuthSession.makeRedirectUri({
    ...(Constants.appOwnership === 'expo' ? {} : { scheme: 'engeki' }),
    path: 'sso-callback',
  });
}

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    void WebBrowser.warmUpAsync();

    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

function getAuthErrorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'errors' in error) {
    const firstError = (error as { errors?: { message?: string }[] }).errors?.[0]?.message;

    if (firstError) {
      return firstError;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Google sign-in failed. Check that Google is enabled in Clerk.';
}

function getIncompleteSSOMessage(signInStatus?: string | null, signUpStatus?: string | null) {
  const status = signUpStatus ?? signInStatus;

  if (status) {
    return `Google sign-in needs another step that this screen does not handle yet (${status}).`;
  }

  return 'Google sign-in did not create a session. Check the Clerk redirect URL and Google provider settings.';
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: Radius.md,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.76,
  },
  googleMark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
