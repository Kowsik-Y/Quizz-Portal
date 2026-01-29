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

interface AntiCheatWarningProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  testTitle: string;
}

export function AntiCheatWarning({ visible, onAccept, onDecline, testTitle }: AntiCheatWarningProps) {
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
        <View className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-red-500/20 p-6 border-b border-border">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1">
                <View className="bg-red-500 p-3 rounded-full mr-4">
                  <Shield size={28} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-foreground">
                    Anti-Cheating Rules
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    {testTitle}
                  </Text>
                </View>
              </View>
              <Pressable onPress={onDecline} className="p-2">
                <X size={24} color="#6b7280" />
              </Pressable>
            </View>

            <View className="bg-red-500/30 p-4 rounded-lg border-l-4 border-red-500">
              <View className="flex-row items-start">
                <AlertTriangle size={20} color="#ef4444" className="mr-2 mt-0.5" />
                <Text className="flex-1 font-semibold text-red-200">
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
            <Text className="text-lg font-semibold mb-4 text-foreground">
              The following anti-cheating measures are active:
            </Text>

            {rules.map((rule, index) => {
              const Icon = rule.icon;
              return (
                <View 
                  key={index}
                  className="flex-row p-4 rounded-xl mb-3 bg-muted"
                >
                  <View 
                    className="p-3 rounded-full mr-4"
                    style={{ backgroundColor: `${rule.color}20` }}
                  >
                    <Icon size={24} color={rule.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold mb-1 text-foreground">
                      {rule.title}
                    </Text>
                    <Text className="text-sm text-muted-foreground">
                      {rule.description}
                    </Text>
                  </View>
                </View>
              );
            })}

            <View className="mt-6 p-4 rounded-xl border-2 bg-blue-500/20 border-blue-500">
              <Text className="text-sm font-semibold mb-2 text-blue-200">
                📊 Violation Report
              </Text>
              <Text className="text-sm text-blue-300">
                All detected violations will be recorded with timestamps and details. Your instructor can view this report after you submit the test.
              </Text>
            </View>

            <View className="mt-4 p-4 rounded-xl bg-green-500/20">
              <Text className="text-sm font-semibold mb-2 text-green-200">
                ✅ Best Practices
              </Text>
              <Text className="text-sm text-green-300">
                • Stay on this page throughout the test{'\n'}
                • Don&apos;t switch apps or windows{'\n'}
                • Don&apos;t take screenshots{'\n'}
                • Complete the test in one sitting{'\n'}
                • Ask your instructor if you need help
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="p-6 border-t border-border bg-muted">
            <Pressable
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              className="flex-row items-center mb-4"
            >
              <View 
                className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                  acceptedTerms 
                    ? 'bg-green-500 border-green-500' 
                    : 'border-border'
                }`}
              >
                {acceptedTerms && <CheckCircle2 size={16} color="white" />}
              </View>
              <Text className="flex-1 text-sm text-foreground">
                I understand and accept these anti-cheating rules. I agree to maintain academic integrity throughout this test.
              </Text>
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                onPress={onDecline}
                className="flex-1 py-4 rounded-xl border-2 border-border"
              >
                <Text className="text-center font-semibold text-foreground">
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                onPress={onAccept}
                disabled={!acceptedTerms}
                className={`flex-1 py-4 rounded-xl ${
                  acceptedTerms
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`}
              >
                <Text className={`text-center font-semibold ${
                  acceptedTerms ? 'text-white' : 'text-muted-foreground'
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
