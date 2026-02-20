
export enum Gender {
  BOY = 'BOY',
  GIRL = 'GIRL'
}

export type ParentRole = 'Papai' | 'Mamãe' | 'Titio' | 'Titia' | 'Avô' | 'Avó' | 'Padrinho' | 'Madrinha' | 'Amigo' | 'ADMIN';
export type PersonaType = 'Coruja' | 'Girafa' | 'Coelho' | 'Urso' | 'Leão' | 'Elefante' | 'SISTEMA';
export type PrivacyLevel = 'PUBLIC' | 'PRIVATE' | 'FAMILY';

// --- NOVA ENTIDADE MESTRA ---
export interface Baby {
  id: string;
  uniqueCode: string; // Ex: #CLARICE-99
  name: string;
  birthDate: string; // ISO Date
  gender: Gender;
  avatar: string;
  createdByUserId: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string; 
  searchName: string; // NOVO: Nome em minúsculo para busca
  email: string;
  avatar: string; 
  role: ParentRole;
  persona: PersonaType;
  
  // Vínculo
  currentBabyId: string; 
  
  friends: string[]; // Lista de IDs de amigos (ACEITOS)
  storyVisibility: PrivacyLevel;
  createdAt: number;
}

// NOVA ENTIDADE: Solicitação de Amizade
export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string; // Quem recebe
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: number;
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
  babyId: string; 
  userName: string; 
  userAvatar: string;
  photoUrl: string;
  cropConfig?: {
    zoom: number;
    x: number;
    y: number;
  };
  caption: string;
  story?: string;
  location?: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  createdAt: number;
}

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  type: 'INVITE' | 'NEW_POST' | 'LIKE';
  message: string;
  babyId?: string;
  postId?: string;
  read: boolean;
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
