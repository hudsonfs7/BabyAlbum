
import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { Gender, ThemeContextType } from './types';
import { VISUAL_STANDARDS } from './styles';
import { NavigationBar } from '@capgo/capacitor-navigation-bar';
import { Capacitor } from '@capacitor/core';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gender, setGender] = useState<Gender>(Gender.BOY);

  const theme = useMemo(() => {
    const activeTheme = VISUAL_STANDARDS.themes[gender];
    return {
      gender,
      setGender,
      colors: activeTheme
    };
  }, [gender]);

  // Atualiza a cor da barra de navegação quando o tema muda
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const updateNavBar = async () => {
        try {
          // Define a cor baseada no tema (azul ou rosa claro)
          // Usamos os códigos hexadecimais diretos dos temas definidos em styles.ts
          // Menino: bg-blue-50 (#eff6ff) | Menina: bg-pink-50 (#fdf2f8)
          const color = gender === Gender.BOY ? '#eff6ff' : '#fdf2f8';
          
          await NavigationBar.setBackgroundColor({ color: color });
          
          // Define os ícones como escuros (já que o fundo é claro)
          if (typeof NavigationBar.setDarkButtons === 'function') {
             await NavigationBar.setDarkButtons(); 
          }
        } catch (error) {
          console.error("Erro ao configurar NavigationBar:", error);
        }
      };
      updateNavBar();
    }
  }, [gender]);

  return (
    <ThemeContext.Provider value={theme}>
      <div 
        className={`min-h-screen ${theme.colors.bg} ${theme.colors.text} theme-transition relative overflow-x-hidden`}
        style={{ 
          backgroundImage: theme.colors.pattern,
          backgroundSize: '120px 120px'
        }}
      >
        {/* Animated Clouds Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[10%] -left-20 w-64 h-32 bg-white/60 rounded-full blur-3xl animate-[pulse_8s_infinite]"></div>
          <div className="absolute top-[40%] -right-20 w-80 h-40 bg-white/50 rounded-full blur-3xl animate-[pulse_12s_infinite]"></div>
          <div className="absolute bottom-[20%] left-[10%] w-56 h-28 bg-white/40 rounded-full blur-2xl animate-[pulse_10s_infinite]"></div>
        </div>
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
