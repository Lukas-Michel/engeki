/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#151918',
    background: '#F6F5EF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E9E6DC',
    surface: '#FFFFFF',
    surfaceMuted: '#ECE9DF',
    border: '#DCD7C9',
    accent: '#D8543F',
    accentSoft: '#F6DCD5',
    success: '#2F7D59',
    warning: '#C08A22',
    danger: '#B64A45',
    star: '#F2BC3A',
    shadow: '#1E2522',
    textSecondary: '#626C66',
  },
  dark: {
    text: '#F6F2EA',
    background: '#0C1110',
    backgroundElement: '#171D1B',
    backgroundSelected: '#27312E',
    surface: '#151B1A',
    surfaceMuted: '#222A28',
    border: '#2F3A36',
    accent: '#FF765F',
    accentSoft: '#3B211D',
    success: '#72D0A4',
    warning: '#FFD166',
    danger: '#FF8E86',
    star: '#FFD166',
    shadow: '#000000',
    textSecondary: '#A9B2AD',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
