import { Icon } from '@/components/ui/icon';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react-native';
import * as React from 'react';
import { Platform, Pressable, View, type ViewProps } from 'react-native';
import Animated, {
  FadeOutUp,
  LayoutAnimationConfig,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

// Context for Accordion root state
interface AccordionContextValue {
  type: 'single' | 'multiple';
  value: string | string[] | undefined;
  onValueChange: (value: string) => void;
  collapsible?: boolean;
  disabled?: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within Accordion');
  }
  return context;
}

// Context for individual accordion item state
interface AccordionItemContextValue {
  value: string;
  isExpanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | undefined>(undefined);

function useItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionItem components must be used within AccordionItem');
  }
  return context;
}

// Root Accordion Component
interface AccordionRootProps extends ViewProps {
  type: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  collapsible?: boolean;
  disabled?: boolean;
  defaultValue?: string | string[];
}

function Accordion({
  children,
  type = 'single',
  value: controlledValue,
  onValueChange,
  collapsible = false,
  disabled = false,
  defaultValue,
  ...props
}: AccordionRootProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | string[]>(
    defaultValue || (type === 'multiple' ? [] : '')
  );

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handleValueChange = React.useCallback(
    (itemValue: string) => {
      let newValue: string | string[];

      if (type === 'single') {
        // Single mode: toggle or set value
        if (value === itemValue && collapsible) {
          newValue = '';
        } else {
          newValue = itemValue;
        }
      } else {
        // Multiple mode: add or remove from array
        const currentValues = Array.isArray(value) ? value : [];
        if (currentValues.includes(itemValue)) {
          newValue = currentValues.filter((v) => v !== itemValue);
        } else {
          newValue = [...currentValues, itemValue];
        }
      }

      if (onValueChange) {
        onValueChange(newValue);
      } else {
        setUncontrolledValue(newValue);
      }
    },
    [type, value, collapsible, onValueChange]
  );

  return (
    <AccordionContext.Provider
      value={{
        type,
        value,
        onValueChange: handleValueChange,
        collapsible,
        disabled,
      }}>
      <LayoutAnimationConfig skipEntering>
        <Animated.View layout={LinearTransition.duration(200)} {...props}>
          {children}
        </Animated.View>
      </LayoutAnimationConfig>
    </AccordionContext.Provider>
  );
}

// AccordionItem Component
interface AccordionItemProps extends ViewProps {
  value: string;
  disabled?: boolean;
}

function AccordionItem({
  children,
  className,
  value,
  disabled: itemDisabled,
  ...props
}: AccordionItemProps) {
  const { value: accordionValue, onValueChange, disabled: rootDisabled, type } = useAccordionContext();

  const isExpanded = React.useMemo(() => {
    if (type === 'multiple' && Array.isArray(accordionValue)) {
      return accordionValue.includes(value);
    }
    return accordionValue === value;
  }, [accordionValue, value, type]);

  const disabled = itemDisabled || rootDisabled;

  const handleToggle = React.useCallback(() => {
    if (!disabled) {
      onValueChange(value);
    }
  }, [disabled, onValueChange, value]);

  return (
    <AccordionItemContext.Provider
      value={{
        value,
        isExpanded,
        onToggle: handleToggle,
        disabled,
      }}>
      <Animated.View
        className={cn(
          'border-border border-b native:overflow-hidden',
          Platform.select({ web: 'last:border-b-0' }),
          className
        )}
        layout={Platform.select({ native: LinearTransition.duration(200) })}
        {...props}>
        {children}
      </Animated.View>
    </AccordionItemContext.Provider>
  );
}

// AccordionHeader Component
interface AccordionHeaderProps extends ViewProps {}

function AccordionHeader({ children, ...props }: AccordionHeaderProps) {
  return <View {...props}>{children}</View>;
}

const Trigger = Platform.OS === 'web' ? View : Pressable;

// AccordionTrigger Component
interface AccordionTriggerProps extends ViewProps {
  children?: React.ReactNode;
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionTriggerProps) {
  const { isExpanded, onToggle, disabled } = useItemContext();

  const progress = useDerivedValue(
    () => (isExpanded ? withTiming(1, { duration: 250 }) : withTiming(0, { duration: 200 })),
    [isExpanded]
  );
  const chevronStyle = useAnimatedStyle(
    () => ({
      transform: [{ rotate: `${progress.value * 180}deg` }],
    }),
    [progress]
  );

  return (
    <TextClassContext.Provider
      value={cn(
        'text-left text-sm font-medium',
        Platform.select({ web: 'group-hover:underline' })
      )}>
      <AccordionHeader>
        <Trigger
          className={cn(
            'flex-row items-start justify-between gap-4 rounded-md py-4',
            disabled && 'opacity-50',
            Platform.select({
              web: 'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 outline-none transition-all hover:underline focus-visible:ring-[3px] disabled:pointer-events-none [&[data-state=open]>svg]:rotate-180',
            }),
            className
          )}
          {...(Platform.OS !== 'web' && { onPress: onToggle })}
          {...(Platform.OS === 'web' && { onClick: onToggle })}
          {...props}>
          <>{children}</>
          <Animated.View style={chevronStyle}>
            <Icon
              as={ChevronDown}
              size={16}
              className={cn(
                'text-muted-foreground shrink-0',
                Platform.select({
                  web: 'pointer-events-none translate-y-0.5 transition-transform duration-200',
                })
              )}
            />
          </Animated.View>
        </Trigger>
      </AccordionHeader>
    </TextClassContext.Provider>
  );
}

// AccordionContent Component
interface AccordionContentProps extends ViewProps {
  children?: React.ReactNode;
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionContentProps) {
  const { isExpanded } = useItemContext();

  if (!isExpanded) {
    return null;
  }

  return (
    <TextClassContext.Provider value="text-sm">
      <View
        className={cn(
          'overflow-hidden',
          Platform.select({
            web: isExpanded ? 'animate-accordion-down' : 'animate-accordion-up',
          })
        )}
        {...props}>
        <Animated.View
          exiting={Platform.select({ native: FadeOutUp.duration(200) })}
          className={cn('pb-4', className)}>
          {children}
        </Animated.View>
      </View>
    </TextClassContext.Provider>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
