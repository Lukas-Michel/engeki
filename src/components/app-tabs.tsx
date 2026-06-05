import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useSchemeName } from '@/hooks/use-theme';

export default function AppTabs() {
  const scheme = useSchemeName();
  const colors = Colors[scheme];

  return (
    <NativeTabs
      backgroundColor={colors.backgroundElevated}
      blurEffect={Platform.select({
        ios: scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight',
      })}
      iconColor={{ default: colors.textTertiary, selected: colors.accent }}
      indicatorColor={colors.accentSoft}
      labelVisibilityMode={Platform.OS === 'android' ? 'unlabeled' : undefined}
      rippleColor={colors.accentSoft}
      labelStyle={{
        default: { fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.textTertiary },
        selected: { fontFamily: Fonts.bodyBold, fontSize: 11, color: colors.accent },
      }}
      tintColor={colors.accent}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home_filled' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'magnifyingglass', selected: 'sparkle.magnifyingglass' }}
          md="search"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="socials">
        <NativeTabs.Trigger.Label>Socials</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          md={{ default: 'groups', selected: 'groups' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>History</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'clock.arrow.circlepath', selected: 'clock.arrow.circlepath' }}
          md="history"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md={{ default: 'settings', selected: 'settings' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
