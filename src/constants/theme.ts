/**
 * Engeki design system — "Cinematic Editorial".
 * Dark-first, layered near-black surfaces warmed with a vivid cinematic red
 * accent and amber star highlights, paired with a high-contrast serif display
 * (Fraunces) and a clean grotesque body (Manrope). The app runs dark-only; the
 * `light` palette is retained for type parity but is not surfaced in the UI.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1A1315',
    textSecondary: '#6A5C5F',
    textTertiary: '#9C8E91',
    background: '#FAF6F6',
    backgroundElevated: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#FBE6E8',
    surface: '#FFFFFF',
    surfaceMuted: '#F4EDEE',
    surfaceStrong: '#ECE2E3',
    border: '#EBE1E2',
    borderStrong: '#DACFD0',
    accent: '#D11F2E',
    accentBright: '#B5151F',
    accentSoft: '#FCE7E9',
    onAccent: '#FFFFFF',
    gold: '#C68A12',
    goldSoft: '#F7ECD4',
    success: '#1F9D6B',
    warning: '#C0902A',
    danger: '#C42A38',
    love: '#D6457E',
    star: '#E0A516',
    shadow: '#2A0C10',
  },
  dark: {
    text: '#F7F1F2',
    textSecondary: '#B3A4A7',
    textTertiary: '#7C6B6F',
    background: '#0B0708',
    backgroundElevated: '#160E10',
    backgroundElement: '#160E10',
    backgroundSelected: '#2C1A1D',
    surface: '#190F12',
    surfaceMuted: '#221518',
    surfaceStrong: '#2E1C20',
    border: '#2E1C20',
    borderStrong: '#42292E',
    accent: '#F2384A',
    accentBright: '#FF5C6B',
    accentSoft: '#2A1216',
    onAccent: '#FFFFFF',
    gold: '#F2C45A',
    goldSoft: '#2A2014',
    success: '#46C68A',
    warning: '#E6B85C',
    danger: '#FF5C6B',
    love: '#F472A8',
    star: '#F4C766',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Gradient stops keyed by theme, paired in `[from, to]` order. */
export const Gradients = {
  light: {
    accent: ['#E23744', '#B5151F'] as const,
    scrim: ['rgba(12,4,6,0)', 'rgba(12,4,6,0.86)'] as const,
    sheen: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'] as const,
  },
  dark: {
    accent: ['#FF5C6B', '#D11F2E'] as const,
    scrim: ['rgba(6,3,4,0)', 'rgba(6,3,4,0.94)'] as const,
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
    web: { boxShadow: '0 1px 2px rgba(26,10,14,0.05), 0 8px 24px rgba(26,10,14,0.08)' },
    default: {
      shadowColor: '#1A0A0E',
      shadowOpacity: 0.12,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 4,
    },
  }) as object,
  floating: Platform.select({
    web: { boxShadow: '0 16px 40px rgba(10,4,6,0.34)' },
    default: {
      shadowColor: '#0A0406',
      shadowOpacity: 0.38,
      shadowRadius: 30,
      shadowOffset: { width: 0, height: 18 },
      elevation: 12,
    },
  }) as object,
} as const;

export const TabBar = {
  buttonWidth: 60,
  buttonHeight: 48,
  verticalPadding: Spacing.two,
  bottomOffset: Spacing.two,
  contentGap: Spacing.three,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 760;
