import { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/kit';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SectionHeaderProps = {
  title: string;
  caption?: string;
  /** Plain text shown on the right (e.g. a count). */
  action?: string;
  /** A tappable "see all" affordance. */
  onSeeAll?: () => void;
  seeAllLabel?: string;
  right?: ReactNode;
};

export function SectionHeader({
  title,
  caption,
  action,
  onSeeAll,
  seeAllLabel = 'See all',
  right,
}: SectionHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.titleGroup}>
        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
        <View style={styles.titleCopy}>
          <ThemedText type="heading">{title}</ThemedText>
          {caption ? (
            <ThemedText type="label" themeColor="textTertiary">
              {caption}
            </ThemedText>
          ) : null}
        </View>
      </View>

      {right}

      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {seeAllLabel}
          </ThemedText>
          <Icon name="chevron-right" size={15} color={theme.accent} />
        </Pressable>
      ) : action ? (
        <ThemedText type="label" themeColor="textTertiary">
          {action}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleCopy: {
    flexShrink: 1,
  },
  accentBar: {
    width: 4,
    height: 22,
    borderRadius: Radius.pill,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
