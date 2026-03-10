import React, { useState } from 'react';
import { View, Platform, Text as RNText, TouchableOpacity } from 'react-native';
import { Copy, RotateCcw, LightbulbInner, Wand2, Lightbulb } from 'lucide-react-native';
import { MonacoEditor } from './MonacoEditor';

export interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language: string;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
}

export function CodeEditor({
  value,
  onChange,
  language,
  placeholder,
  readOnly = false,
  minHeight = 400
}: CodeEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Note: We're mapping the generic language to monaco language IDs
  // In the existing code, it seems they used generic names like 'python', 'javascript', etc.
  // Monaco also uses these, so we can pass it directly.
  return (
    <View style={{
      borderWidth: 1,
      borderColor: isFocused ? '#58a6ff' : '#30363d',
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#0d1117',
      minHeight: minHeight,
      flex: 1
    }}>
      {/* Toolbar (Kept from original design) */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#161b22',
        borderBottomWidth: 1,
        borderBottomColor: '#30363d'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <RNText style={{ color: '#58a6ff', fontSize: 13, fontWeight: '600' }}>
            {language?.toUpperCase() || 'CODE'}
          </RNText>
          {/* Note: Monaco handles line count natively, so we simplify the header here */}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => onChange('')} style={{ padding: 6 }}>
            <RotateCcw size={16} color="#8b949e" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Monaco Editor Area */}
      <View style={{ flex: 1 }}>
        <MonacoEditor
          value={value}
          language={language}
          theme="vs-dark"
          onChange={onChange}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}