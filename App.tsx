
<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
=======
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
import { ThemeProvider, useTheme } from './themeContext';
import { Feed } from './views/Feed';
import { CreatePost } from './views/CreatePost';
import { Profile } from './views/Profile';
import { Auth } from './views/Auth';
<<<<<<< HEAD
import { Notifications } from './views/Notifications';
import { AdminDashboard } from './views/AdminDashboard';
import { Home, Plus, User as UserIcon, Bell } from 'lucide-react';
import { VISUAL_STANDARDS } from './styles';
import { User } from './types';
import { OtaUpdater } from './components/OtaUpdater';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { App as CapacitorApp } from '@capacitor/app';
import { Toast } from '@capacitor/toast';
=======
import { AdminDashboard } from './views/AdminDashboard';
import { Home, Plus, User as UserIcon } from 'lucide-react';
import { VISUAL_STANDARDS } from './styles';
import { User } from './types';
import { OtaUpdater } from './components/OtaUpdater';
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f

const Navigation: React.FC = () => {
  const { colors } = useTheme();
  const location = useLocation();
<<<<<<< HEAD
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Monitorar notificações não lidas
  useEffect(() => {
    const saved = localStorage.getItem('baby_user');
    if (saved) {
      const user = JSON.parse(saved) as User;
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", user.id),
        where("read", "==", false)
      );
      
      const unsubscribe = onSnapshot(q, (snap) => {
        setUnreadCount(snap.size);
      });
      
      return () => unsubscribe();
    }
  }, []);
=======
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
  
  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/create', icon: Plus, label: 'Novo' },
<<<<<<< HEAD
    { path: '/notifications', icon: Bell, label: 'Notificações', badge: unreadCount },
=======
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
    { path: '/profile', icon: UserIcon, label: 'Álbum' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 px-6 pb-6 pointer-events-none">
      <div className={`bg-white/90 backdrop-blur-xl border-2 ${colors.border} rounded-[1.8rem] p-1.5 flex items-center justify-around shadow-[0_15px_30px_rgba(0,0,0,0.08)] pointer-events-auto`}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          if (item.path === '/create') {
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`w-9 h-9 rounded-xl ${colors.primary} shadow-lg flex items-center justify-center text-white ring-4 ring-white transition-all active:scale-90`}
              >
                <Icon size={18} />
              </Link>
            );
          }

          return (
            <Link 
              key={item.path} 
              to={item.path} 
<<<<<<< HEAD
              className={`${VISUAL_STANDARDS.navItem} p-2 rounded-xl relative ${isActive ? `${colors.secondary} ${colors.accent} scale-105` : 'text-gray-300'}`}
            >
              <Icon size={16} strokeWidth={isActive ? 3 : 2} />
              {item.badge !== undefined && item.badge > 0 && (
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-400 rounded-full border-2 border-white"></div>
              )}
=======
              className={`${VISUAL_STANDARDS.navItem} p-2 rounded-xl ${isActive ? `${colors.secondary} ${colors.accent} scale-105` : 'text-gray-300'}`}
            >
              <Icon size={16} strokeWidth={isActive ? 3 : 2} />
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setGender } = useTheme();
<<<<<<< HEAD
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs para acesso atualizado dentro do listener sem recriá-lo
  const locationRef = useRef(location);
  const navigateRef = useRef(navigate);
  const lastBackPressRef = useRef(0);

  useEffect(() => {
    locationRef.current = location;
    navigateRef.current = navigate;
  }, [location, navigate]);

  // Lógica do Botão Voltar (Android) - Registrado apenas uma vez
  useEffect(() => {
    const setupBackButton = async () => {
      return await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        // 1. Se não estiver na home, volta uma página
        if (locationRef.current.pathname !== '/') {
          navigateRef.current(-1);
          return;
        }

        // 2. Se estiver na home e rolado para baixo, volta ao topo
        if (window.scrollY > 100) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        // 3. Se estiver no topo da home, exige duplo clique para sair
        const now = Date.now();
        if (now - lastBackPressRef.current < 2000) {
          CapacitorApp.exitApp();
        } else {
          lastBackPressRef.current = now;
          Toast.show({
            text: 'Pressione novamente para sair',
            duration: 'short',
            position: 'bottom',
          });
        }
      });
    };

    const listenerPromise = setupBackButton();

    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  }, []); // Array vazio: executa apenas na montagem

=======

  // IMPLEMENTAÇÃO DE MODO IMERSIVO (Solicita Fullscreen na primeira interação)
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
  useEffect(() => {
    const enterFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          }
        }
      } catch (e) {
<<<<<<< HEAD
        console.log("Aguardando interação para fullscreen");
      }
    };
    document.addEventListener('click', enterFullScreen, { once: true });
    enterFullScreen();
=======
        // Interação do usuário necessária ou não suportado
        console.log("Aguardando interação para fullscreen");
      }
    };

    // Tenta entrar em fullscreen no clique (padrão Android Chrome/WebView)
    document.addEventListener('click', enterFullScreen, { once: true });
    
    // Tenta entrar imediatamente (funciona em alguns WebViews configurados)
    enterFullScreen();

>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
    return () => {
      document.removeEventListener('click', enterFullScreen);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('baby_user');
    if (saved) {
      const parsedUser = JSON.parse(saved);
      setUser(parsedUser);
<<<<<<< HEAD
=======
      // CORREÇÃO: Aplica o tema imediatamente ao carregar o usuário
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
      if (parsedUser.babyGender) {
        setGender(parsedUser.babyGender);
      }
    }
    setLoading(false);
  }, [setGender]);

  const handleLogout = () => {
    localStorage.removeItem('baby_user');
    setUser(null);
  };

  if (loading) return null;

  if (!user) {
    return <Auth onAuthSuccess={() => {
      const saved = localStorage.getItem('baby_user');
      if (saved) {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        if (parsedUser.babyGender) {
          setGender(parsedUser.babyGender);
        }
      }
    }} />;
  }

<<<<<<< HEAD
  if (user.role === 'ADMIN') {
    return <AdminDashboard onLogout={handleLogout} />;
  }
=======
  // --- GOD MODE ROUTING ---
  if (user.role === 'ADMIN') {
    return <AdminDashboard onLogout={handleLogout} />;
  }
  // ------------------------
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f

  return (
    <div className={VISUAL_STANDARDS.container}>
      <OtaUpdater />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/profile" element={<Profile />} />
<<<<<<< HEAD
        <Route path="/notifications" element={<Notifications />} />
=======
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Navigation />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;
