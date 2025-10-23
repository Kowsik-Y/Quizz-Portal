import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { BookOpen, FileText, Check } from 'lucide-react-native';
import type { CourseMaterial } from '@/lib/types';

interface MaterialSelectorProps {
  materials: CourseMaterial[];
  selectedMaterials: number[];
  onToggleMaterial: (materialId: number) => void;
}

export function MaterialSelector({ 
  materials, 
  selectedMaterials, 
  onToggleMaterial 
}: MaterialSelectorProps) {
  return (
    <View className="bg-card rounded-xl p-4 mb-4 border border-border">
      <View className="flex-row items-center mb-4">
        <BookOpen size={20} color="#666666" />
        <Text className="text-lg font-bold ml-2">Course Materials</Text>
        <Text className="text-sm text-muted-foreground ml-auto">
          {selectedMaterials.length} selected
        </Text>
      </View>

      {materials.length === 0 ? (
        <Text className="text-muted-foreground text-center py-4">
          No materials available for this course
        </Text>
      ) : (
        <View className="gap-2">
          {materials.map((material) => (
            <Pressable
              key={material.id}
              onPress={() => onToggleMaterial(material.id)}
              className={`flex-row items-center p-3 rounded-xl border ${
                selectedMaterials.includes(material.id)
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border'
              }`}
            >
              <View className={`w-5 h-5 rounded border-2 items-center justify-center mr-3 ${
                selectedMaterials.includes(material.id)
                  ? 'bg-primary border-primary'
                  : 'border-border'
              }`}>
                {selectedMaterials.includes(material.id) && (
                  <Check size={14} color="#ffffff" />
                )}
              </View>
              <FileText size={18} color="#666666" />
              <Text className="ml-2 flex-1 font-medium">{material.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
