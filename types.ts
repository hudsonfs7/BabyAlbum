
export enum Gender {
  BOY = 'BOY',
  GIRL = 'GIRL'
}

<<<<<<< HEAD
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
=======
export type ParentRole = 'Papai' | 'Mamãe' | 'ADMIN';
export type PersonaType = 'Coruja' | 'Girafa' | 'Coelho' | 'Urso' | 'Leão' | 'Elefante' | 'SISTEMA';
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
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
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
<<<<<<< HEAD
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
=======
  userName: string; // Ex: "Papai Coruja João"
  userAvatar: string;
  photoUrl: string;
  caption: string; // Legenda curta
  story?: string; // História completa (contextualização)
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
  location?: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  createdAt: number;
}

<<<<<<< HEAD
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

=======
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
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
