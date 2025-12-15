import React, { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

interface AccessibilitySettings {
  fontSize: FontSize;
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderOptimized: boolean;
}

interface AccessibilityContextType extends AccessibilitySettings {
  setFontSize: (size: FontSize) => void;
  setReducedMotion: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setScreenReaderOptimized: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const ACCESSIBILITY_STORAGE_KEY = 'wickedcrm-accessibility';

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  screenReaderOptimized: false,
};

const fontSizeMap: Record<FontSize, string> = {
  'small': '14px',
  'medium': '16px',
  'large': '18px',
  'extra-large': '20px',
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY);
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
      // Check system preferences for reduced motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return { ...defaultSettings, reducedMotion: true };
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Apply font size
    root.style.fontSize = fontSizeMap[settings.fontSize];

    // Apply reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply high contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply screen reader optimizations
    if (settings.screenReaderOptimized) {
      root.classList.add('sr-optimized');
    } else {
      root.classList.remove('sr-optimized');
    }

    // Save to localStorage
    localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const setFontSize = (size: FontSize) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  };

  const setReducedMotion = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, reducedMotion: enabled }));
  };

  const setHighContrast = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, highContrast: enabled }));
  };

  const setScreenReaderOptimized = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, screenReaderOptimized: enabled }));
  };

  const resetToDefaults = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        ...settings,
        setFontSize,
        setReducedMotion,
        setHighContrast,
        setScreenReaderOptimized,
        resetToDefaults,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
