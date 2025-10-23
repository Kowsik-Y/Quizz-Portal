import { cn } from '@/lib/utils';
import * as Slot from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, StyleSheet, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn(
    'text-foreground text-base font-sans',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(
          'text-center text-4xl font-extrabold tracking-tight font-bold',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn(
          'border-border border-b pb-2 text-3xl font-semibold tracking-tight font-bold',
          Platform.select({ web: 'scroll-m-20 first:mt-0' })
        ),
        h3: cn('text-2xl font-semibold tracking-tight font-semibold', Platform.select({ web: 'scroll-m-20' })),
        h4: cn('text-xl font-semibold tracking-tight font-semibold', Platform.select({ web: 'scroll-m-20' })),
        p: 'mt-3 leading-7 sm:mt-6 font-sans',
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6 font-sans',
        code: cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
        ),
        lead: 'text-muted-foreground text-xl font-sans',
        large: 'text-lg font-semibold font-semibold',
        small: 'text-sm font-medium leading-none font-medium',
        muted: 'text-muted-foreground text-sm font-sans',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

/**
 * Get the correct font family name for the current platform
 * On Android, sometimes the fontWeight conflicts with the fontFamily
 */
function getPlatformFontFamily(fontFamily: string): string {
  // Use the exact font name from expo-google-fonts for all platforms
  return fontFamily;
}

/**
 * Get font style object for the current platform
 * On Android, we should ONLY use fontFamily, NOT fontWeight
 * because the weight is already in the font file name (e.g., Poppins_700Bold)
 */
function getPlatformFontStyle(fontFamily: string, fontWeight: string) {
  if (Platform.OS === 'android') {
    // On Android, ONLY set fontFamily, don't set fontWeight
    // The font weight is embedded in the font file itself
    return {
      fontFamily,
    };
  }
  
  // On iOS and Web, set both fontFamily and fontWeight
  return {
    fontFamily,
    fontWeight: fontWeight as '400' | '500' | '600' | '700',
  };
}

function Text({
  className,
  asChild = false,
  variant = 'default',
  style,
  ...props
}: React.ComponentProps<typeof RNText> &
  TextVariantProps &
  React.RefAttributes<RNText> & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  
  // Get font family and weight based on className and variant
  const getFontConfig = () => {
    let baseFontFamily = '';
    let weight = '400';
    
    // Priority 1: Check className for font weight
    if (className?.includes('font-bold') || className?.includes('font-extrabold')) {
      baseFontFamily = 'Poppins_700Bold';
      weight = '700';
    } else if (className?.includes('font-semibold')) {
      baseFontFamily = 'Poppins_600SemiBold';
      weight = '600';
    } else if (className?.includes('font-medium')) {
      baseFontFamily = 'Poppins_500Medium';
      weight = '500';
    } 
    // Priority 2: Check variant for font weight
    else if (variant === 'h1' || variant === 'h2') {
      baseFontFamily = 'Poppins_700Bold';
      weight = '700';
    } else if (variant === 'h3' || variant === 'h4' || variant === 'large') {
      baseFontFamily = 'Poppins_600SemiBold';
      weight = '600';
    } else if (variant === 'small') {
      baseFontFamily = 'Poppins_500Medium';
      weight = '500';
    } else {
      // Default: Regular weight
      baseFontFamily = 'Poppins_400Regular';
      weight = '400';
    }
    
    const platformFontFamily = getPlatformFontFamily(baseFontFamily);
    
    // Use platform-specific font style (Android doesn't need fontWeight)
    return getPlatformFontStyle(platformFontFamily, weight);
  };

  const fontConfig = getFontConfig();
  
  // On mobile, we need to completely override NativeWind's font handling
  // Strip font-weight related classes from className on mobile to prevent conflicts
  const processedClassName = Platform.OS === 'web'
    ? className
    : className?.replace(/font-(bold|extrabold|semibold|medium|normal)/g, '').trim();
  
  // On mobile, we need to completely override NativeWind's font handling
  // because React Native requires specific font files for each weight
  const finalStyle = Platform.OS === 'web' 
    ? style // Web can use CSS font-weight
    : StyleSheet.flatten([
        style,
        fontConfig, // Override any fontFamily/fontWeight from NativeWind
      ]);
  
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, processedClassName)}
      style={finalStyle}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };
