import React, { useState } from 'react';
import { View, Modal, Pressable, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, Save } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface EditTestTitleModalProps {
  visible: boolean;
  currentTitle: string;
  onClose: () => void;
  onSave: (newTitle: string) => void;
  loading?: boolean;
}

export const EditTestTitleModal: React.FC<EditTestTitleModalProps> = ({
  visible,
  currentTitle,
  onClose,
  onSave,
  loading = false
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [title, setTitle] = useState(currentTitle);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center p-4"
        onPress={onClose}
      >
        <Pressable 
          className={`w-full max-w-md rounded-xl p-6 ${
            isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          }`}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Edit Test Title
            </Text>
            <Pressable
              onPress={onClose}
              className={`p-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
            >
              <X size={20} color={isDark ? '#9ca3af' : '#6b7280'} />
            </Pressable>
          </View>

          {/* Input */}
          <View className="mb-6">
            <Text className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Test Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter test title"
              placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
              className={`px-4 py-3 rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={loading}
              className={`flex-1 py-3 rounded-lg border ${
                isDark 
                  ? 'border-gray-700 bg-gray-800' 
                  : 'border-gray-300 bg-white'
              }`}
            >
              <Text className={`text-center font-semibold ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={loading || !title.trim()}
              className={`flex-1 py-3 rounded-lg flex-row items-center justify-center gap-2 ${
                loading || !title.trim() 
                  ? 'bg-gray-400' 
                  : 'bg-blue-500'
              }`}
            >
              <Save size={18} color="white" />
              <Text className="text-white font-semibold">
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
