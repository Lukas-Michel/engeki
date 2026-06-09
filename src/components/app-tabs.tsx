import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurTargetView, BlurView } from 'expo-blur';
import { TabList, TabListProps, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { ComponentProps, RefObject, useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Elevation, Radius, Spacing, TabBar } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FeatherName = ComponentProps<typeof Feather>['name'];
type TabIconName = FeatherName | 'popcorn';

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const blurTarget = useRef<View | null>(null);

  return (
    <Tabs>
      <BlurTargetView ref={blurTarget} style={styles.content}>
        <TabSlot style={styles.content} />
      </BlurTargetView>
      <TabList asChild>
        <FloatingTabBar bottomInset={insets.bottom} blurTarget={blurTarget}>
          <TabTrigger name="index" href="/(tabs)/(home)" asChild>
            <TabButton icon="clock" />
          </TabTrigger>
          <TabTrigger name="discover" href="/(tabs)/(discover)/discover" asChild>
            <TabButton icon="compass" />
          </TabTrigger>
          <TabTrigger name="watchlist" href="/(tabs)/(watchlist)/watchlist" asChild>
            <TabButton icon="popcorn" />
          </TabTrigger>
          <TabTrigger name="profile" href="/(tabs)/(profile)/profile" asChild>
            <TabButton icon="user" />
          </TabTrigger>
        </FloatingTabBar>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & { icon: TabIconName };

function TabButton({ icon, isFocused, onPressIn, onPressOut, ...props }: TabButtonProps) {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { rotate: `${rotation.get()}deg` }],
  }));

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    scale.set(
      withSequence(
        ReduceMotion.System,
        withTiming(0.88, { duration: 70, easing: Easing.out(Easing.quad) }),
        withSpring(1.1, { damping: 8, stiffness: 300, mass: 0.35 }),
        withSpring(1, { damping: 11, stiffness: 260, mass: 0.4 }),
      ),
    );
    rotation.set(
      withSequence(
        ReduceMotion.System,
        withTiming(-5, { duration: 65, easing: Easing.out(Easing.quad) }),
        withTiming(5, { duration: 80, easing: Easing.inOut(Easing.quad) }),
        withSpring(0, { damping: 10, stiffness: 280, mass: 0.35 }),
      ),
    );
  }, [isFocused, rotation, scale]);

  const handlePressIn: ComponentProps<typeof Pressable>['onPressIn'] = (event) => {
    onPressIn?.(event);
    scale.set(
      withTiming(0.84, {
        duration: 75,
        easing: Easing.out(Easing.quad),
        reduceMotion: ReduceMotion.System,
      }),
    );
  };

  const handlePressOut: ComponentProps<typeof Pressable>['onPressOut'] = (event) => {
    onPressOut?.(event);
    scale.set(
      withSequence(
        ReduceMotion.System,
        withSpring(1.08, { damping: 9, stiffness: 320, mass: 0.35 }),
        withSpring(1, { damping: 12, stiffness: 260, mass: 0.4 }),
      ),
    );
  };

  return (
    <Pressable
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [styles.tabButton, pressed && { opacity: 0.8 }]}>
      <Animated.View style={iconStyle}>
        {icon === 'popcorn' ? (
          <MaterialCommunityIcons
            name="popcorn"
            size={26}
            color={isFocused ? theme.accent : theme.textTertiary}
          />
        ) : (
          <Feather name={icon} size={25} color={isFocused ? theme.accent : theme.textTertiary} />
        )}
      </Animated.View>
    </Pressable>
  );
}

type FloatingTabBarProps = TabListProps & {
  bottomInset: number;
  blurTarget: RefObject<View | null>;
};

function FloatingTabBar({ blurTarget, bottomInset, children, style, ...props }: FloatingTabBarProps) {
  const theme = useTheme();
  const bottom = Math.max(bottomInset, Spacing.three) + TabBar.bottomOffset;

  const pillStyle = [
    styles.pill,
    { backgroundColor: `${theme.background}66` },
    style,
  ];

  return (
    <View style={[styles.outerContainer, { bottom }]} pointerEvents="box-none">
      <BlurView
        {...props}
        blurTarget={blurTarget}
        blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        intensity={55}
        tint="dark"
        style={pillStyle}>
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TabBar.verticalPadding,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    ...Elevation.floating,
  },
  tabButton: {
    width: TabBar.buttonWidth,
    height: TabBar.buttonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
