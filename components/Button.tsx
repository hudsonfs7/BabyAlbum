
import React from 'react';
import { useTheme } from '../themeContext';
import { VISUAL_STANDARDS } from '../styles';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = "", 
  ...props 
}) => {
  const { colors } = useTheme();
  
  const variantStyles = {
    primary: `${colors.primary} ${colors.buttonText} shadow-lg shadow-${colors.primary.split('-')[1]}/30`,
    secondary: `${colors.secondary} ${colors.accent}`,
    outline: `bg-transparent border-2 ${colors.border} ${colors.accent}`
  };

  return (
    <button 
      className={`${VISUAL_STANDARDS.button} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
