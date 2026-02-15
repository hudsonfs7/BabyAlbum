
export enum Gender {
  BOY = 'BOY',
  GIRL = 'GIRL'
}

export type ParentRole = 'Papai' | 'Mamãe';
export type PersonaType = 'Coruja' | 'Girafa' | 'Coelho' | 'Urso' | 'Leão' | 'Elefante';
export type PrivacyLevel = 'PUBLIC' | 'PRIVATE' | 'FAMILY';

export interface User {
  id: string;
  name: string; // Nome do pai/mãe
  email: string;
  avatar: string; // Foto do pai/mãe
  role: ParentRole;
  persona: PersonaType;
  babyName: string;
  babyAvatar: string;
  babyGender: Gender;
  babyBirthDate: string; // ISO Date string
  age: string; // Adicionado para suportar visualização do perfil conforme uso em Profile.tsx
  friends: string[];
  storyVisibility: PrivacyLevel; // Nova configuração
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string; // Ex: "Papai Coruja João"
  userAvatar: string;
  photoUrl: string;
  caption: string; // Legenda curta
  story?: string; // História completa (contextualização)
  location?: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  createdAt: number;
}

export interface ThemeContextType {
  gender: Gender;
  setGender: (gender: Gender) => void;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
    border: string;
    focusRing: string;
    buttonText: string;
    pattern: string;
  };
}
