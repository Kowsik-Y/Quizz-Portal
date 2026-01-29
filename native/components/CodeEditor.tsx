import React, { useState, useEffect } from 'react';
import { View, TextInput, Platform, Text as RNText, ScrollView, TouchableOpacity } from 'react-native';
import { Copy, RotateCcw, Maximize2, Minimize2, Lightbulb, Wand2 } from 'lucide-react-native';

export interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  language: string;
  placeholder?: string;
  readOnly?: boolean;
  minHeight?: number;
}


const getMonospaceFont = () => {
  return 'JetBrainsMono_500Medium';
};

// Autocomplete suggestions for each language
const autocompleteSuggestions: Record<string, string[]> = {
  javascript: [
    'console.log()', 'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
    'return', 'async', 'await', 'try', 'catch', 'import', 'export', 'class', 'this',
    'new', 'typeof', 'instanceof', 'Array', 'Object', 'String', 'Number'
  ],
  python: [
    'print()', 'def', 'class', 'if', 'else', 'elif', 'for', 'while', 'return',
    'import', 'from', 'as', 'try', 'except', 'with', 'lambda', 'yield', 'async',
    'await', 'self', 'True', 'False', 'None', 'len()'
  ],
  java: [
    'System.out.println()', 'public', 'private', 'protected', 'class', 'interface',
    'extends', 'implements', 'static', 'final', 'void', 'int', 'String', 'boolean',
    'if', 'else', 'for', 'while', 'return', 'new', 'this', 'super', 'try', 'catch'
  ],
  cpp: [
    'cout', 'cin', 'endl', 'using namespace std', 'include', 'int', 'void', 'char',
    'float', 'double', 'class', 'public', 'private', 'protected', 'if', 'else',
    'for', 'while', 'return', 'new', 'delete', 'this', 'nullptr'
  ],
  c: [
    'printf()', 'scanf()', 'include', 'int', 'void', 'char', 'float', 'double',
    'if', 'else', 'for', 'while', 'return', 'malloc()', 'free()', 'sizeof', 'struct'
  ]
};

