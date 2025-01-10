import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";

// تعريف الخط والعناوين
const FONT_FAMILY = ['Tajawal', 'sans-serif'].join(',');
const HEADINGS = {
  h1: 40,
  h2: 32,
  h3: 24,
  h4: 20,
  h5: 16,
  h6: 14
};

// إنشاء إعدادات typography
const typography = {
  fontFamily: FONT_FAMILY,
  fontSize: 12,
  ...Object.entries(HEADINGS).reduce((acc, [key, size]) => ({
    ...acc,
    [key]: {
      fontFamily: FONT_FAMILY,
      fontSize: size
    }
  }), {})
};

// إعدادات الثيم
const themeSettings = (mode) => ({
  palette: {
    mode: mode,
    ...(mode === 'dark' ? {
      // إعدادات الوضع المظلم
      primary: {
        main: '#6870fa',
        light: '#868dfb',
        dark: '#535ac8',
        lighter: 'rgba(104, 112, 250, 0.08)'
      },
      background: {
        default: '#1F2A40',
        paper: '#1F2A40'
      },
      text: {
        primary: '#fff',
        secondary: 'rgba(255, 255, 255, 0.7)'
      },
      error: {
        main: '#db4f4a',
        light: '#e2726e',
        dark: '#af3f3b',
        lighter: 'rgba(219, 79, 74, 0.1)'
      }
    } : {
      // إعدادات الوضع المضيء
      primary: {
        main: '#6870fa',
        light: '#868dfb',
        dark: '#535ac8',
        lighter: 'rgba(104, 112, 250, 0.08)'
      },
      background: {
        default: '#fcfcfc',
        paper: '#ffffff'
      },
      text: {
        primary: '#2B3445',
        secondary: '#666666'
      },
      error: {
        main: '#db4f4a',
        light: '#e2726e',
        dark: '#af3f3b',
        lighter: 'rgba(219, 79, 74, 0.1)'
      }
    })
  },
  typography,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
         
        }
      },
      variants: []
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8
        }
      }
    }
  }
});

// سياق وضع الألوان
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  // استرجاع الوضع المحفوظ من localStorage أو استخدام 'light' كقيمة افتراضية
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        const newMode = mode === "light" ? "dark" : "light";
        setMode(newMode);
        // حفظ الوضع الجديد في localStorage
        localStorage.setItem('themeMode', newMode);
      },
    }),
    [mode]
  );

  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return [theme, colorMode];
};