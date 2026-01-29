import { View, ScrollView, Linking } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Globe,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from 'lucide-react-native';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import HeaderTile from '@/components/ui/headerTile';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function ContactPage() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { showAlert } = useCustomAlert();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  });

  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
  }, [user, router]);

  const handleSendMessage = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      showAlert('Validation Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsSending(true);
      await api.post('/contact', formData);

      showAlert('Success', 'Your message has been sent! We\'ll get back to you soon.');
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      });
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'support@quizportal.com',
      action: () => Linking.openURL('mailto:support@quizportal.com'),
      color: '#3b82f6',
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      action: () => Linking.openURL('tel:+15551234567'),
      color: '#10b981',
    },
    {
      icon: MapPin,
      title: 'Address',
      value: '123 Education St, Learning City, LC 12345',
      action: () => Linking.openURL('https://maps.google.com'),
      color: '#ef4444',
    },
    {
      icon: Globe,
      title: 'Website',
      value: 'www.quizportal.com',
      action: () => Linking.openURL('https://quizportal.com'),
      color: '#8b5cf6',
    },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      name: 'Facebook',
      color: '#1877f2',
      url: 'https://facebook.com/quizportal',
    },
    {
      icon: Twitter,
      name: 'Twitter',
      color: '#1da1f2',
      url: 'https://twitter.com/quizportal',
    },
    {
      icon: Instagram,
      name: 'Instagram',
      color: '#e4405f',
      url: 'https://instagram.com/quizportal',
    },
    {
      icon: Linkedin,
      name: 'LinkedIn',
      color: '#0077b5',
      url: 'https://linkedin.com/company/quizportal',
    },
  ];

  const ContactInfoCard = ({ info }: any) => (
    <Button
      onPress={info.action}
      variant="outline"
      className="bg-card border border-border rounded-xl p-4 mb-3 w-full flex-1 h-full justify-start"
    >
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: `${info.color}15` }}
        >
          <info.icon size={24} color={info.color} />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground mb-1">
            {info.title}
          </Text>
          <Text className="font-semibold text-foreground">
            {info.value}
          </Text>
        </View>
      </View>
    </Button>
  );

  const SocialButton = ({ social }: any) => (
    <Button
      onPress={() => Linking.openURL(social.url)}
      variant="ghost"
      size="icon"
      className="w-14 h-14 rounded-xl items-center justify-center"
      style={{ backgroundColor: `${social.color}15` }}
    >
      <social.icon size={24} color={social.color} />
    </Button>
  );

  return (
    <View className="flex-1 bg-background">
      <HeaderTile title="Contact Us" foot="Get in touch with our team" />

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Info Cards */}
        <View className="mt-4 mb-4">
          {contactInfo.map((info, index) => (
            <ContactInfoCard key={index} info={info} />
          ))}
        </View>

        {/* Contact Form */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <View className="flex-row items-center mb-4">
            <MessageCircle size={24} color="#3b82f6" />
            <Text className="text-lg font-bold text-foreground ml-3">
              Send us a Message
            </Text>
          </View>

          <Input
            label="Name"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Your name"
            containerClassName="mb-4"
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            containerClassName="mb-4"
          />

          <Input
            label="Subject"
            value={formData.subject}
            onChangeText={(text) => setFormData({ ...formData, subject: text })}
            placeholder="What is this about?"
            containerClassName="mb-4"
          />

          <TextArea
            label="Message"
            value={formData.message}
            onChangeText={(text) => setFormData({ ...formData, message: text })}
            placeholder="Tell us more..."
            numberOfLines={6}
            containerClassName="mb-4"
          />

          <Button
            onPress={handleSendMessage}
            disabled={isSending}
            className="bg-primary"
          >
            <View className="flex-row items-center justify-center">
              <Send size={20} color="#ffffff" />
              <Text className="text-base font-bold text-primary-foreground ml-2">
                {isSending ? 'Sending...' : 'Send Message'}
              </Text>
            </View>
          </Button>
        </View>

        {/* Social Media */}
        <View className="bg-card border border-border rounded-2xl p-4 mb-4">
          <Text className="text-lg font-bold mb-4 text-foreground">
            Follow Us
          </Text>
          <View className="flex-row gap-2 sm:gap-4">
            {socialLinks.map((social, index) => (
              <SocialButton key={index} social={social} />
            ))}
          </View>
        </View>

        {/* Office Hours */}
        <View className="bg-card border border-border rounded-2xl p-4">
          <Text className="text-lg font-bold mb-3 text-foreground">
            Office Hours
          </Text>

          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-muted-foreground">Monday - Friday</Text>
            <Text className="font-semibold text-foreground">9:00 AM - 6:00 PM</Text>
          </View>

          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-muted-foreground">Saturday</Text>
            <Text className="font-semibold text-foreground">10:00 AM - 4:00 PM</Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className="text-muted-foreground">Sunday</Text>
            <Text className="font-semibold text-foreground">Closed</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
