import React, { useState } from 'react';
import { View, Text, Pressable, Modal, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar, Clock } from 'lucide-react-native';

interface DateTimePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  className?: string;
}

export function DateTimePicker({ 
  label, 
  value, 
  onChange, 
  mode = 'datetime',
  minimumDate,
  className = '' 
}: DateTimePickerProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState(value);

  // Format date for display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time for display
  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    };
    return date.toLocaleTimeString('en-US', options);
  };

  // Generate arrays for pickers
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleDateChange = () => {
    onChange(tempDate);
    setShowDatePicker(false);
    if (mode === 'datetime') {
      setShowTimePicker(true);
    }
  };

  const handleTimeChange = () => {
    onChange(tempDate);
    setShowTimePicker(false);
  };

  const updateTempDate = (field: 'year' | 'month' | 'day' | 'hour' | 'minute', value: number) => {
    const newDate = new Date(tempDate);
    switch (field) {
      case 'year':
        newDate.setFullYear(value);
        break;
      case 'month':
        newDate.setMonth(value);
        break;
      case 'day':
        newDate.setDate(value);
        break;
      case 'hour':
        newDate.setHours(value);
        break;
      case 'minute':
        newDate.setMinutes(value);
        break;
    }
    setTempDate(newDate);
  };

  return (
    <View className={className}>
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      
      <View className="flex-row gap-2">
        {(mode === 'date' || mode === 'datetime') && (
          <Pressable
            onPress={() => {
              setTempDate(value);
              setShowDatePicker(true);
            }}
            className="flex-1 flex-row items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3"
          >
            <Calendar size={20} color="#6366f1" />
            <Text className="text-gray-900">{formatDate(value)}</Text>
          </Pressable>
        )}

        {(mode === 'time' || mode === 'datetime') && (
          <Pressable
            onPress={() => {
              setTempDate(value);
              setShowTimePicker(true);
            }}
            className="flex-1 flex-row items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3"
          >
            <Clock size={20} color="#6366f1" />
            <Text className="text-gray-900">{formatTime(value)}</Text>
          </Pressable>
        )}
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-semibold text-center mb-4">Select Date</Text>
            
            <View className="flex-row justify-between mb-6">
              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium text-gray-700 mb-2">Month</Text>
                <View className="border border-gray-300 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={tempDate.getMonth()}
                    onValueChange={(value) => updateTempDate('month', value)}
                  >
                    {months.map((month, index) => (
                      <Picker.Item key={index} label={month} value={index} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="w-20 mr-2">
                <Text className="text-sm font-medium text-gray-700 mb-2">Day</Text>
                <View className="border border-gray-300 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={tempDate.getDate()}
                    onValueChange={(value) => updateTempDate('day', value)}
                  >
                    {days.map((day) => (
                      <Picker.Item key={day} label={day.toString()} value={day} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="w-24">
                <Text className="text-sm font-medium text-gray-700 mb-2">Year</Text>
                <View className="border border-gray-300 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={tempDate.getFullYear()}
                    onValueChange={(value) => updateTempDate('year', value)}
                  >
                    {years.map((year) => (
                      <Picker.Item key={year} label={year.toString()} value={year} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowDatePicker(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDateChange}
                className="flex-1 bg-indigo-600 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-white">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-semibold text-center mb-4">Select Time</Text>
            
            <View className="flex-row justify-center gap-4 mb-6">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2 text-center">Hour</Text>
                <View className="border border-gray-300 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={tempDate.getHours()}
                    onValueChange={(value) => updateTempDate('hour', value)}
                  >
                    {hours.map((hour) => (
                      <Picker.Item 
                        key={hour} 
                        label={hour.toString().padStart(2, '0')} 
                        value={hour} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-700 mb-2 text-center">Minute</Text>
                <View className="border border-gray-300 rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={tempDate.getMinutes()}
                    onValueChange={(value) => updateTempDate('minute', value)}
                  >
                    {minutes.map((minute) => (
                      <Picker.Item 
                        key={minute} 
                        label={minute.toString().padStart(2, '0')} 
                        value={minute} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowTimePicker(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-gray-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleTimeChange}
                className="flex-1 bg-indigo-600 py-3 rounded-lg"
              >
                <Text className="text-center font-semibold text-white">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

DateTimePicker.displayName = 'DateTimePicker';