// Syntax highlighting patterns for each language
const syntaxPatterns: Record<string, { pattern: string; color: string }[]> = {
  javascript: [
    { pattern: '//.*', color: '#8b949e' },
    { pattern: '/\\*[\\s\\S]*?\\*/', color: '#8b949e' },
    { pattern: '\\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|class|extends|import|export|from|async|await|yield|typeof|instanceof|void|delete|in|of)\\b', color: '#ff7b72' },
    { pattern: '"[^"\\\\]*(\\\\.[^"\\\\]*)*"', color: '#a5d6ff' },
    { pattern: "'[^'\\\\]*(\\\\.[^'\\\\]*)*'", color: '#a5d6ff' },
    { pattern: '`[^`\\\\]*(\\\\.[^`\\\\]*)*`', color: '#a5d6ff' },
    { pattern: '\\b\\d+\\.?\\d*\\b', color: '#79c0ff' },
    { pattern: '\\b(true|false|null|undefined|NaN|Infinity)\\b', color: '#79c0ff' },
    { pattern: '\\b(console|Array|Object|String|Number|Boolean|Date|Math|JSON|Promise|Set|Map|WeakSet|WeakMap|Symbol|Error|RegExp)\\b', color: '#d2a8ff' }
  ],
  python: [
    { pattern: '#.*', color: '#8b949e' },
    { pattern: '"""[\\s\\S]*?"""', color: '#8b949e' },
    { pattern: "'''[\\s\\S]*?'''", color: '#8b949e' },
    { pattern: '\\b(def|class|if|elif|else|for|while|break|continue|return|import|from|as|try|except|finally|raise|with|lambda|yield|async|await|pass|del|global|nonlocal|assert|in|is|not|and|or)\\b', color: '#ff7b72' },
    { pattern: '"[^"\\\\]*(\\\\.[^"\\\\]*)*"', color: '#a5d6ff' },
    { pattern: "'[^'\\\\]*(\\\\.[^'\\\\]*)*'", color: '#a5d6ff' },
    { pattern: '\\b\\d+\\.?\\d*\\b', color: '#79c0ff' },
    { pattern: '\\b(True|False|None)\\b', color: '#79c0ff' },
    { pattern: '\\b(print|len|range|str|int|float|list|dict|set|tuple|type|isinstance|enumerate|zip|map|filter|sorted|sum|min|max|abs|round|open|input)\\b', color: '#d2a8ff' }
  ],
  java: [
    { pattern: '//.*', color: '#8b949e' },
    { pattern: '/\\*[\\s\\S]*?\\*/', color: '#8b949e' },
    { pattern: '\\b(public|private|protected|static|final|abstract|synchronized|volatile|transient|native|strictfp|class|interface|extends|implements|enum|package|import|void|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|throws|new|this|super|instanceof)\\b', color: '#ff7b72' },
    { pattern: '"[^"\\\\]*(\\\\.[^"\\\\]*)*"', color: '#a5d6ff' },
    { pattern: "'[^'\\\\]*(\\\\.[^'\\\\]*)*'", color: '#a5d6ff' },
    { pattern: '\\b\\d+\\.?\\d*[fFdDlL]?\\b', color: '#79c0ff' },
    { pattern: '\\b(true|false|null)\\b', color: '#79c0ff' },
    { pattern: '\\b(int|long|short|byte|float|double|boolean|char|String)\\b', color: '#ffa657' },
    { pattern: '\\b(System|Math|String|Integer|Double|Boolean|Character|Object|Thread|Exception|ArrayList|HashMap|List|Map|Set)\\b', color: '#d2a8ff' }
  ],
  cpp: [
    { pattern: '//.*', color: '#8b949e' },
    { pattern: '/\\*[\\s\\S]*?\\*/', color: '#8b949e' },
    { pattern: '#\\s*(include|define|ifdef|ifndef|endif|pragma)\\b.*', color: '#d2a8ff' },
    { pattern: '\\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|class|namespace|public|private|protected|virtual|override|final|using|try|catch|throw|new|delete|this|template|typename)\\b', color: '#ff7b72' },
    { pattern: '"[^"\\\\]*(\\\\.[^"\\\\]*)*"', color: '#a5d6ff' },
    { pattern: "'[^'\\\\]*(\\\\.[^'\\\\]*)*'", color: '#a5d6ff' },
    { pattern: '\\b\\d+\\.?\\d*[fFlLuU]*\\b', color: '#79c0ff' },
    { pattern: '\\b(true|false|nullptr|NULL)\\b', color: '#79c0ff' },
    { pattern: '\\b(std|cout|cin|endl|vector|string|map|set|pair|queue|stack|deque|list|array)\\b', color: '#d2a8ff' }
  ],
  c: [
    { pattern: '//.*', color: '#8b949e' },
    { pattern: '/\\*[\\s\\S]*?\\*/', color: '#8b949e' },
    { pattern: '#\\s*(include|define|ifdef|ifndef|endif|pragma)\\b.*', color: '#d2a8ff' },
    { pattern: '\\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|restrict|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\\b', color: '#ff7b72' },
    { pattern: '"[^"\\\\]*(\\\\.[^"\\\\]*)*"', color: '#a5d6ff' },
    { pattern: "'[^'\\\\]*(\\\\.[^'\\\\]*)*'", color: '#a5d6ff' },
    { pattern: '\\b\\d+\\.?\\d*[fFlLuU]*\\b', color: '#79c0ff' },
    { pattern: '\\b(NULL)\\b', color: '#79c0ff' },
    { pattern: '\\b(printf|scanf|malloc|free|sizeof|memcpy|memset|strlen|strcpy|strcmp|strcat|FILE|size_t)\\b', color: '#d2a8ff' }
  ]
};



