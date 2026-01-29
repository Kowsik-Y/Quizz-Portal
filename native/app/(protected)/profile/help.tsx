import { View, ScrollView, Pressable, Linking } from 'react-native';
import { Text } from '@/components/ui/text';
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  FileText,
  Video,
  Search,
  ChevronRight,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import HeaderTile from '@/components/ui/headerTile';
import { useCustomAlert } from '@/components/ui/custom-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components';

export default function HelpPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
  }, [user, router]);

  const faqs = [
    {
      id: 1,
      question: 'How do I take a test?',
      answer: 'Navigate to the Tests tab, select your course, and click on any available test. Make sure to read the instructions before starting.',
    },
    {
      id: 2,
      question: 'Can I retake a test?',
      answer: 'Test retake availability depends on your instructor\'s settings. Check the test details for the maximum number of attempts allowed.',
    },
    {
      id: 3,
      question: 'How is my test graded?',
      answer: 'Tests are automatically graded upon submission. You can view your results immediately after completing the test.',
    },
    {
      id: 4,
      question: 'What happens if I lose connection during a test?',
      answer: 'Your progress is automatically saved. You can resume the test from where you left off if the time hasn\'t expired.',
    },
    {
      id: 5,
      question: 'How do I change my password?',
      answer: 'Go to Profile > Security and use the Change Password section to update your password securely.',
    },
    {
      id: 6,
      question: 'Can I access tests on mobile?',
      answer: 'Yes! Our platform is fully responsive and works on mobile devices, tablets, and desktop computers.',
    },
  ];


  const contactOptions = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@quizportal.com',
      action: () => Linking.openURL('mailto:support@quizportal.com'),
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: '+1 (555) 123-4567',
      action: () => Linking.openURL('tel:+15551234567'),
    }
  ];



  const FaqItem = ({ faq }: any) => {
    const isExpanded = expandedFaq === faq.id;

    return (
      <Pressable
        onPress={() => setExpandedFaq(isExpanded ? null : faq.id)}
        className="py-4 border-b border-border"
      >
        <View className="flex-row items-start justify-between">
          <Text className="flex-1 font-semibold text-foreground pr-4">
            {faq.question}
          </Text>
          <View
            style={{
              transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
            }}
          >
            <ChevronRight size={20} color="#71717a" />
          </View>
        </View>
        {isExpanded && (
          <Text className="text-sm text-muted-foreground mt-3 leading-5">
            {faq.answer}
          </Text>
        )}
      </Pressable>
    );
  };

  const ContactOption = ({ option }: any) => (
    <Pressable
      onPress={option.action}
      className="flex-row items-center justify-between py-4 border-b border-border"
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-3">
          <option.icon size={20} color="#3b82f6" />
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-foreground">{option.title}</Text>
          <Text className="text-xs text-muted-foreground mt-1">
            {option.description}
          </Text>
        </View>
      </View>
      <ExternalLink size={18} color="#71717a" />
    </Pressable>
  );

  return (
    <View className="flex-1 bg-background">
      <HeaderTile title="Help & Support" foot="We're here to help you succeed" />

      <ScrollView
        className="flex-1 px-3 sm:px-6 py-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Search */}

        {/* Search Bar */}
        <View className='px-0 mb-4 sm:px-8 sm:mb-6'>
          <Input
            leftIcon={Search}
            placeholder="Search for help..."
            placeholderTextColor="#6b7280"
            iconColor='#6b7280'

            className="text-sm sm:text-base text-foreground rounded-lg bg-card border border-border"
          />
        </View>

        {/* FAQs */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4 ">
          <View className="flex-row items-center mb-4">
            <HelpCircle size={24} color="#3b82f6" />
            <Text className="text-lg font-bold text-foreground ml-3">
              Frequently Asked Questions
            </Text>
          </View>
          {faqs.map((faq) => (
            <FaqItem key={faq.id} faq={faq} />
          ))}
        </View>

        {/* Contact Support */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-lg font-bold mb-4 text-foreground">
            Contact Support
          </Text>
          {contactOptions.map((option, index) => (
            <ContactOption key={index} option={option} />
          ))}
        </View>

        {/* System Status */}
        <View className="bg-card border border-border rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm font-semibold text-foreground">
                System Status
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">
                All systems operational
              </Text>
            </View>
            <View className="w-3 h-3 rounded-full bg-green-500" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
