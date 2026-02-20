
import React, { useEffect, useState } from 'react';
import { useTheme } from '../themeContext';
import { Notification, User } from '../types';
import { VISUAL_STANDARDS } from '../styles';
import { H2, P } from '../components/Typography';
import { Bell, Heart, Image as ImageIcon, UserPlus, Trash2, Check, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, deleteDoc } from 'firebase/firestore';

export const Notifications: React.FC = () => {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('baby_user');
    if (saved) {
      const parsedUser = JSON.parse(saved);
      setUser(parsedUser);

      // Listener Realtime
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", parsedUser.id),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));
        setNotifications(data);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(n => {
      if (!n.read) {
        const ref = doc(db, "notifications", n.id);
        batch.update(ref, { read: true });
      }
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    await deleteDoc(doc(db, "notifications", id));
  };

  // Marca como lido automaticamente ao abrir (após 2s)
  useEffect(() => {
    if (notifications.some(n => !n.read)) {
      const timer = setTimeout(markAllAsRead, 2000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'NEW_POST': return <ImageIcon size={18} className="text-blue-400" />;
      case 'INVITE': return <UserPlus size={18} className="text-green-400" />;
      case 'LIKE': return <Heart size={18} className="text-pink-400" />;
      default: return <Bell size={18} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${colors.secondary} rotate-[-6deg]`}>
            <Bell size={24} className={colors.accent} />
          </div>
          <H2 className="text-2xl">Novidades</H2>
        </div>
        
        {notifications.length > 0 && (
          <button 
            onClick={() => notifications.forEach(n => deleteNotification(n.id))}
            className="p-2 bg-white rounded-full text-gray-300 hover:text-red-400 shadow-sm border border-gray-100"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gray-300" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 opacity-40">
           <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
             <Bell size={40} className="text-gray-300" />
           </div>
           <P>Tudo quietinho por aqui...</P>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className={`${VISUAL_STANDARDS.card} p-4 flex items-start gap-4 transition-all ${!n.read ? 'bg-white border-l-4 border-l-blue-400 shadow-md' : 'bg-white/60 opacity-80'}`}
            >
              <div className="relative shrink-0">
                <img src={n.senderAvatar || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-2xl object-cover bg-gray-100" />
                <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm border border-gray-100">
                  {getIcon(n.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-gray-800 truncate">{n.senderName}</span>
                  <span className="text-[9px] text-gray-400 whitespace-nowrap ml-2">
                    {new Date(n.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
                <P className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {n.message}
                </P>
              </div>

              {!n.read && (
                 <div className={`w-2 h-2 rounded-full ${colors.primary} mt-2 shrink-0`}></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
