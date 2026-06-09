/**
 * Engeki is a dark-only experience. The scheme is pinned to `dark` regardless
 * of the OS preference so every surface uses the cinematic red palette.
 */

import { Colors, Gradients } from '@/constants/theme';

export function useSchemeName(): 'light' | 'dark' {
  return 'dark';
}

export function useTheme() {
  return Colors[useSchemeName()];
}

export function useGradients() {
  return Gradients[useSchemeName()];
}
