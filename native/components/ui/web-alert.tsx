import React, { useState } from 'react';
import { Modal, View, Pressable, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';
import { X } from 'lucide-react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface WebAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

export function WebAlert({ visible, title, message, buttons = [], onClose }: WebAlertProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleButtonPress = (button: AlertButton) => {
    onClose();
    // Execute callback after a small delay to allow modal to close
    setTimeout(() => {
      button.onPress?.();
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View
          className={`w-full max-w-md rounded-2xl shadow-2xl ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
        >
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-start justify-between">
              <Text className={`text-xl font-bold flex-1 pr-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            </View>
            {message && (
              <Text className={`mt-3 text-base leading-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {message}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View className="px-6 pb-6 flex-row gap-3 justify-end">
            {buttons.length === 0 ? (
              <Pressable
                onPress={onClose}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
              >
                <Text className="text-white font-semibold text-base">OK</Text>
              </Pressable>
            ) : (
              buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                
                return (
                  <Pressable
                    key={index}
                    onPress={() => handleButtonPress(button)}
                    className={`px-6 py-3 rounded-xl ${
                      isDestructive
                        ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                        : isCancel
                        ? isDark
                          ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 border border-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 border border-gray-300'
                        : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                    }`}
                  >
                    <Text
                      className={`font-semibold text-base ${
                        isCancel
                          ? isDark
                            ? 'text-gray-200'
                            : 'text-gray-700'
                          : 'text-white'
                      }`}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Hook to manage alert state
export function useWebAlert() {
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <WebAlert
      visible={alertState.visible}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onClose={hideAlert}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
}
