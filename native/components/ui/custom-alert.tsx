import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertOptions({
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
    setIsOpen(true);
  }, []);

  const handleButtonPress = (onPress?: () => void) => {
    setIsOpen(false);
    // Execute the callback after the dialog closes
    setTimeout(() => {
      onPress?.();
    }, 100);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertOptions.title}</AlertDialogTitle>
            {alertOptions.message && (
              <AlertDialogDescription>
                <Text>{alertOptions.message}</Text>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {alertOptions.buttons?.map((button, index) => {
              if (button.style === 'cancel') {
                return (
                  <AlertDialogCancel
                    key={index}
                    onPress={() => handleButtonPress(button.onPress)}
                  >
                    <Text>{button.text}</Text>
                  </AlertDialogCancel>
                );
              }
              return (
                <AlertDialogAction
                  key={index}
                  onPress={() => handleButtonPress(button.onPress)}
                  className={button.style === 'destructive' ? 'bg-destructive' : ''}
                >
                  <Text className='bg-transparent'>{button.text}</Text>
                </AlertDialogAction>
              );
            })}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertContext.Provider>
  );
}

export function useCustomAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useCustomAlert must be used within CustomAlertProvider');
  }
  return context;
}

// Utility function to mimic Alert.alert API
export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    // This is a placeholder - the actual implementation will use the hook
    console.warn('CustomAlert.alert called outside of CustomAlertProvider context');
  },
};
