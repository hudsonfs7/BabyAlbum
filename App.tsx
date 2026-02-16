
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './themeContext';
import { Feed } from './views/Feed';
import { CreatePost } from './views/CreatePost';
import { Profile } from './views/Profile';
import { Auth } from './views/Auth';
import { AdminDashboard } from './views/AdminDashboard';
import { Home, Plus, User as UserIcon } from 'lucide-react';
import { VISUAL_STANDARDS } from './styles';
import { User } from './types';
import { OtaUpdater } from './components/OtaUpdater';

const Navigation: React.FC = () => {
  const { colors } = useTheme();
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Início' },
    { path: '/create', icon: Plus, label: 'Novo' },
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
              className={`${VISUAL_STANDARDS.navItem} p-2 rounded-xl ${isActive ? `${colors.secondary} ${colors.accent} scale-105` : 'text-gray-300'}`}
            >
              <Icon size={16} strokeWidth={isActive ? 3 : 2} />
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

  // IMPLEMENTAÇÃO DE MODO IMERSIVO (Solicita Fullscreen na primeira interação)
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
        // Interação do usuário necessária ou não suportado
        console.log("Aguardando interação para fullscreen");
      }
    };

    // Tenta entrar em fullscreen no clique (padrão Android Chrome/WebView)
    document.addEventListener('click', enterFullScreen, { once: true });
    
    // Tenta entrar imediatamente (funciona em alguns WebViews configurados)
    enterFullScreen();

    return () => {
      document.removeEventListener('click', enterFullScreen);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('baby_user');
    if (saved) {
      const parsedUser = JSON.parse(saved);
      setUser(parsedUser);
      // CORREÇÃO: Aplica o tema imediatamente ao carregar o usuário
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

  // --- GOD MODE ROUTING ---
  if (user.role === 'ADMIN') {
    return <AdminDashboard onLogout={handleLogout} />;
  }
  // ------------------------

  return (
    <div className={VISUAL_STANDARDS.container}>
      <OtaUpdater />
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/profile" element={<Profile />} />
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
