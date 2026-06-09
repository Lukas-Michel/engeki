import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    TabList,
    TabListProps,
    Tabs,
    TabSlot,
    TabTrigger,
    TabTriggerSlotProps,
} from 'expo-router/ui';
import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ExternalLink } from './external-link';
import { ThemedText } from './themed-text';

import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useGradients, useTheme } from '@/hooks/use-theme';

type FeatherName = ComponentProps<typeof Feather>['name'];
type TabIconName = FeatherName | 'popcorn';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/(tabs)/(home)" asChild>
            <TabButton icon="clock">Up Next</TabButton>
          </TabTrigger>
          <TabTrigger name="discover" href="/(tabs)/(discover)/discover" asChild>
            <TabButton icon="compass">Discover</TabButton>
          </TabTrigger>
          <TabTrigger name="watchlist" href="/(tabs)/(watchlist)/watchlist" asChild>
            <TabButton icon="popcorn">Watchlist</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/(tabs)/(profile)/profile" asChild>
            <TabButton icon="user">Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: TabIconName };

export function TabButton({ children, icon, isFocused, ...props }: TabButtonProps) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textSecondary;

  return (
    <Pressable {...props} style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
      <View style={[styles.triggerInner, isFocused && { backgroundColor: theme.accentSoft }]}>
        {icon === 'popcorn' ? (
          <MaterialCommunityIcons name="popcorn" size={16} color={color} />
        ) : (
          <Feather name={icon} size={15} color={color} />
        )}
        <ThemedText type="smallBold" style={{ color }}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();
  const gradients = useGradients();

  return (
    <View style={styles.tabListContainer}>
      <View
        {...props}
        style={[
          styles.innerContainer,
          { backgroundColor: theme.backgroundElevated, borderColor: theme.border },
        ]}>
        <View style={styles.brand}>
          <LinearGradient
            colors={gradients.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logo}>
            <Feather name="film" size={14} color="#FFFFFF" />
          </LinearGradient>
          <ThemedText style={styles.brandText}>Engeki</ThemedText>
        </View>

        <View style={styles.triggers}>{props.children}</View>

        <ExternalLink href="https://www.themoviedb.org" asChild>
          <Pressable style={({ pressed }) => [styles.externalPressable, pressed && styles.pressed]}>
            <ThemedText type="label" themeColor="textTertiary">
              TMDB
            </ThemedText>
            <Feather name="external-link" size={12} color={theme.textTertiary} />
          </Pressable>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    boxShadow: '0 12px 40px rgba(8,6,16,0.28)',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: 'auto',
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: Fonts.displayBold,
    fontSize: 18,
  },
  triggers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  trigger: {
    borderRadius: Radius.pill,
  },
  triggerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
  externalPressable: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.one,
    marginLeft: Spacing.three,
  },
});