export function CodeEditor({
  value,
  onChange,
  language,
  placeholder,
  readOnly = false,
  minHeight = 400
}: CodeEditorProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(true);
  const [autocompleteOptions, setAutocompleteOptions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [forcedSelection, setForcedSelection] = useState<{ start: number; end: number } | undefined>(undefined);

  const lines = value.split('\n');
  const lineCount = lines.length || 1; // Actual line count, no minimum
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Apply syntax highlighting
  const highlightCode = (code: string): { text: string; color: string }[] => {
    if (!code) return [];
    
    const patterns = syntaxPatterns[language] || [];
    const tokens: { text: string; color: string; start: number; end: number }[] = [];
    
    // Find all matches for each pattern
    patterns.forEach(({ pattern, color }) => {
      const regex = new RegExp(pattern, 'g'); // Add 'g' flag to prevent infinite loop
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        tokens.push({
          text: match[0],
          color: color,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    });
    
    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);
    
    // Build result with highlighted tokens
    const result: { text: string; color: string }[] = [];
    let lastIndex = 0;
    
    tokens.forEach((token) => {
      // Add unhighlighted text before this token
      if (token.start > lastIndex) {
        result.push({
          text: code.substring(lastIndex, token.start),
          color: '#c9d1d9'
        });
      }
      
      // Add highlighted token
      result.push({
        text: token.text,
        color: token.color
      });
      
      lastIndex = token.end;
    });
    
    // Add remaining unhighlighted text
    if (lastIndex < code.length) {
      result.push({
        text: code.substring(lastIndex),
        color: '#c9d1d9'
      });
    }
    
    return result.length > 0 ? result : [{ text: code, color: '#c9d1d9' }];
  };

  // Get current word being typed
  useEffect(() => {
    if (!showAutocomplete || value.length === 0) {
      setAutocompleteOptions([]);
      return;
    }

    const textBeforeCursor = value.substring(0, cursorPosition);
    const words = textBeforeCursor.split(/[\s\n\r\t(){}\[\];,.<>]/);
    const currentWord = words[words.length - 1];

    if (currentWord.length >= 2) {
      const suggestions = (autocompleteSuggestions[language] || []).filter(
        suggestion => suggestion.toLowerCase().startsWith(currentWord.toLowerCase())
      );
      setAutocompleteOptions(suggestions.slice(0, 8));
    } else {
      setAutocompleteOptions([]);
    }
  }, [value, cursorPosition, language, showAutocomplete]);

  const handleTextChange = (text: string) => {
    const prevText = value;
    const closingPairs: Record<string, string> = {
      '{': '}',
      '[': ']',
      '(': ')'
    };

    const delta = text.length - prevText.length;

    // Handle auto-closing pairs - only when typing a single opening character
    if (delta === 1 && text.length > 0) {
      const insertStart = cursorPosition;
      const inserted = text.charAt(insertStart);
      const nextChar = prevText.charAt(insertStart);

      // Check if user typed a closing bracket/brace and next char matches - skip over it
      if (Object.values(closingPairs).includes(inserted) && nextChar === inserted) {
        const newCursor = insertStart + 1;
        setTimeout(() => {
          setCursorPosition(newCursor);
          setForcedSelection({ start: newCursor, end: newCursor });
          setTimeout(() => setForcedSelection(undefined), 0);
        }, 0);
        return;
      }

      // If the user typed an opening bracket/brace, auto-close it
      if (closingPairs[inserted]) {
        const closingChar = closingPairs[inserted];
        const newValue = prevText.slice(0, insertStart) + inserted + closingChar + prevText.slice(insertStart);
        onChange(newValue);

        // Place caret between the pair
        const newCursor = insertStart + 1;
        setTimeout(() => {
          setCursorPosition(newCursor);
          setForcedSelection({ start: newCursor, end: newCursor });
          setTimeout(() => setForcedSelection(undefined), 0);
        }, 0);
        return;
      }
    }

    // For all other cases, just update the value and let TextInput handle cursor naturally
    onChange(text);
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const handleKeyPress = (e: any) => {
    // Handle Tab key
    if (e.nativeEvent.key === 'Tab') {
      e.preventDefault();

      const beforeCursor = value.substring(0, cursorPosition);
      const afterCursor = value.substring(cursorPosition);
      const tabSpaces = '  '; // 2 spaces

      const newValue = beforeCursor + tabSpaces + afterCursor;
      onChange(newValue);

      // Update cursor position
      const newCursorPos = cursorPosition + tabSpaces.length;
      setTimeout(() => {
        setCursorPosition(newCursorPos);
        setForcedSelection({ start: newCursorPos, end: newCursorPos });
        setTimeout(() => setForcedSelection(undefined), 0);
      }, 0);
    }
  };

  const insertSuggestion = (suggestion: string) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const words = textBeforeCursor.split(/[\s\n\r\t(){}\[\];,.<>]/);
    const currentWord = words[words.length - 1];

    const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.length - currentWord.length);
    const newText = newTextBefore + suggestion + textAfterCursor;

    onChange(newText);
    // Move cursor to the end of the inserted suggestion
    const newCursorPos = newTextBefore.length + suggestion.length;
    setTimeout(() => {
      setCursorPosition(newCursorPos);
      setForcedSelection({ start: newCursorPos, end: newCursorPos });
      setTimeout(() => setForcedSelection(undefined), 0);
    }, 0);
    setAutocompleteOptions([]);
  };

  const handleCopy = async () => {
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(value);
    }
  };

  const handleReset = () => {
    onChange('');
  };

  // Format/Beautify code
  const formatCode = () => {
    let formatted = value;
    let indentLevel = 0;
    const indentSize = 2; // 2 spaces per indent

    // Split into lines and process each
    const lines = formatted.split('\n');
    const formattedLines = lines.map((line) => {
      let trimmed = line.trim();
      if (!trimmed) return '';

      // Decrease indent for closing braces/brackets
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Add indentation
      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;

      // Increase indent for opening braces/brackets
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indentLevel++;
      }

      // Handle else, elif, except on same level as if/try
      if (trimmed.startsWith('else') || trimmed.startsWith('elif') ||
        trimmed.startsWith('except') || trimmed.startsWith('catch') ||
        trimmed.startsWith('finally')) {
        return ' '.repeat((indentLevel - 1) * indentSize) + trimmed;
      }

      return indentedLine;
    });

    // Join lines and add spacing around operators
    formatted = formattedLines.join('\n');

    // Add spaces around operators (=, +, -, *, /, ==, !=, etc.)
    formatted = formatted.replace(/([^=!<>])=([^=])/g, '$1 = $2'); // assignment
    formatted = formatted.replace(/([^=!<>])==([^=])/g, '$1 == $2'); // equality
    formatted = formatted.replace(/!=([^=])/g, '!= $1'); // not equal
    formatted = formatted.replace(/([^<])<=([^=])/g, '$1 <= $2'); // less or equal
    formatted = formatted.replace(/([^>])>=([^=])/g, '$1 >= $2'); // greater or equal
    formatted = formatted.replace(/([^\s])\+([^\s+])/g, '$1 + $2'); // plus
    formatted = formatted.replace(/([^\s])-([^\s-])/g, '$1 - $2'); // minus
    formatted = formatted.replace(/([^\s])\*([^\s*])/g, '$1 * $2'); // multiply
    formatted = formatted.replace(/([^\s])\/([^\s/])/g, '$1 / $2'); // divide

    // Add space after commas
    formatted = formatted.replace(/,([^\s])/g, ', $1');

    // Add space after keywords
    const keywords = ['if', 'for', 'while', 'def', 'function', 'class', 'return'];
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\(`, 'g');
      formatted = formatted.replace(regex, `${keyword} (`);
    });

    // Remove multiple blank lines
    formatted = formatted.replace(/\n\s*\n\s*\n/g, '\n\n');

    onChange(formatted);
  };

  return (
    <View style={{
      borderWidth: 1,
      borderColor: isFocused ? '#58a6ff' : '#30363d',
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: '#0d1117'
    }}>
      {/* Toolbar */}
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
            {language.toUpperCase()}
          </RNText>
          <RNText style={{ color: '#8b949e', fontSize: 12 }}>
            {lineCount} lines
          </RNText>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => setShowAutocomplete(!showAutocomplete)}
            style={{ padding: 6 }}
          >
            <Lightbulb size={16} color={showAutocomplete ? '#f9826c' : '#8b949e'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={formatCode} style={{ padding: 6 }}>
            <Wand2 size={16} color="#d2a8ff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopy} style={{ padding: 6 }}>
            <Copy size={16} color="#8b949e" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReset} style={{ padding: 6 }}>
            <RotateCcw size={16} color="#8b949e" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Editor Area */}
      <ScrollView
        style={{
          flex: 1,
          maxHeight: minHeight,
          ...(Platform.OS === 'web' && {
            // @ts-ignore - Web-only scrollbar styling
            scrollbarWidth: 'thin',
            scrollbarColor: '#58a6ff #161b22'
          })
        }}
        showsVerticalScrollIndicator={true}
      >
        <View style={{ flexDirection: 'row' }}>
          {/* Line Numbers */}
          <View style={{
            backgroundColor: '#0d1117',
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRightWidth: 1,
            borderRightColor: '#30363d',
            width: 50
          }}>
            {lineNumbers.map(num => (
              <RNText key={num} style={{
                color: '#6e7681',
                fontSize: 13,
                fontFamily: getMonospaceFont(),
                lineHeight: 20,
                height: 20
              }}>
                {num}
              </RNText>
            ))}
          </View>

          {/* Code Input */}
          <View style={{ flex: 1, position: 'relative' }}>
            {/* TextInput for typing */}
            <TextInput
              value={value}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              onKeyPress={handleKeyPress}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              placeholderTextColor="#6e7681"
              multiline
              editable={!readOnly}
              scrollEnabled={false}
              {...(forcedSelection && { selection: forcedSelection })}
              style={{
                color: 'rgba(0,0,0,0)',
                fontFamily: getMonospaceFont(),
                fontSize: 13,
                lineHeight: 20,
                paddingVertical: 12,
                paddingHorizontal: 12,
                minHeight: minHeight,
                flex: 1,
                outline: 'none',
                zIndex: 2,
                caretColor: '#58a6ff',
                WebkitTextFillColor: 'transparent'
              } as any}
              selectionColor="rgba(88, 166, 255, 0.3)"
            />

            {/* Syntax Highlighting Overlay */}
            <View 
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                paddingVertical: 12,
                paddingHorizontal: 12,
                zIndex: 1
              }}
            >
              {lines.map((line, idx) => {
                const highlighted = highlightCode(line);
                return (
                  <RNText key={idx} style={{ 
                    fontFamily: getMonospaceFont(),
                    fontSize: 13,
                    lineHeight: 20,
                    height: 20
                  }}>
                    {highlighted.map((token, tokenIdx) => (
                      <RNText key={tokenIdx} style={{ color: token.color }}>
                        {token.text}
                      </RNText>
                    ))}
                    {line.length === 0 && '\n'}
                  </RNText>
                );
              })}
            </View>

            {/* Autocomplete Dropdown */}
            {autocompleteOptions.length > 0 && (
              <View style={{
                position: 'absolute',
                top: 32,
                left: 12,
                backgroundColor: '#1c2128',
                borderWidth: 1,
                borderColor: '#30363d',
                borderRadius: 6,
                maxWidth: 250,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
                zIndex: 1000
              }}>
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                  {autocompleteOptions.map((suggestion, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => insertSuggestion(suggestion)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderBottomWidth: idx < autocompleteOptions.length - 1 ? 1 : 0,
                        borderBottomColor: '#30363d',
                        backgroundColor: idx === 0 ? '#21262d' : 'transparent'
                      }}
                    >
                      <RNText style={{
                        color: '#58a6ff',
                        fontSize: 13,
                        fontFamily: getMonospaceFont()
                      }}>
                        {suggestion}
                      </RNText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Status Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#161b22',
        borderTopWidth: 1,
        borderTopColor: '#30363d'
      }}>
        <RNText style={{ color: '#8b949e', fontSize: 11 }}>
          Ln {lineCount}, Col {cursorPosition}
        </RNText>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <RNText style={{ color: '#8b949e', fontSize: 11 }}>
            {value.length} characters
          </RNText>
        </View>
      </View>
    </View>
  );
}