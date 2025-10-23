import React from 'react';
import { View, Pressable, Modal } from 'react-native';
import { Text } from './ui/text';
import { X } from 'lucide-react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onClose: () => void;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onClose,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-6">
        <View className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
          {/* Header */}
          <View className="p-6 border-b border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {title}
              </Text>
              <Pressable
                onPress={onClose}
                className="p-1 rounded-lg bg-gray-100 dark:bg-gray-800"
              >
                <X size={20} color="#666" />
              </Pressable>
            </View>
          </View>

          {/* Message */}
          <View className="p-6">
            <Text className="text-base text-gray-700 dark:text-gray-300 leading-6">
              {message}
            </Text>
          </View>

          {/* Buttons */}
          <View className="p-4 border-t border-gray-200 dark:border-gray-700">
            <View className="flex-row gap-3">
              {buttons.map((button, index) => {
                const isCancel = button.style === 'cancel';
                const isDestructive = button.style === 'destructive';
                
                return (
                  <Pressable
                    key={index}
                    onPress={() => {
                      button.onPress?.();
                      onClose();
                    }}
                    className={`flex-1 py-3 rounded-xl ${
                      isDestructive
                        ? 'bg-red-500'
                        : isCancel
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-blue-500'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        isCancel
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-white'
                      }`}
                    >
                      {button.text}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Hook for easier usage
export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = React.useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (
    title: string,
    message: string,
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const AlertComponent = () => (
    <CustomAlert
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      buttons={alertConfig.buttons}
      onClose={hideAlert}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
};
