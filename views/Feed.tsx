
import React, { useEffect, useState, useRef } from 'react';
import { PostCard } from '../components/Post';
import { H1, P } from '../components/Typography';
import { Post, User, Baby } from '../types';
import { useTheme } from '../themeContext';
import { Sparkles, Baby as BabyIcon, Cloud, Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, where, getDoc, doc } from 'firebase/firestore';
import { calculateBabyAge } from '../utils/dateUtils';

export const Feed: React.FC = () => {
  const { colors, setGender } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Pull to Refresh State
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('baby_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [baby, setBaby] = useState<Baby | null>(() => {
    const saved = localStorage.getItem('baby_data');
    return saved ? JSON.parse(saved) : null;
  });

  // Atualiza tema baseado no sexo do bebê atual
  useEffect(() => {
    if (baby?.gender) {
        setGender(baby.gender);
    }
  }, [baby, setGender]);

  // Monitor de Conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user || !user.currentBabyId) {
      setLoading(false);
      return;
    }

    // Carrega dados atualizados do bebê se não tiver localmente ou para garantir sincronia
    const fetchBaby = async () => {
        try {
            const babyDoc = await getDoc(doc(db, "babies", user.currentBabyId));
            if (babyDoc.exists()) {
                const bData = { id: babyDoc.id, ...babyDoc.data() } as Baby;
                setBaby(bData);
                localStorage.setItem('baby_data', JSON.stringify(bData));
                setGender(bData.gender);
            }
        } catch(e) { console.error(e); }
    };
    fetchBaby();

    // Query unificada pelo ID do Bebê
    const q = query(
      collection(db, "posts"), 
      where("babyId", "==", user.currentBabyId)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({ id: doc.id, ...doc.data() } as Post);
      });
      postsData.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar posts:", error);
      setLoading(false);
      if (posts.length === 0) setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Lógica Pull to Refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === 0 || window.scrollY > 0) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartRef.current;
    
    if (diff > 0) {
      setPullY(Math.min(diff * 0.5, 120)); 
    }
  };

  const handleTouchEnd = () => {
    if (pullY > 80) {
      setIsRefreshing(true);
      setPullY(60); 
      setTimeout(() => {
         window.location.reload();
      }, 1000);
    } else {
      setPullY(0);
    }
    touchStartRef.current = 0;
  };

  return (
    <div 
      ref={containerRef}
      className="px-1.5 py-6 min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull To Refresh Indicator */}
      <div 
        className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none z-50 transition-transform duration-200 ease-out"
        style={{ transform: `translateY(${pullY > 0 ? pullY - 40 : -50}px)` }}
      >
        <div className={`w-10 h-10 rounded-full bg-white shadow-lg border-2 border-blue-100 flex items-center justify-center ${isRefreshing ? 'animate-spin' : ''}`}>
           {isRefreshing ? <RefreshCw size={20} className="text-blue-400" /> : <Cloud size={20} className="text-blue-300" />}
        </div>
      </div>

      <header 
        className="py-8 mb-2 flex flex-col items-center text-center transition-transform duration-300"
        style={{ transform: `translateY(${pullY * 0.3}px)` }}
      >
        <div className="relative mb-6">
          <div className={`w-20 h-20 rounded-[1.8rem] ${colors.secondary} flex items-center justify-center shadow-lg ring-8 ring-white rotate-6 overflow-hidden`}>
            {baby?.avatar ? (
              <img src={baby.avatar} className="w-full h-full object-cover" />
            ) : (
              <BabyIcon size={40} className={colors.accent} />
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
           
           {baby?.birthDate && (
             <div className={`text-[10px] font-bold uppercase tracking-widest opacity-30`}>
               {baby.name} • {calculateBabyAge(baby.birthDate)}
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
        !isOnline ? (
          <div className="text-center py-20 mx-4 animate-in fade-in duration-500">
             <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <WifiOff size={32} className="text-red-300" />
             </div>
             <P className="text-gray-500 font-bold mb-1">Sem conexão</P>
             <P className="text-xs text-gray-400 max-w-[200px] mx-auto">
               Não conseguimos carregar suas memórias. Verifique sua internet.
             </P>
             <button 
               onClick={() => window.location.reload()}
               className="mt-6 px-6 py-2 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-500 shadow-sm active:scale-95 transition-transform"
             >
               Tentar de novo
             </button>
          </div>
        ) : (
          <div className="text-center py-20 bg-white/40 rounded-[3rem] border-4 border-dashed border-white mx-2 animate-in fade-in duration-500">
            <Cloud size={60} className="mx-auto mb-4 opacity-10" />
            <P className="text-gray-400">Nenhuma memória ainda.<br/>Que tal guardar a primeira?</P>
          </div>
        )
      ) : (
        <>
          {!isOnline && (
            <div className="mb-4 mx-4 bg-red-50 border border-red-100 p-2 rounded-xl flex items-center justify-center gap-2">
              <WifiOff size={12} className="text-red-400" />
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Modo Offline</span>
            </div>
          )}
          
          <div className="space-y-4 transition-transform duration-300" style={{ transform: `translateY(${pullY * 0.1}px)` }}>
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                currentUser={user!} 
                isFriend={true}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
