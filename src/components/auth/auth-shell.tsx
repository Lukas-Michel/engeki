import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PropsWithChildren, ComponentProps } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Screen } from '@/components/media/screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useGradients, useTheme } from '@/hooks/use-theme';

type AuthShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  const theme = useTheme();
  const gradients = useGradients();

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.brand}>
        <LinearGradient
          colors={gradients.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}>
          <Feather name="film" size={22} color="#FFFFFF" />
        </LinearGradient>
        <ThemedText style={styles.wordmark}>Engeki</ThemedText>
        <ThemedText type="caption" style={{ color: theme.accent }}>
          Track every screen
        </ThemedText>
      </View>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.heading}>
          <ThemedText type="heading">{title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subtitle}
          </ThemedText>
        </View>
        {children}
      </View>
    </Screen>
  );
}

type AuthInputProps = {
  icon: ComponentProps<typeof Feather>['name'];
} & ComponentProps<typeof TextInput>;

export function AuthInput({ icon, style, ...props }: AuthInputProps) {
  const theme = useTheme();

  return (
    <View style={[styles.inputWrap, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
      <Feather name={icon} size={18} color={theme.textTertiary} />
      <TextInput
        placeholderTextColor={theme.textTertiary}
        style={[styles.input, { color: theme.text }, style]}
        {...props}
      />
    </View>
  );
}

export function AuthDivider() {
  const theme = useTheme();
  return (
    <View style={styles.dividerRow}>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      <ThemedText type="label" themeColor="textTertiary">
        OR
      </ThemedText>
      <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.five,
    paddingBottom: Spacing.five,
  },
  brand: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: Fonts.displayBold,
    fontSize: 34,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    gap: 3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    height: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.body,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
});
