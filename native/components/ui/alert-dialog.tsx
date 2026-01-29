import { buttonTextVariants, buttonVariants } from '@/components/ui/button';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  Platform,
  View,
  Modal,
  Pressable,
  Text as RNText,
  type ViewProps,
  type PressableProps,
  type TextProps as RNTextProps
} from 'react-native';
import { FadeOut, ZoomIn } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

// Context for AlertDialog state management
interface AlertDialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | undefined>(undefined);

function useAlertDialog() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialog components must be used within AlertDialog');
  }
  return context;
}

// Root component
interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function AlertDialog({ children, open: controlledOpen, onOpenChange }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setUncontrolledOpen(newOpen);
    }
  }, [onOpenChange]);

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// Trigger component
interface AlertDialogTriggerProps extends PressableProps {
  asChild?: boolean;
}

function AlertDialogTrigger({ children, asChild, ...props }: AlertDialogTriggerProps) {
  const { onOpenChange } = useAlertDialog();

  return (
    <Pressable onPress={() => onOpenChange(true)} {...props}>
      {children}
    </Pressable>
  );
}

// Portal component (passthrough for web, renders children directly)
interface AlertDialogPortalProps {
  children: React.ReactNode;
  hostName?: string;
}

function AlertDialogPortal({ children }: AlertDialogPortalProps) {
  return <>{children}</>;
}

const FullWindowOverlay = Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

// Overlay component
interface AlertDialogOverlayProps extends ViewProps {
  forceMount?: boolean;
}

function AlertDialogOverlay({
  className,
  children,
  ...props
}: AlertDialogOverlayProps) {
  return (
    <FullWindowOverlay>
      <Pressable
        className={cn(
          'absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black/50 p-2',
          Platform.select({
            web: 'animate-in fade-in-0 fixed',
          }),
          className
        )}
        {...props}>
        <NativeOnlyAnimatedView
          entering={ZoomIn.duration(100).withInitialValues({ transform: [{ scale: 0.90 }] })}
          exiting={FadeOut.duration(150)}>
          <>{children}</>
        </NativeOnlyAnimatedView>
      </Pressable>
    </FullWindowOverlay>
  );
}

// Content component
interface AlertDialogContentProps extends ViewProps {
  portalHost?: string;
  onClose?: () => void;
}

function AlertDialogContent({
  className,
  portalHost,
  children,
  onClose,
  ...props
}: AlertDialogContentProps) {
  const { open, onOpenChange } = useAlertDialog();

  if (!open) return null;

  return (
    <AlertDialogPortal hostName={portalHost}>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          onClose?.();
          onOpenChange(false);
        }}>
        <AlertDialogOverlay>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              className={cn(
                'bg-background border-border w-screen z-50 flex flex-col gap-4 rounded-lg border p-6 shadow-lg shadow-black/5 max-w-sm sm:max-w-lg',
                Platform.select({
                  web: 'animate-in fade-in-0 zoom-in-95 duration-200',
                }),
                className
              )}
              {...props}>
              {children}
            </View>
          </Pressable>
        </AlertDialogOverlay>
      </Modal>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: ViewProps) {
  return (
    <TextClassContext.Provider value="text-left">
      <View className={cn('flex flex-col gap-2', className)} {...props} />
    </TextClassContext.Provider>
  );
}

function AlertDialogFooter({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex gap-2 flex-row justify-end', className)}
      {...props}
    />
  );
}

// Title component
interface AlertDialogTitleProps extends RNTextProps {
  children: React.ReactNode;
}

function AlertDialogTitle({
  className,
  ...props
}: AlertDialogTitleProps) {
  return (
    <RNText
      className={cn('text-foreground text-lg font-semibold', className)}
      {...props}
    />
  );
}

// Description component
interface AlertDialogDescriptionProps extends RNTextProps {
  children: React.ReactNode;
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogDescriptionProps) {
  return (
    <RNText
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

// Action component
interface AlertDialogActionProps extends PressableProps {
  asChild?: boolean;
}

function AlertDialogAction({
  className,
  children,
  onPress,
  ...props
}: AlertDialogActionProps) {
  const { onOpenChange } = useAlertDialog();

  const handlePress = React.useCallback((e: any) => {
    onPress?.(e);
    onOpenChange(false);
  }, [onPress, onOpenChange]);

  return (
    <TextClassContext.Provider value={buttonTextVariants({ className })}>
      <Pressable
        className={cn(buttonVariants(), className)}
        onPress={handlePress}
        {...props}>
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

// Cancel component
interface AlertDialogCancelProps extends PressableProps {
  asChild?: boolean;
}

function AlertDialogCancel({
  className,
  children,
  onPress,
  ...props
}: AlertDialogCancelProps) {
  const { onOpenChange } = useAlertDialog();

  const handlePress = React.useCallback((e: any) => {
    onPress?.(e);
    onOpenChange(false);
  }, [onPress, onOpenChange]);

  return (
    <TextClassContext.Provider value={buttonTextVariants({ className, variant: 'outline' })}>
      <Pressable
        className={cn(buttonVariants({ variant: 'outline' }), className)}
        onPress={handlePress}
        {...props}>
        {children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
