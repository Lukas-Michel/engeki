/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useSchemeName(): 'light' | 'dark' {
  const scheme = useColorScheme();
  return scheme === 'unspecified' || scheme == null ? 'dark' : scheme;
}

export function useTheme() {
  return Colors[useSchemeName()];
}

export function useGradients() {
  return Gradients[useSchemeName()];
}
