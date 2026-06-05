import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { DarkTheme, DefaultTheme, Redirect, Stack, ThemeProvider, useSegments } from 'expo-router';
import { PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';

import { clerkPublishableKey, convexUrl } from '@/lib/config';

const convex = convexUrl
  ? new ConvexReactClient(convexUrl, {
      unsavedChangesWarning: false,
    })
  : undefined;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProviders>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="details/[mediaType]/[id]"
            options={{
              title: 'Details',
              headerTransparent: true,
              headerBlurEffect: colorScheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
              headerShadowVisible: false,
            }}
          />
        </Stack>
      </AppProviders>
    </ThemeProvider>
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
  const isAuthRoute = segments[0] === '(auth)';

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
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
