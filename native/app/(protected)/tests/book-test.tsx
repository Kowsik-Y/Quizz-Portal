import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, TextInput } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { testAPI, bookingAPI } from '@/lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Clock, Award, CheckCircle, XCircle } from 'lucide-react-native';
import type { Test, TestBooking } from '@/lib/types';
import { useCustomAlert } from '@/components/ui/custom-alert';

export default function BookTestScreen() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const params = useLocalSearchParams();
  const testId = params.testId ? parseInt(params.testId as string) : null;
  const { showAlert } = useCustomAlert();


  const [test, setTest] = useState<Test | null>(null);
  const [myBooking, setMyBooking] = useState<TestBooking | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (testId) {
      loadTestData();
      loadMyBooking();
    }
  }, [testId]);

  const loadTestData = async () => {
    if (!testId) return;
    try {
      const response = await testAPI.getById(testId);
      setTest(response.data.test);
    } catch (error) {
      showAlert('Error', 'Failed to load test data');
    }
  };

  const loadMyBooking = async () => {
    try {
      const response = await bookingAPI.getMyBookings();
      const booking = response.data.bookings.find((b: TestBooking) => b.test_id === testId);
      if (booking) {
        setMyBooking(booking);
      }
    } catch (error) {
      showAlert('Error', 'Failed to load your bookings');
    }
  };

  const handleBookSlot = async () => {
    if (!testId) return;

    if (!selectedDate || !selectedTime) {
      showAlert('Error', 'Please select date and time');
      return;
    }

    setLoading(true);
    try {
      const bookedSlot = `${selectedDate}T${selectedTime}:00`;
      await bookingAPI.create({
        test_id: testId,
        booked_slot: bookedSlot
      });

      showAlert('Success', 'Test slot booked successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.error || 'Failed to book slot');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    if (!myBooking) return;

    showAlert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingAPI.cancel(myBooking.id);
              showAlert('Success', 'Booking cancelled', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              showAlert('Error', error.response?.data?.error || 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  if (user?.role !== 'student') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          Only students can book test slots
        </Text>
      </View>
    );
  }

  if (!test) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Loading test...</Text>
      </View>
    );
  }

  if (test.test_type !== 'booking') {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-center text-muted-foreground">
          This test does not require booking
        </Text>
        <Button
          onPress={() => router.back()}
          className="mt-4"
        >
          <Text className="text-white">Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 bg-primary rounded-full items-center justify-center mb-4">
            <Calendar size={40} color="#ffffff" />
          </View>
          <Text className="text-3xl font-bold text-center">{test.title}</Text>
          <Text className="text-muted-foreground mt-1 text-center">
            Book Your Test Slot
          </Text>
        </View>

        {/* Test Info */}
        <View className="bg-card rounded-xl p-4 mb-4 border border-border">
          <View className="flex-row items-center gap-2 mb-2">
            <Clock size={20} color="#666666" />
            <Text className="text-foreground">Duration: {test.duration_minutes} minutes</Text>
          </View>
          <View className="flex-row items-center gap-2 mb-2">
            <Award size={20} color="#666666" />
            <Text className="text-foreground">Total Marks: {test.total_marks}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <CheckCircle size={20} color="#666666" />
            <Text className="text-foreground">Passing Score: {test.passing_score}%</Text>
          </View>
        </View>

        {/* Existing Booking */}
        {myBooking && (
          <View className={`rounded-xl p-4 mb-4 border ${
            myBooking.status === 'booked' ? 'bg-green-500/10 border-green-500' :
            myBooking.status === 'cancelled' ? 'bg-red-500/10 border-red-500' :
            'bg-blue-500/10 border-blue-500'
          }`}>
            <View className="flex-row items-center gap-2 mb-2">
              {myBooking.status === 'booked' && <CheckCircle size={24} color="#22c55e" />}
              {myBooking.status === 'cancelled' && <XCircle size={24} color="#ef4444" />}
              {myBooking.status === 'completed' && <Award size={24} color="#3b82f6" />}
              <Text className="text-lg font-bold">
                {myBooking.status === 'booked' && 'Your Booking'}
                {myBooking.status === 'cancelled' && 'Booking Cancelled'}
                {myBooking.status === 'completed' && 'Test Completed'}
              </Text>
            </View>
            
            <Text className="text-foreground mb-1">
              Slot: {new Date(myBooking.booked_slot).toLocaleString()}
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Booked on: {myBooking.created_at ? new Date(myBooking.created_at).toLocaleDateString() : 'N/A'}
            </Text>

            {myBooking.status === 'booked' && (
              <Button
                onPress={handleCancelBooking}
                variant="destructive"
              >
                <View className="flex-row items-center gap-2">
                  <XCircle size={20} color="#ffffff" />
                  <Text className="text-white font-bold">Cancel Booking</Text>
                </View>
              </Button>
            )}
          </View>
        )}

        {/* Booking Form - Only show if no active booking */}
        {(!myBooking || myBooking.status === 'cancelled') && (
          <View className="bg-card rounded-xl p-4 mb-4 border border-border">
            <Text className="text-lg font-bold mb-4">Select Slot</Text>

            {/* Date Selection */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2">Date *</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="YYYY-MM-DD (e.g., 2024-01-15)"
                value={selectedDate}
                onChangeText={setSelectedDate}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                Format: YYYY-MM-DD
              </Text>
            </View>

            {/* Time Selection */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2">Time *</Text>
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="HH:MM (e.g., 14:30)"
                value={selectedTime}
                onChangeText={setSelectedTime}
              />
              <Text className="text-xs text-muted-foreground mt-1">
                Format: HH:MM (24-hour format)
              </Text>
            </View>

            {/* Quick Time Slots */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2">Quick Select Time</Text>
              <View className="flex-row flex-wrap gap-2">
                {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    className={`px-4 py-2 rounded-lg border ${
                      selectedTime === time
                        ? 'bg-primary border-primary'
                        : 'bg-background border-border'
                    }`}
                  >
                    <Text className={selectedTime === time ? 'text-white font-semibold' : 'text-foreground'}>
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Book Button */}
            <Button
              onPress={handleBookSlot}
              disabled={loading}
            >
              <View className="flex-row items-center gap-2">
                <Calendar size={20} color="#ffffff" />
                <Text className="text-white font-bold text-base">
                  {loading ? 'Booking...' : 'Book Slot'}
                </Text>
              </View>
            </Button>
          </View>
        )}

        {/* Info */}
        <View className="bg-blue-500/10 border border-blue-500 rounded-xl p-4">
          <Text className="text-blue-600 dark:text-blue-400 font-semibold mb-2">
            ℹ️ Booking Guidelines
          </Text>
          <Text className="text-sm text-blue-600 dark:text-blue-400">
            • You can only book one slot per test{'\n'}
            • Arrive 5 minutes before your slot{'\n'}
            • Cancel at least 1 hour before if you can't make it{'\n'}
            • You can reschedule by cancelling and booking again
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

