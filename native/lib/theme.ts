import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

export const QUIZ_COLORS = {
  light: {
    primary: '#3b82f6', // Blue-500
    secondary: '#8b5cf6', // Purple-500
    success: '#10b981', // Green-500
    warning: '#f59e0b', // Orange-500
    danger: '#ef4444', // Red-500
    background: '#f9fafb', // Gray-50
    surface: '#ffffff', // White
    text: '#111827', // Gray-900
    textSecondary: '#6b7280', // Gray-600
    border: '#e5e7eb', // Gray-200
    hover: '#f3f4f6', // Gray-100
  },
  dark: {
    primary: '#3b82f6', // Blue-500
    secondary: '#8b5cf6', // Purple-500
    success: '#10b981', // Green-500
    warning: '#f59e0b', // Orange-500
    danger: '#ef4444', // Red-500
    background: '#111827', // Gray-900
    surface: '#1f2937', // Gray-800
    text: '#ffffff', // White
    textSecondary: '#9ca3af', // Gray-400
    border: '#374151', // Gray-700
    hover: '#374151', // Gray-700
  },
};
 
export const THEME = {
  light: {
    background: 'hsl(210 40% 98%)', // Light gray-blue
    foreground: 'hsl(222.2 84% 4.9%)',
    card: 'hsl(0 0% 100%)',
    cardForeground: 'hsl(222.2 84% 4.9%)',
    popover: 'hsl(0 0% 100%)',
    popoverForeground: 'hsl(222.2 84% 4.9%)',
    primary: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(210 40% 96.1%)',
    secondaryForeground: 'hsl(222.2 47.4% 11.2%)',
    muted: 'hsl(210 40% 96.1%)',
    mutedForeground: 'hsl(215.4 16.3% 46.9%)',
    accent: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    accentForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    border: 'hsl(214.3 31.8% 91.4%)',
    input: 'hsl(214.3 31.8% 91.4%)',
    ring: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    radius: '0.75rem',
    chart1: 'hsl(217.2 91.2% 59.8%)', // Blue
    chart2: 'hsl(142.1 76.2% 36.3%)', // Green
    chart3: 'hsl(38 92% 50%)', // Orange
    chart4: 'hsl(262.1 83.3% 57.8%)', // Purple
    chart5: 'hsl(0 84.2% 60.2%)', // Red
  },
  dark: {
    background: 'hsl(222.2 84% 4.9%)', // Gray-900
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(217.2 32.6% 17.5%)', // Gray-800
    cardForeground: 'hsl(210 40% 98%)',
    popover: 'hsl(217.2 32.6% 17.5%)',
    popoverForeground: 'hsl(210 40% 98%)',
    primary: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    primaryForeground: 'hsl(0 0% 100%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    muted: 'hsl(217.2 32.6% 17.5%)',
    mutedForeground: 'hsl(215 20.2% 65.1%)',
    accent: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    accentForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(0 62.8% 30.6%)',
    border: 'hsl(217.2 32.6% 17.5%)',
    input: 'hsl(217.2 32.6% 17.5%)',
    ring: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    radius: '0.75rem',
    chart1: 'hsl(217.2 91.2% 59.8%)', // Blue
    chart2: 'hsl(142.1 70.6% 45.3%)', // Green
    chart3: 'hsl(38 92% 50%)', // Orange
    chart4: 'hsl(262.1 83.3% 57.8%)', // Purple
    chart5: 'hsl(0 84.2% 60.2%)', // Red
  },
};
 
export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};