import { useEffect, useRef, useState } from 'react';
import { AppState, Platform, Alert } from 'react-native';
import { attemptAPI } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface AntiCheatViolation {
  type: 'window_switch' | 'tab_switch' | 'screenshot' | 'copy' | 'paste' | 'phone_call' | 'visibility_change';
  timestamp: string;
  details?: string;
}

interface UseAntiCheatOptions {
  attemptId?: number;
  enabled: boolean;
  onViolation?: (violation: AntiCheatViolation) => void;
}

export function useAntiCheat({ attemptId, enabled, onViolation }: UseAntiCheatOptions) {
  const [violations, setViolations] = useState<AntiCheatViolation[]>([]);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exitedFullscreen, setExitedFullscreen] = useState(false);
  const lastViolationTime = useRef<number>(0);
  const violationCooldown = 2000; // 2 seconds between same violation types

  // Log violation to backend
  const logViolation = async (type: AntiCheatViolation['type'], details?: string) => {
    if (!enabled || !attemptId) return;

    // Prevent spam violations
    const now = Date.now();
    if (now - lastViolationTime.current < violationCooldown) return;
    lastViolationTime.current = now;

    const violation: AntiCheatViolation = {
      type,
      timestamp: new Date().toISOString(),
      details,
    };

    setViolations(prev => [...prev, violation]);
    onViolation?.(violation);

    try {
      await attemptAPI.logViolation(attemptId, {
        violation_type: type,
        details,
        timestamp: violation.timestamp,
      });
      
      showToast.warning(
        getViolationMessage(type),
        { title: '⚠️ Violation Detected' }
      );
      } catch (error) {
        showToast.error('Failed to log violation', { title: 'Error' });
      }
  };

  const getViolationMessage = (type: AntiCheatViolation['type']): string => {
    const messages = {
      window_switch: 'Window switch detected and recorded',
      tab_switch: 'Tab switch detected and recorded',
      screenshot: 'Screenshot attempt blocked and logged',
      copy: 'Copy attempt blocked and logged',
      paste: 'Paste attempt blocked and logged',
      phone_call: 'Phone call detected and recorded',
      visibility_change: 'Page visibility change recorded',
    };
    return messages[type] || 'Violation detected and recorded';
  };

  // ==================== WEB ANTI-CHEAT ====================
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;

    // Request Fullscreen on Enable
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch (error) {
        showToast.error('Could not enter fullscreen', { title: 'Error' });
      }
    };

    enterFullscreen();

    // Fullscreen Change Detection
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && enabled) {
        setExitedFullscreen(true);
        logViolation('window_switch', 'Exited fullscreen mode');
        
        // Show prominent warning
        showToast.error(
          'You exited fullscreen! This has been recorded as a violation.',
          { 
            title: '⚠️ FULLSCREEN REQUIRED',
            duration: 5000
          }
        );
      } else if (isCurrentlyFullscreen && exitedFullscreen) {
        // User returned to fullscreen - clear the warning
        setExitedFullscreen(false);
      }
    };

    // Tab Visibility Detection
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsTabVisible(isVisible);
      
      if (!isVisible) {
        logViolation('tab_switch', `Tab became ${document.visibilityState}`);
      }
    };

    // Window Blur Detection (switching windows)
    const handleWindowBlur = () => {
      logViolation('window_switch', 'Window lost focus');
    };

    // Screenshot Detection (keyboard shortcuts)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect common screenshot shortcuts
      const isScreenshot = 
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.shiftKey && e.key === '3') ||
        (e.metaKey && e.shiftKey && e.key === '4') ||
        (e.ctrlKey && e.key === 'PrintScreen') ||
        (e.altKey && e.key === 'PrintScreen') ||
        ((e.key === 's' || e.key === 'S') && e.shiftKey && e.metaKey);

      if (isScreenshot) {
        e.preventDefault();
        logViolation('screenshot', `Screenshot attempt detected: ${e.key}`);
        
        // Show warning toast
        showToast.error(
          'Screenshots are not allowed during the test!',
          { 
            title: '📸 Screenshot Blocked',
            duration: 4000
          }
        );
      }

      // Detect copy attempts
      const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';
      if (isCopy) {
        e.preventDefault();
        logViolation('copy', 'Copy attempt via keyboard');
      }

      // Detect paste attempts
      const isPaste = (e.ctrlKey || e.metaKey) && e.key === 'v';
      if (isPaste) {
        e.preventDefault();
        logViolation('paste', 'Paste attempt via keyboard');
      }
    };

    // Context Menu (right-click) Prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation('screenshot', 'Right-click blocked');
    };

    // Copy Event Prevention
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation('copy', 'Copy event blocked');
    };

    // Paste Event Prevention
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation('paste', 'Paste event blocked');
    };

    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    // Cleanup
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [enabled, attemptId]);

  // ==================== MOBILE ANTI-CHEAT ====================
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let lastState = AppState.currentState;
    let backgroundTime: number | null = null;

    // App State Detection (background/foreground)
    // This also indirectly detects phone calls as they put the app in background
    const subscription = AppState.addEventListener('change', (nextAppState) => {

      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background - could be phone call, home button, or other app
        backgroundTime = Date.now();
        logViolation('window_switch', `App state: ${nextAppState}`);
        
        // Show toast notification
        showToast.warning(
          'App switch detected. This has been recorded.',
          { title: '⚠️ Violation Detected' }
        );
      } else if (nextAppState === 'active' && lastState !== 'active') {
        // App returned to foreground
        if (backgroundTime) {
          const duration = Math.round((Date.now() - backgroundTime) / 1000);
          backgroundTime = null;
        }
      }

      lastState = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, attemptId]);

  // ==================== PHONE CALL DETECTION ====================
  // TEMPORARILY DISABLED: react-native-call-detection incompatible with Expo/React Native 0.81.4
  // Error: BatchedBridge.registerCallableModule is not a function
  // 
  // The library uses deprecated BatchedBridge API that doesn't exist in newer RN versions
  // Alternative solutions needed:
  // 1. Use expo-phone-call-detection (if available)
  // 2. Build custom native module
  // 3. Use AppState changes as proxy for call detection
  // 
  // For now, other anti-cheat features remain active:
  // ✅ Screenshot detection
  // ✅ App switch detection (AppState monitoring)
  // ✅ Tab visibility (web)
  // ✅ Fullscreen exit detection (web)
  
  // TODO: Re-implement when compatible library is available or build custom module

  // ==================== SCREENSHOT DETECTION (Mobile) ====================
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let screenshotListener: { remove: () => void } | null = null;
    let isPreventionEnabled = false;

    // iOS/Android screenshot detection using expo-screen-capture
    const setupScreenshotDetection = async () => {
      try {
        const ScreenCapture = require('expo-screen-capture');
        
        if (!ScreenCapture) {
          return;
        }

        const { addScreenshotListener, preventScreenCaptureAsync, allowScreenCaptureAsync } = ScreenCapture;
        
        // Check if functions exist
        if (!preventScreenCaptureAsync || !addScreenshotListener || !allowScreenCaptureAsync) {
          return;
        }

        // Prevent screenshots from being taken
        try {
          await preventScreenCaptureAsync();
          isPreventionEnabled = true;
        } catch (error) {
          showToast.error('Could not enable screenshot prevention', { title: 'Error' });
        }

        // Add listener for screenshot attempts (will still detect on iOS even when prevented)
        try {
          screenshotListener = addScreenshotListener(() => {
            logViolation('screenshot', 'Screenshot attempt detected on mobile');
            
            // Show alert on mobile
            Alert.alert(
              '📸 Screenshot Blocked',
              'Screenshots are not allowed during the test. This attempt has been recorded.',
              [{ text: 'OK' }]
            );
          });
        } catch (error) {
          showToast.error('Could not add screenshot listener', { title: 'Error' });
        }

        // Cleanup function to re-allow screenshots when test ends
        return async () => {
          if (screenshotListener) {
            try {
              screenshotListener.remove();
            } catch (error) {
              showToast.error('Error removing screenshot listener', { title: 'Error' });
            }
          }
          if (isPreventionEnabled) {
            try {
              await allowScreenCaptureAsync();
            } catch (error) {
              showToast.error('Error disabling screenshot prevention', { title: 'Error' });
            }
          }
        };
      } catch (error) {
        showToast.error('Screenshot detection setup failed', { title: 'Error' });
        return () => {}; // Return empty cleanup
      }
    };

    const cleanup = setupScreenshotDetection();

    return () => {
      cleanup.then(fn => fn?.()).catch(err => {
        showToast.error('Error during screenshot detection cleanup', { title: 'Error' });
      });
    };
  }, [enabled, attemptId]);

  return {
    violations,
    violationCount: violations.length,
    isTabVisible,
    isFullscreen,
    exitedFullscreen,
    logViolation,
  };
}
