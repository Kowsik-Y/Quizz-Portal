import React, { useState } from 'react';
import { Modal, View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
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
        <View className="w-full max-w-md rounded-2xl shadow-2xl bg-card border border-border">
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-start justify-between">
              <Text className="text-xl font-bold flex-1 pr-4 text-foreground">
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                className="p-1 rounded-full hover:bg-muted"
              >
                <X size={20} color="#6b7280" />
              </Pressable>
            </View>
            {message && (
              <Text className="mt-3 text-base leading-6 text-muted-foreground">
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
                        ? 'bg-muted hover:bg-muted/80 active:bg-muted/60 border border-border'
                        : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                    }`}
                  >
                    <Text
                      className={`font-semibold text-base ${
                        isCancel
                          ? 'text-foreground'
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
