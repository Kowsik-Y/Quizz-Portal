/** @type {import('tailwindcss').Config} */

// ============================================
// 🎨 COLOR DEFINITIONS - Change colors here!
// ============================================

const COLORS = {
  light: {
    background: '#f9fafb', // Light gray-blue
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
    background: '#111827', // Gray-900
    foreground: 'hsl(210 40% 98%)',
    card: 'hsl(217.2 32.6% 17.5%)', // Gray-800
    cardForeground: 'hsl(210 40% 98%)',
    popover: 'hsl(217.2 32.6% 17.5%)',
    popoverForeground: 'hsl(210 40% 98%)',
    primary: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    primaryForeground: 'hsl(0 0% 100%)',
       secondary: 'hsl(210 40% 20.1%)',
    secondaryForeground: 'hsl(210 40% 98%)',
    muted: 'hsl(217.2 32.6% 17.5%)',
    mutedForeground: 'hsl(215 20.2% 65.1%)',
    accent: 'hsl(217.2 91.2% 59.8%)', // Blue-500
    accentForeground: 'hsl(0 0% 100%)',
    destructive: 'hsl(0 62.8% 30.6%)',
    border: 'hsl(214.3 31.8% 20%)',
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

module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins_400Regular', 'system-ui', 'sans-serif'],
        poppins: ['Poppins_400Regular', 'Poppins_500Medium', 'Poppins_600SemiBold', 'Poppins_700Bold'],
      },
      colors: {
        // Light mode colors (default)
        background: COLORS.light.background,
        foreground: COLORS.light.foreground,
        card: COLORS.light.card,
        'card-foreground': COLORS.light.cardForeground,
        popover: COLORS.light.popover,
        'popover-foreground': COLORS.light.popoverForeground,
        primary: COLORS.light.primary,
        'primary-foreground': COLORS.light.primaryForeground,
        secondary: COLORS.light.secondary,
        'secondary-foreground': COLORS.light.secondaryForeground,
        muted: COLORS.light.muted,
        'muted-foreground': COLORS.light.mutedForeground,
        accent: COLORS.light.accent,
        'accent-foreground': COLORS.light.accentForeground,
        destructive: COLORS.light.destructive,
        border: COLORS.light.border,
        input: COLORS.light.input,
        ring: COLORS.light.ring,
      },
    },
  },
  plugins: [
    ({ addUtilities }) => {
      // Dark mode color overrides - automatically uses COLORS.dark
      const darkColors = {
        '.dark .bg-background': { backgroundColor: COLORS.dark.background },
        '.dark .bg-foreground': { backgroundColor: COLORS.dark.foreground },
        '.dark .bg-card': { backgroundColor: COLORS.dark.card },
        '.dark .bg-card-foreground': { backgroundColor: COLORS.dark.cardForeground },
        '.dark .bg-popover': { backgroundColor: COLORS.dark.popover },
        '.dark .bg-popover-foreground': { backgroundColor: COLORS.dark.popoverForeground },
        '.dark .bg-secondary': { backgroundColor: COLORS.dark.secondary },
        '.dark .bg-secondary-foreground': { backgroundColor: COLORS.dark.secondaryForeground },
        '.dark .bg-muted': { backgroundColor: COLORS.dark.muted },
        '.dark .bg-muted-foreground': { backgroundColor: COLORS.dark.mutedForeground },
        '.dark .bg-destructive': { backgroundColor: COLORS.dark.destructive },
        '.dark .bg-border': { backgroundColor: COLORS.dark.border },
        '.dark .bg-input': { backgroundColor: COLORS.dark.input },
        
        '.dark .text-background': { color: COLORS.dark.background },
        '.dark .text-foreground': { color: COLORS.dark.foreground },
        '.dark .text-card': { color: COLORS.dark.card },
        '.dark .text-card-foreground': { color: COLORS.dark.cardForeground },
        '.dark .text-popover': { color: COLORS.dark.popover },
        '.dark .text-popover-foreground': { color: COLORS.dark.popoverForeground },
        '.dark .text-secondary': { color: COLORS.dark.secondary },
        '.dark .text-secondary-foreground': { color: COLORS.dark.secondaryForeground },
        '.dark .text-muted': { color: COLORS.dark.muted },
        '.dark .text-muted-foreground': { color: COLORS.dark.mutedForeground },
        '.dark .text-destructive': { color: COLORS.dark.destructive },
        
        '.dark .border-border': { borderColor: COLORS.dark.border },
        '.dark .border-input': { borderColor: COLORS.dark.input },
      };
      addUtilities(darkColors);
    },
  ],
}