
import React from 'react';
import { VISUAL_STANDARDS } from '../styles';

interface TextProps {
  children: React.ReactNode;
  className?: string;
}

export const H1: React.FC<TextProps> = ({ children, className = "" }) => (
  <h1 className={`${VISUAL_STANDARDS.h1} ${className}`}>{children}</h1>
);

export const H2: React.FC<TextProps> = ({ children, className = "" }) => (
  <h2 className={`${VISUAL_STANDARDS.h2} ${className}`}>{children}</h2>
);

export const P: React.FC<TextProps> = ({ children, className = "" }) => (
  <p className={`${VISUAL_STANDARDS.p} ${className}`}>{children}</p>
);
