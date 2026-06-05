import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextType =
  | 'display'
  | 'title'
  | 'subtitle'
  | 'heading'
  | 'default'
  | 'body'
  | 'small'
  | 'smallBold'
  | 'caption'
  | 'label'
  | 'link'
  | 'linkPrimary'
  | 'code';

export type ThemedTextProps = TextProps & {
  type?: ThemedTextType;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const color = theme[themeColor ?? (type === 'linkPrimary' ? 'accent' : 'text')];

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create<Record<ThemedTextType, TextStyle>>({
  display: {
    fontFamily: Fonts.displayBlack,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1.2,
    includeFontPadding: false,
  },
  title: {
    fontFamily: Fonts.displayBold,
    fontSize: 30,
    lineHeight: 40,
    letterSpacing: -0.7,
    includeFontPadding: false,
  },
  subtitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    lineHeight: 32,
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  heading: {
    fontFamily: Fonts.bodyExtra,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  default: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 23,
  },
  small: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
  },
  smallBold: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    lineHeight: 19,
  },
  caption: {
    fontFamily: Fonts.bodyExtra,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  link: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  linkPrimary: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
});
