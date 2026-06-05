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
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useFonts } from 'expo-font';
import { Redirect, Stack, ThemeProvider, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren, useEffect, type ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, Fonts } from '@/constants/theme';
import { useSchemeName } from '@/hooks/use-theme';
import { clerkPublishableKey, convexUrl } from '@/lib/config';

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
            <Stack.Screen
              name="details/[mediaType]/[id]"
              options={{
                headerShown: false,
                animation: 'slide_from_bottom',
                animationDuration: 280,
              }}
            />
          </Stack>
        </AppProviders>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppProviders({ children }: PropsWithChildren) {
  if (!clerkPublishableKey) {
    return convex ? <ConvexProvider client={convex}>{children}</ConvexProvider> : children;
  }

  const app = (
    <AuthGate>{convex ? <ConvexProviderWithClerk client={convex} useAuth={useAuth}>{children}</ConvexProviderWithClerk> : children}</AuthGate>
  );

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      {app}
    </ClerkProvider>
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
