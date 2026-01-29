import React, { useState } from 'react';
import { View, Modal, Pressable, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { X, Save } from 'lucide-react-native';

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
          className="w-full max-w-md rounded-xl p-6 bg-card border border-border"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold text-foreground">
              Edit Test Title
            </Text>
            <Pressable
              onPress={onClose}
              className="p-2 rounded-full bg-muted"
            >
              <X size={20} color="#6b7280" />
            </Pressable>
          </View>

          {/* Input */}
          <View className="mb-6">
            <Text className="mb-2 font-medium text-foreground">
              Test Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter test title"
              placeholderTextColor="#6b7280"
              className="px-4 py-3 rounded-lg border bg-background border-border text-foreground"
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              disabled={loading}
              className="flex-1 py-3 rounded-lg border border-border bg-muted"
            >
              <Text className="text-center font-semibold text-foreground">
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
