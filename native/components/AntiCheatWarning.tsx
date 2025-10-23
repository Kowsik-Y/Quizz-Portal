import React, { useState } from 'react';
import { View, ScrollView, Modal, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { 
  Shield, 
  Eye, 
  Camera, 
  Phone, 
  Clipboard, 
  Monitor, 
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface AntiCheatWarningProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  testTitle: string;
}

export function AntiCheatWarning({ visible, onAccept, onDecline, testTitle }: AntiCheatWarningProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [hasScrolled, setHasScrolled] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const rules = [
    {
      icon: Monitor,
      title: 'Window Switch Detection',
      description: 'Switching to another window/app will be recorded',
      color: '#ef4444',
    },
    {
      icon: Camera,
      title: 'Screenshot Prevention',
      description: 'Taking screenshots is blocked and will be logged',
      color: '#f97316',
    },
    {
      icon: Phone,
      title: 'Phone Call Detection',
      description: 'Incoming/outgoing calls will be detected and recorded',
      color: '#eab308',
    },
    {
      icon: Eye,
      title: 'Tab Visibility Tracking',
      description: 'When you switch tabs or minimize, it will be logged',
      color: '#06b6d4',
    },
    {
      icon: Clipboard,
      title: 'Copy/Paste Blocking',
      description: 'Copying questions or pasting answers is prevented',
      color: '#8b5cf6',
    },
  ];

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDecline}
    >
      <View className="flex-1 bg-black/60 justify-center items-center p-4">
        <View className={`w-full max-w-2xl rounded-2xl ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl overflow-hidden`}>
          {/* Header */}
          <View className={`${isDark ? 'bg-red-900/20' : 'bg-red-50'} p-6 border-b ${isDark ? 'border-red-800' : 'border-red-200'}`}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className="bg-red-500 p-3 rounded-full mr-4">
                  <Shield size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Anti-Cheating Rules
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    {testTitle}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onDecline} className="p-2">
                <X size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </Pressable>
            </View>

            <View className={`${isDark ? 'bg-red-900/30' : 'bg-red-100'} p-4 rounded-lg border-l-4 border-red-500`}>
              <View className="flex-row items-start">
                <AlertTriangle size={20} color="#ef4444" className="mr-2 mt-0.5" />
                <Text className={`flex-1 font-semibold ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                  All violations will be automatically recorded and visible to your instructor
                </Text>
              </View>
            </View>
          </View>

          {/* Rules List */}
          <ScrollView 
            className="max-h-96 p-6"
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              The following anti-cheating measures are active:
            </Text>

            {rules.map((rule, index) => {
              const Icon = rule.icon;
              return (
                <View 
                  key={index}
                  className={`flex-row p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                >
                  <View 
                    className="p-3 rounded-full mr-4"
                    style={{ backgroundColor: `${rule.color}20` }}
                  >
                    <Icon size={24} color={rule.color} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-semibold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {rule.title}
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {rule.description}
                    </Text>
                  </View>
                </View>
              );
            })}

            <View className={`mt-6 p-4 rounded-xl border-2 ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
              <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                📊 Violation Report
              </Text>
              <Text className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                All detected violations will be recorded with timestamps and details. Your instructor can view this report after you submit the test.
              </Text>
            </View>

            <View className={`mt-4 p-4 rounded-xl ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                ✅ Best Practices
              </Text>
              <Text className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                • Stay on this page throughout the test{'\n'}
                • Don't switch apps or windows{'\n'}
                • Don't take screenshots{'\n'}
                • Complete the test in one sitting{'\n'}
                • Ask your instructor if you need help
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className={`p-6 border-t ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
            <Pressable
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              className="flex-row items-center mb-4"
            >
              <View 
                className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                  acceptedTerms 
                    ? 'bg-green-500 border-green-500' 
                    : isDark ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                {acceptedTerms && <CheckCircle2 size={16} color="white" />}
              </View>
              <Text className={`flex-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                I understand and accept these anti-cheating rules. I agree to maintain academic integrity throughout this test.
              </Text>
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                onPress={onDecline}
                className={`flex-1 py-4 rounded-xl border-2 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
              >
                <Text className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={onAccept}
                disabled={!acceptedTerms}
                className={`flex-1 py-4 rounded-xl ${
                  acceptedTerms
                    ? 'bg-green-500'
                    : isDark ? 'bg-gray-800' : 'bg-gray-300'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  acceptedTerms ? 'text-white' : isDark ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  I Accept - Start Test
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
