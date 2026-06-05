/**
 * Engeki design system — "Cinematic Editorial".
 * Layered dark-first surfaces, a refined violet accent with warm gold
 * highlights, and a high-contrast serif display (Fraunces) paired with a clean
 * grotesque body (Manrope).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#15131F',
    textSecondary: '#615D72',
    textTertiary: '#928EA1',
    background: '#F6F5FB',
    backgroundElevated: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EAE7F6',
    surface: '#FFFFFF',
    surfaceMuted: '#F0EEF8',
    surfaceStrong: '#E9E6F4',
    border: '#E7E4F1',
    borderStrong: '#D7D3E7',
    accent: '#6D54D0',
    accentBright: '#5B43C0',
    accentSoft: '#ECE9FB',
    onAccent: '#FFFFFF',
    gold: '#C68A12',
    goldSoft: '#F7ECD4',
    success: '#1F9D6B',
    warning: '#C0902A',
    danger: '#D6485F',
    love: '#D6457E',
    star: '#E0A516',
    shadow: '#1B1733',
  },
  dark: {
    text: '#F5F3FB',
    textSecondary: '#A09BB2',
    textTertiary: '#6E697F',
    background: '#0A0910',
    backgroundElevated: '#131119',
    backgroundElement: '#131119',
    backgroundSelected: '#262332',
    surface: '#16141F',
    surfaceMuted: '#1E1B28',
    surfaceStrong: '#272336',
    border: '#272336',
    borderStrong: '#393450',
    accent: '#9080F7',
    accentBright: '#A998FF',
    accentSoft: '#1F1B33',
    onAccent: '#FFFFFF',
    gold: '#F2C45A',
    goldSoft: '#2A2415',
    success: '#46C68A',
    warning: '#E6B85C',
    danger: '#F0697A',
    love: '#F472A8',
    star: '#F4C766',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Gradient stops keyed by theme, paired in `[from, to]` order. */
export const Gradients = {
  light: {
    accent: ['#7E63E0', '#5B43C0'] as const,
    scrim: ['rgba(8,6,18,0)', 'rgba(8,6,18,0.86)'] as const,
    sheen: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'] as const,
  },
  dark: {
    accent: ['#A998FF', '#7B68E8'] as const,
    scrim: ['rgba(4,3,9,0)', 'rgba(4,3,9,0.92)'] as const,
    sheen: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'] as const,
  },
} as const;

export const Fonts = {
  display: 'Fraunces_600SemiBold',
  displayMedium: 'Fraunces_500Medium',
  displayBold: 'Fraunces_700Bold',
  displayBlack: 'Fraunces_900Black',
  body: 'Manrope_500Medium',
  bodyMedium: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtra: 'Manrope_800ExtraBold',
  mono: Platform.select({
    ios: 'ui-monospace',
    android: 'monospace',
    web: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    default: 'monospace',
  }) as string,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 22,
  xl: 30,
  pill: 999,
} as const;

/** Soft, layered shadows tuned per platform. */
export const Elevation = {
  card: Platform.select({
    web: { boxShadow: '0 1px 2px rgba(20,16,40,0.04), 0 8px 24px rgba(20,16,40,0.06)' },
    default: {
      shadowColor: '#140F24',
      shadowOpacity: 0.1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
  }) as object,
  floating: Platform.select({
    web: { boxShadow: '0 16px 40px rgba(12,8,28,0.28)' },
    default: {
      shadowColor: '#0A0716',
      shadowOpacity: 0.32,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 18 },
      elevation: 12,
    },
  }) as object,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 760;
