import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ComponentProps, ReactNode, useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius, Spacing, ThemeColor } from '@/constants/theme';
import { useGradients, useTheme } from '@/hooks/use-theme';
import type { MediaReaction } from '@/lib/tmdb';

type FeatherName = ComponentProps<typeof Feather>['name'];

/* -------------------------------------------------------------------------- */
/*  Icon                                                                      */
/* -------------------------------------------------------------------------- */

export function Icon({
  name,
  size = 18,
  color,
  themeColor = 'text',
}: {
  name: FeatherName;
  size?: number;
  color?: string;
  themeColor?: ThemeColor;
}) {
  const theme = useTheme();
  return <Feather name={name} size={size} color={color ?? theme[themeColor]} />;
}

/* -------------------------------------------------------------------------- */
/*  Card                                                                      */
/* -------------------------------------------------------------------------- */

type CardTone = 'surface' | 'muted' | 'accent';

export function Card({
  children,
  tone = 'surface',
  elevated = false,
  onPress,
  style,
}: {
  children: ReactNode;
  tone?: CardTone;
  elevated?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const background =
    tone === 'accent' ? theme.accentSoft : tone === 'muted' ? theme.surfaceMuted : theme.surface;
  const borderColor = tone === 'accent' ? 'transparent' : theme.border;

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: background, borderColor },
        elevated && (Elevation.card as ViewStyle),
        style,
      ]}>
      {children}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tag                                                                       */
/* -------------------------------------------------------------------------- */

type TagTone = 'soft' | 'outline' | 'solid' | 'gold';

export function Tag({
  label,
  tone = 'soft',
  icon,
}: {
  label: string;
  tone?: TagTone;
  icon?: FeatherName;
}) {
  const theme = useTheme();

  const palette: Record<TagTone, { bg: string; fg: string; border: string }> = {
    soft: { bg: theme.accentSoft, fg: theme.accent, border: 'transparent' },
    gold: { bg: theme.goldSoft, fg: theme.gold, border: 'transparent' },
    outline: { bg: 'transparent', fg: theme.textSecondary, border: theme.border },
    solid: { bg: theme.accent, fg: theme.onAccent, border: 'transparent' },
  };
  const c = palette[tone];

  return (
    <View style={[styles.tag, { backgroundColor: c.bg, borderColor: c.border }]}>
      {icon ? <Feather name={icon} size={11} color={c.fg} /> : null}
      <ThemedText type="caption" style={{ color: c.fg }}>
        {label}
      </ThemedText>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar                                                                    */
/* -------------------------------------------------------------------------- */

const AVATAR_GRADIENTS: readonly [string, string][] = [
  ['#7E63E0', '#5B43C0'],
  ['#F472A8', '#C8417A'],
  ['#46C68A', '#1F9D6B'],
  ['#F2C45A', '#D99A0B'],
  ['#5BC0DE', '#2E89C9'],
  ['#A998FF', '#7B68E8'],
];

export function Avatar({ seed, size = 44 }: { seed: string; size?: number }) {
  const initials = seed.trim().slice(0, 2).toUpperCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  const colors = AVATAR_GRADIENTS[Math.abs(hash)];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <ThemedText type="smallBold" style={[styles.avatarText, { fontSize: size * 0.36 }]}>
        {initials}
      </ThemedText>
    </LinearGradient>
  );
}

/* -------------------------------------------------------------------------- */
/*  IconButton                                                                */
/* -------------------------------------------------------------------------- */

export function IconButton({
  name,
  onPress,
  size = 20,
  tone = 'surface',
}: {
  name: FeatherName;
  onPress?: () => void;
  size?: number;
  tone?: 'surface' | 'glass';
}) {
  const theme = useTheme();
  const isGlass = tone === 'glass';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor: isGlass ? 'rgba(10,8,16,0.42)' : theme.surfaceMuted,
          borderColor: isGlass ? 'rgba(255,255,255,0.16)' : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <Feather name={name} size={size} color={isGlass ? '#FFFFFF' : theme.text} />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  SegmentedControl                                                          */
/* -------------------------------------------------------------------------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const [translateX] = useState(() => new Animated.Value(0));
  const itemWidth = containerWidth > 0 ? (containerWidth - 8) / options.length : 0;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: activeIndex * itemWidth,
      useNativeDriver: true,
      stiffness: 420,
      damping: 36,
      mass: 0.8,
    }).start();
  }, [activeIndex, itemWidth, translateX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[styles.segment, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      {itemWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.segmentIndicator,
            {
              width: itemWidth,
              backgroundColor: theme.backgroundElevated,
              transform: [{ translateX }],
            },
          ]}
        />
      ) : null}
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={styles.segmentItem}>
            <ThemedText
              type="smallBold"
              style={{ color: active ? theme.text : theme.textSecondary }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*  ReactionPill                                                              */
/* -------------------------------------------------------------------------- */

const reactionMeta: Record<MediaReaction, { icon: FeatherName; label: string; color: ThemeColor }> = {
  love: { icon: 'heart', label: 'Loved', color: 'love' },
  like: { icon: 'thumbs-up', label: 'Liked', color: 'accent' },
  dislike: { icon: 'thumbs-down', label: 'Meh', color: 'textTertiary' },
};

export function ReactionPill({ reaction }: { reaction: MediaReaction }) {
  const theme = useTheme();
  const meta = reactionMeta[reaction];
  const color = theme[meta.color];

  return (
    <View style={[styles.reactionPill, { borderColor: theme.border }]}>
      <Feather name={meta.icon} size={12} color={color} />
      <ThemedText type="label" style={{ color }}>
        {meta.label}
      </ThemedText>
    </View>
  );
}

export { reactionMeta };

/* -------------------------------------------------------------------------- */
/*  GradientButton                                                            */
/* -------------------------------------------------------------------------- */

export function GradientButton({
  label,
  onPress,
  icon,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress?: () => void;
  icon?: FeatherName;
  disabled?: boolean;
  loading?: boolean;
}) {
  const gradients = useGradients();

  return (
    <Pressable onPress={onPress} disabled={disabled || loading}>
      {({ pressed }) => (
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientButton, (disabled || loading) && styles.disabled, pressed && styles.pressed]}>
          {icon && !loading ? <Feather name={icon} size={16} color="#FFFFFF" /> : null}
          <ThemedText type="smallBold" style={styles.gradientButtonText}>
            {loading ? 'Please wait…' : label}
          </ThemedText>
        </LinearGradient>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    borderWidth: 1,
    padding: 4,
    overflow: 'hidden',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: Radius.pill,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.pill,
    zIndex: 1,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    paddingVertical: 15,
    paddingHorizontal: Spacing.three,
  },
  gradientButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.5,
  },
});
