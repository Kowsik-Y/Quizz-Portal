import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';

export interface MonacoEditorProps {
    value: string;
    language?: string;
    theme?: 'vs-dark' | 'vs-light';
    onChange?: (value: string) => void;
    style?: any;
}

// -----------------------------------------------------------------------------------------
// WEB IMPLEMENTATION
// Uses the official React wrapper which is highly optimized for browser environments.
// -----------------------------------------------------------------------------------------

const WebMonaco = React.lazy(() => import('@monaco-editor/react').then(module => ({ default: module.Editor })));

const MonacoEditorWeb: React.FC<MonacoEditorProps> = ({ value, language, theme, onChange, style }) => {
    return (
        <View style={[styles.container, style]}>
            <React.Suspense fallback={<View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0000ff" /></View>}>
                <WebMonaco
                    height="100%"
                    language={language}
                    theme={theme === 'vs-dark' ? 'vs-dark' : 'light'}
                    value={value}
                    onChange={(val) => onChange && onChange(val || '')}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: 'on',
                    }}
                />
            </React.Suspense>
        </View>
    );
};

// -----------------------------------------------------------------------------------------
// NATIVE IMPLEMENTATION (iOS & Android)
// Uses react-native-webview to embed Monaco via CDN.
// -----------------------------------------------------------------------------------------

const MonacoEditorNative: React.FC<MonacoEditorProps> = ({ value, language = 'javascript', theme = 'vs-dark', onChange, style }) => {
    // We require WebView lazily here so that Webpack/Metro doesn't try to bundle it for web.
    const { WebView } = require('react-native-webview');
    const webViewRef = useRef<any>(null);

    useEffect(() => {
        if (webViewRef.current) {
            const script = `
        if (window.editor) {
          if (window.editor.getValue() !== \`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`) {
            window.editor.setValue(\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
          }
          monaco.editor.setModelLanguage(window.editor.getModel(), '${language}');
          monaco.editor.setTheme('${theme}');
        }
        true;
      `;
            webViewRef.current.injectJavaScript(script);
        }
    }, [value, language, theme]);

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          width: 100%;
          overflow: hidden;
          background-color: ${theme === 'vs-dark' ? '#1e1e1e' : '#fffffe'};
        }
        #container { height: 100%; width: 100%; }
        #loading {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          font-family: sans-serif; color: ${theme === 'vs-dark' ? '#ffffff' : '#000000'};
        }
      </style>
    </head>
    <body>
      <div id="loading">Loading Editor...</div>
      <div id="container"></div>
      <script>var require = { paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } };</script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.nls.js"></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/editor/editor.main.js"></script>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          require(['vs/editor/editor.main'], function() {
            document.getElementById('loading').style.display = 'none';
            window.editor = monaco.editor.create(document.getElementById('container'), {
              value: \`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
              language: '${language}',
              theme: '${theme}',
              automaticLayout: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              wordWrap: 'on',
              lineNumbersMinChars: 3,
            });
            window.editor.onDidChangeModelContent(() => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'onChange', value: window.editor.getValue() }));
            });
          });
        });
      </script>
    </body>
    </html>
  `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'onChange' && onChange) {
                onChange(data.value);
            }
        } catch (e) {
            console.warn('Failed to parse message', e);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                source={{ html }}
                style={styles.webview}
                onMessage={handleMessage}
                originWhitelist={['*']}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                )}
            />
        </View>
    );
};

export const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
    if (Platform.OS === 'web') {
        return <MonacoEditorWeb {...props} />;
    }
    return <MonacoEditorNative {...props} />;
};

const styles = StyleSheet.create({
    container: { flex: 1, overflow: 'hidden', backgroundColor: '#1e1e1e' },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
    },
});
