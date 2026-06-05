import { Stack } from 'expo-router';

import { isClerkConfigured } from '@/lib/config';

export default function AuthLayout() {
  if (!isClerkConfigured) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
