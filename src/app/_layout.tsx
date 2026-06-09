import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import {
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
} from '@expo-google-fonts/fraunces';
import {
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  ConvexProvider,
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvexAuth,
} from 'convex/react';
import { useFonts } from 'expo-font';
import { Redirect, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren, useCallback, useEffect, useMemo, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Linking,
  LogBox,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { useSchemeName } from '@/hooks/use-theme';
import { clerkPublishableKey, convexUrl } from '@/lib/config';
import { ConvexWatchlistProvider, LocalWatchlistProvider } from '@/lib/watchlist';

void SplashScreen.preventAutoHideAsync();

const convex = convexUrl
  ? new ConvexReactClient(convexUrl, {
      unsavedChangesWarning: false,
    })
  : undefined;

type Theme = ComponentProps<typeof ThemeProvider>['value'];

function navTheme(scheme: 'light' | 'dark'): Theme {
  const colors = Colors[scheme];
  return {
    dark: scheme === 'dark',
    colors: {
      primary: colors.accent,
      background: colors.background,
      card: colors.backgroundElevated,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: { fontFamily: Fonts.body, fontWeight: '400' },
      medium: { fontFamily: Fonts.bodyMedium, fontWeight: '500' },
      bold: { fontFamily: Fonts.bodyBold, fontWeight: '700' },
      heavy: { fontFamily: Fonts.bodyExtra, fontWeight: '800' },
    },
  };
}

export default function RootLayout() {
  const scheme = useSchemeName();
  const colors = Colors[scheme];
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_900Black,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    LogBox.ignoreLogs([
      'Clerk: Clerk has been loaded with development keys.',
    ]);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme(scheme)}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AppProviders>
          <Stack
            screenOptions={{
              animation: 'slide_from_right',
              animationDuration: 220,
              contentStyle: { backgroundColor: colors.background },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
          </Stack>
        </AppProviders>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppProviders({ children }: PropsWithChildren) {
  if (!clerkPublishableKey) {
    const app = <LocalWatchlistProvider>{children}</LocalWatchlistProvider>;
    return convex ? <ConvexProvider client={convex}>{app}</ConvexProvider> : app;
  }

  const app = convex ? (
    <ConvexProviderWithAuth client={convex} useAuth={useClerkAuthForConvex}>
      <AuthGate>
        <ConvexSessionGate>
          <ConvexWatchlistProvider>{children}</ConvexWatchlistProvider>
        </ConvexSessionGate>
      </AuthGate>
    </ConvexProviderWithAuth>
  ) : (
    <AuthGate>
      <LocalWatchlistProvider>{children}</LocalWatchlistProvider>
    </AuthGate>
  );

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      {app}
    </ClerkProvider>
  );
}

function useClerkAuthForConvex() {
  const { isLoaded, isSignedIn, getToken, orgId, orgRole, sessionClaims } = useAuth({
    treatPendingAsSignedOut: false,
  });
  const audience = sessionClaims?.aud;
  const hasConvexAudience =
    audience === 'convex' || (Array.isArray(audience) && audience.includes('convex'));
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      try {
        return await getToken({
          ...(hasConvexAudience ? {} : { template: 'convex' as const }),
          skipCache: forceRefreshToken,
        });
      } catch (error: unknown) {
        if (__DEV__) {
          console.warn(
            'Unable to fetch a Clerk token for Convex. Activate the Clerk Convex integration and sign in again.',
            error,
          );
        }
        return null;
      }
    },
    // Clerk Expo recreates getToken on render. Audience and organization changes
    // are the identity inputs that must trigger a fresh Convex token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasConvexAudience, orgId, orgRole],
  );

  return useMemo(
    () => ({
      isLoading: !isLoaded,
      isAuthenticated: isSignedIn ?? false,
      fetchAccessToken,
    }),
    [fetchAccessToken, isLoaded, isSignedIn],
  );
}

function AuthGate({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const segments = useSegments();
  const scheme = useSchemeName();
  const isAuthRoute = segments[0] === '(auth)';

  if (!isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: Colors[scheme].background }]}>
        <ActivityIndicator color={Colors[scheme].accent} />
      </View>
    );
  }

  if (!isSignedIn && !isAuthRoute) {
    return <Redirect href="/sign-in" />;
  }

  if (isSignedIn && isAuthRoute) {
    return <Redirect href="/" />;
  }

  return children;
}

function ConvexSessionGate({ children }: PropsWithChildren) {
  const { isAuthenticated, isLoading, isRefreshing } = useConvexAuth();
  const { signOut } = useAuth({ treatPendingAsSignedOut: false });
  const segments = useSegments();
  const scheme = useSchemeName();
  const colors = Colors[scheme];
  const isAuthRoute = segments[0] === '(auth)';

  if (isAuthRoute) {
    return children;
  }

  if (isLoading || isRefreshing) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.authError, { backgroundColor: colors.background }]}>
        <Text style={[styles.authErrorTitle, { color: colors.text }]}>Account sync failed</Text>
        <Text style={[styles.authErrorCopy, { color: colors.textSecondary }]}>
          Convex could not verify this Clerk session. Activate the Convex integration in Clerk,
          then sign out and sign in again so Clerk issues a token with the required audience.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            void Linking.openURL('https://dashboard.clerk.com/apps/setup/convex')
          }
          style={({ pressed }) => [
            styles.authErrorButton,
            { backgroundColor: colors.accent, opacity: pressed ? 0.82 : 1 },
          ]}>
          <Text style={[styles.authErrorButtonText, { color: colors.onAccent }]}>Open Clerk setup</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ pressed }) => [
            styles.authErrorSecondaryButton,
            { borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
          ]}>
          <Text style={[styles.authErrorButtonText, { color: colors.text }]}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  authErrorTitle: {
    fontFamily: Fonts.displayBold,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  authErrorCopy: {
    maxWidth: 420,
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  authErrorButton: {
    minHeight: 44,
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authErrorSecondaryButton: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authErrorButtonText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
  },
});
