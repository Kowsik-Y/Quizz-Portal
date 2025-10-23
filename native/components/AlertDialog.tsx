import React from 'react';
import { View, Modal, Pressable, Platform, Animated } from 'react-native';
import { Text } from '@/components/ui/text';
import { X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  onDismiss?: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation values
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return 'bg-red-500';
      case 'cancel':
        return isDark ? 'bg-gray-700' : 'bg-gray-200';
      default:
        return 'bg-blue-500';
    }
  };

  const getButtonTextColor = (style?: string) => {
    switch (style) {
      case 'cancel':
        return isDark ? 'text-white' : 'text-gray-900';
      default:
        return 'text-white';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 items-center justify-center">
        <Animated.View 
          className="absolute inset-0"
          style={{ 
            opacity: opacityAnim,
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
        >
          <Pressable 
            className="flex-1"
            onPress={onDismiss}
          />
        </Animated.View>
        
        <Animated.View
          className="w-full px-4"
          style={{
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim }
            ],
            maxWidth: 448, // max-w-md equivalent
            zIndex: 1,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className={`rounded-2xl p-6 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
          {/* Close button */}
          {onDismiss && (
            <Pressable
              onPress={onDismiss}
              className="absolute top-4 right-4 w-8 h-8 items-center justify-center rounded-full"
              style={{ opacity: 0.6 }}
            >
              <X size={20} color={isDark ? '#fff' : '#000'} />
            </Pressable>
          )}

          {/* Title */}
          <Text className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </Text>

          {/* Message */}
          <Text className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {message}
          </Text>

          {/* Buttons */}
          <View className="flex-row gap-3 justify-end">
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                onPress={() => handleButtonPress(button)}
                className={`px-6 py-3 rounded-xl ${getButtonStyle(button.style)}`}
                style={{
                  minWidth: 100,
                }}
              >
                <Text className={`font-bold text-center ${getButtonTextColor(button.style)}`}>
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Add displayName for debugging
AlertDialog.displayName = 'AlertDialog';

// Hook for easier usage
export const useAlertDialog = () => {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons: AlertButton[]
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const AlertDialogComponent = () => (
    <AlertDialog
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onDismiss={hideAlert}
    />
  );

  // Add displayName for better debugging
  AlertDialogComponent.displayName = 'AlertDialogComponent';

  return {
    showAlert,
    hideAlert,
    AlertDialog: AlertDialogComponent,
  };
};
