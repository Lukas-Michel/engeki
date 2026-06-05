import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** Adds top safe-area padding. Disable for full-bleed hero screens. */
  topInset?: boolean;
}>;

export function Screen({ children, scroll = true, contentStyle, topInset = true }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = topInset ? Math.max(insets.top, Spacing.five) + Spacing.three : 0;

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: theme.background, paddingTop: topPad }]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: topPad,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.six,
        },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

/** Editorial page header: small uppercase eyebrow, serif title, optional subtitle. */
export function ScreenHeader({ eyebrow, title, subtitle, right }: ScreenHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        {eyebrow ? (
          <ThemedText type="caption" style={{ color: theme.accent }}>
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText type="title">{title}</ThemedText>
        {subtitle ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.headerSubtitle}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.five,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  headerSubtitle: {
    marginTop: Spacing.half,
    maxWidth: 420,
  },
  headerRight: {
    paddingTop: Spacing.one,
  },
});
