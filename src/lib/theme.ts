import type { ThemeColors } from './types';

// Palette follows aranyavij.com: soft blue and pink on cream, navy text.
export const lightColors: ThemeColors = {
  bg: '#FBF8F5',
  surface: '#ffffff',
  surface2: '#F3F0EF',
  border: '#E7E4EA',
  text: '#1F2850',
  textMuted: '#7A82A6',
  primary: '#4F8CF7',
  accent: '#F2709F',
  chartColors: ['#4F8CF7', '#F2709F', '#9C88F0', '#5DBB98', '#F6A35C', '#52B6D9', '#3E5AA8', '#F4C152'],
};

export const darkColors: ThemeColors = {
  bg: '#141A35',
  surface: '#1F2850',
  surface2: '#2B3460',
  border: '#2B3460',
  text: '#F3F0EF',
  textMuted: '#A0A6C2',
  primary: '#6DA2FA',
  accent: '#FF8FB8',
  chartColors: ['#6DA2FA', '#FF8FB8', '#B3A3F7', '#74D3B2', '#FAB877', '#7FCBE6', '#94BEFF', '#F7D27A'],
};

export function getColors(theme: 'light' | 'dark'): ThemeColors {
  return theme === 'dark' ? darkColors : lightColors;
}
