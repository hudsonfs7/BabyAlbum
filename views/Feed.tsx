
import React, { useEffect, useState } from 'react';
import { PostCard } from '../components/Post';
import { H1, P } from '../components/Typography';
import { Post, User } from '../types';
import { useTheme } from '../themeContext';
import { Sparkles, Baby, Cloud, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where } from 'firebase/firestore';
import { calculateBabyAge } from '../utils/dateUtils';

export const Feed: React.FC = () => {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // CORREÇÃO: Inicializa o usuário imediatamente lendo do localStorage
  // Isso evita que o estado comece como null e falhe na primeira execução do efeito
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('baby_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // LÓGICA DE ISOLAMENTO:
    // Filtra posts onde userId == id do usuário atual.
    // Removido orderBy do servidor para evitar erro de índice composto. 
    // A ordenação é feita no cliente.
    const q = query(
      collection(db, "posts"), 
      where("userId", "==", user.id)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      
      // Ordenação no cliente (mais recente primeiro)
      postsData.sort((a, b) => b.createdAt - a.createdAt);

      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]); // Adicionada dependência 'user' para garantir execução

  return (
    <div className="px-1.5 py-6">
      <header className="py-8 mb-2 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className={`w-20 h-20 rounded-[1.8rem] ${colors.secondary} flex items-center justify-center shadow-lg ring-8 ring-white rotate-6 overflow-hidden`}>
            {user?.babyAvatar ? (
              <img src={user.babyAvatar} className="w-full h-full object-cover" />
            ) : (
              <Baby size={40} className={colors.accent} />
            )}
          </div>
          <div className="absolute -top-4 -right-4 bg-yellow-300 p-2 rounded-full shadow-md animate-bounce">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="absolute -bottom-4 -left-8 text-white/40">
            <Cloud size={32} fill="currentColor" />
          </div>
        </div>
        
        <H1 className={`text-4xl font-display ${colors.accent} mb-2`}>BabyAlbum</H1>
        
        <div className="flex flex-col items-center gap-2">
           <div className="px-6 py-2 bg-white/60 backdrop-blur-sm rounded-full border-2 border-dashed border-white flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${colors.primary} animate-pulse`}></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">Nosso Diário de Amor</span>
              <div className={`w-2 h-2 rounded-full ${colors.primary} animate-pulse`}></div>
           </div>
           
           {user?.babyBirthDate && (
             <div className={`text-[10px] font-bold uppercase tracking-widest opacity-30`}>
               {user.babyName} • {calculateBabyAge(user.babyBirthDate)}
             </div>
           )}
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <Loader2 size={40} className="animate-spin mb-4" />
          <P className="text-xs font-bold uppercase tracking-widest">Abrindo o álbum...</P>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20 bg-white/40 rounded-[3rem] border-4 border-dashed border-white mx-2">
          <Cloud size={60} className="mx-auto mb-4 opacity-10" />
          <P className="text-gray-400">Nenhuma memória ainda.<br/>Que tal guardar a primeira?</P>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={user!} 
              isFriend={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
