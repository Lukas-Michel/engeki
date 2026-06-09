import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useSchemeName } from '@/hooks/use-theme';

export const unstable_settings = {
  initialRouteName: 'index',
  discover: {
    initialRouteName: 'discover',
  },
  watchlist: {
    initialRouteName: 'watchlist',
  },
  profile: {
    initialRouteName: 'profile',
  },
};

export default function TabStackLayout() {
  const scheme = useSchemeName();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 220,
        contentStyle: { backgroundColor: Colors[scheme].background },
      }}>
      <Stack.Screen
        name="details/[mediaType]/[id]"
        options={{
          animation: 'slide_from_bottom',
          animationDuration: 280,
        }}
      />
    </Stack>
  );
}
