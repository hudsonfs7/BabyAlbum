
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../themeContext';
import { Gender, User, PrivacyLevel } from '../types';
import { H2, P } from '../components/Typography';
import { Button } from '../components/Button';
import { Heart, Baby, Stars, Camera, Users, Cloud, Edit3, Save, Loader2, Check, Settings, Lock, Globe, Home } from 'lucide-react';
import { VISUAL_STANDARDS } from '../styles';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../cloudinaryService';
import { calculateBabyAge } from '../utils/dateUtils';

export const Profile: React.FC = () => {
  const { gender, setGender, colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [storyVisibility, setStoryVisibility] = useState<PrivacyLevel>('FAMILY');

  // Stats State
  const [stats, setStats] = useState({ photos: 0, family: 0, likes: 0 });

  const [profile, setProfile] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados reais
  useEffect(() => {
    const loadData = async () => {
      const stored = localStorage.getItem('baby_user');
      if (!stored) return;

      const localUser = JSON.parse(stored) as User;
      
      try {
        // 1. Carregar perfil atualizado do Firestore
        const userDocRef = doc(db, "users", localUser.id);
        const userSnap = await getDoc(userDocRef);
        
        let userData = localUser;
        if (userSnap.exists()) {
          userData = userSnap.data() as User;
          // Atualiza localStorage para manter sincronicidade
          localStorage.setItem('baby_user', JSON.stringify(userData));
        }
        
        setProfile(userData);
        if (userData.babyGender) {
          setGender(userData.babyGender);
        }
        if (userData.storyVisibility) {
          setStoryVisibility(userData.storyVisibility);
        }

        // 2. Calcular Estatísticas (Fotos e Beijos)
        const q = query(collection(db, "posts"), where("userId", "==", userData.id));
        const querySnapshot = await getDocs(q);
        
        let totalLikes = 0;
        querySnapshot.forEach((doc) => {
          totalLikes += (doc.data().likes || 0);
        });

        setStats({
          photos: querySnapshot.size,
          family: userData.friends?.length || 0,
          likes: totalLikes
        });

      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [setGender]);

  const handleAvatarClick = () => {
    if (isEditing) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      setIsSaving(true);
      const url = await uploadToCloudinary(file);
      setProfile(prev => prev ? ({ ...prev, babyAvatar: url }) : null);
    } catch (err) {
      alert("Erro ao subir foto de perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      const updatedProfile = { 
        ...profile, 
        babyGender: gender,
        storyVisibility: storyVisibility
      };
      
      // Atualiza Firestore
      await setDoc(doc(db, "users", profile.id), updatedProfile, { merge: true });
      
      // Atualiza LocalStorage
      localStorage.setItem('baby_user', JSON.stringify(updatedProfile));
      
      setIsEditing(false);
      setShowSettings(false);
    } catch (err) {
      alert("Erro ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center opacity-20">
        <Loader2 size={40} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 pb-32 relative">
      
      {/* Settings Modal */}
      {showSettings && (
        <div className={VISUAL_STANDARDS.modal}>
          <div className={`${VISUAL_STANDARDS.card} bg-white p-6 w-full max-w-sm animate-in zoom-in duration-200`}>
            <div className="flex justify-between items-center mb-6">
              <H2 className="text-lg">Configurações</H2>
              <button onClick={() => setShowSettings(false)} className="p-2 rounded-full bg-gray-100"><Settings size={18}/></button>
            </div>
            
            <div className="mb-6">
              <P className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Privacidade das Histórias</P>
              <div className="space-y-3">
                <button 
                  onClick={() => setStoryVisibility('PUBLIC')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${storyVisibility === 'PUBLIC' ? `${colors.border} bg-blue-50` : 'border-gray-100 bg-white'}`}
                >
                  <Globe size={20} className={storyVisibility === 'PUBLIC' ? 'text-blue-500' : 'text-gray-300'} />
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-700">Público</div>
                    <div className="text-[10px] text-gray-400">Todos podem ver as histórias</div>
                  </div>
                  {storyVisibility === 'PUBLIC' && <Check size={16} className="ml-auto text-blue-500" />}
                </button>

                <button 
                  onClick={() => setStoryVisibility('FAMILY')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${storyVisibility === 'FAMILY' ? `${colors.border} bg-pink-50` : 'border-gray-100 bg-white'}`}
                >
                  <Home size={20} className={storyVisibility === 'FAMILY' ? 'text-pink-500' : 'text-gray-300'} />
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-700">Apenas Família</div>
                    <div className="text-[10px] text-gray-400">Só convidados podem ler</div>
                  </div>
                  {storyVisibility === 'FAMILY' && <Check size={16} className="ml-auto text-pink-500" />}
                </button>

                <button 
                  onClick={() => setStoryVisibility('PRIVATE')}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${storyVisibility === 'PRIVATE' ? `${colors.border} bg-gray-50` : 'border-gray-100 bg-white'}`}
                >
                  <Lock size={20} className={storyVisibility === 'PRIVATE' ? 'text-gray-600' : 'text-gray-300'} />
                  <div className="text-left">
                    <div className="font-bold text-sm text-gray-700">Privado</div>
                    <div className="text-[10px] text-gray-400">Só os pais podem ver</div>
                  </div>
                  {storyVisibility === 'PRIVATE' && <Check size={16} className="ml-auto text-gray-600" />}
                </button>
              </div>
            </div>

            <Button onClick={saveProfile} className="w-full">
              {isSaving ? <Loader2 className="animate-spin" /> : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colors.secondary}`}>
            <Cloud size={24} className={colors.accent} />
          </div>
          <H2 className="text-2xl">Álbum do Bebê</H2>
        </div>
        
        <div className="flex gap-2">
           <button 
            onClick={() => setShowSettings(true)}
            className="p-4 bg-white rounded-[1.5rem] shadow-md border-2 border-gray-100 text-gray-400 active:scale-90 transition-all"
          >
            <Settings size={24} />
          </button>
          <button 
            onClick={() => isEditing ? saveProfile() : setIsEditing(true)}
            disabled={isSaving}
            className={`p-4 bg-white rounded-[1.5rem] shadow-md border-2 ${isEditing ? 'border-green-400 text-green-500' : `${colors.border} ${colors.accent}`} active:scale-90 transition-all flex items-center gap-2`}
          >
            {isSaving ? <Loader2 size={24} className="animate-spin" /> : isEditing ? <Save size={24} /> : <Edit3 size={24} />}
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className={`bg-white rounded-[4rem] p-10 flex flex-col items-center text-center mb-12 shadow-2xl relative border-8 border-white transition-all ${isEditing ? 'ring-4 ring-dashed ring-gray-200' : ''}`}>
        <div className="relative mb-6 group cursor-pointer" onClick={handleAvatarClick}>
          <div className={`w-40 h-40 rounded-[3rem] p-2 bg-gradient-to-tr from-white to-gray-50 shadow-xl ${isEditing ? 'rotate-0 scale-105' : 'rotate-[-4deg]'} transition-transform border-4 border-dashed border-gray-100 overflow-hidden`}>
            {profile.babyAvatar ? (
               <img 
               src={profile.babyAvatar} 
               className="w-full h-full rounded-[2.5rem] object-cover" 
               alt="Baby" 
             />
            ) : (
              <div className={`w-full h-full rounded-[2.5rem] ${colors.secondary} flex items-center justify-center`}>
                <Baby size={48} className={colors.accent} />
              </div>
            )}
            
            {isEditing && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white">
                <Camera size={32} />
              </div>
            )}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-14 h-14 rounded-full ${colors.primary} flex items-center justify-center text-white shadow-lg border-4 border-white rotate-12`}>
            <Baby size={28} />
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {isEditing ? (
          <div className="w-full space-y-4">
            <input 
              value={profile.babyName}
              onChange={e => setProfile(prev => prev ? ({ ...prev, babyName: e.target.value }) : null)}
              placeholder="Nome do Bebê"
              className="w-full text-center text-3xl font-display font-bold bg-gray-50 rounded-2xl p-2 focus:outline-none focus:ring-2 ring-blue-200"
            />
            <div className="flex flex-col items-center">
               <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Data de Nascimento</label>
               <input 
                type="date"
                value={profile.babyBirthDate}
                onChange={e => setProfile(prev => prev ? ({ ...prev, babyBirthDate: e.target.value }) : null)}
                className="w-full text-center text-sm font-bold uppercase tracking-widest bg-gray-50 rounded-xl p-2 focus:outline-none focus:ring-2 ring-blue-200"
              />
            </div>
          </div>
        ) : (
          <>
            <H2 className={`text-3xl font-display ${colors.accent} mb-2`}>{profile.babyName}</H2>
            <div className={`px-4 py-1 rounded-full ${colors.secondary} text-[10px] font-bold uppercase tracking-[0.2em] mb-8`}>
              {profile.babyBirthDate ? calculateBabyAge(profile.babyBirthDate) : 'Recém-chegado'} de vida
            </div>
          </>
        )}

        <div className="grid grid-cols-3 gap-6 w-full border-t-2 border-dashed border-gray-50 pt-8 mt-4">
          <div className="flex flex-col items-center">
            <Camera size={20} className="mb-2 opacity-20" />
            <div className="font-display font-bold text-xl leading-none">{stats.photos}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1">Fotos</div>
          </div>
          <div className="flex flex-col items-center border-x-2 border-dashed border-gray-50">
            <Users size={20} className="mb-2 opacity-20" />
            <div className="font-display font-bold text-xl leading-none">{stats.family}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1">Família</div>
          </div>
          <div className="flex flex-col items-center">
            <Heart size={20} className="mb-2 opacity-20" />
            <div className="font-display font-bold text-xl leading-none">{stats.likes > 999 ? '999+' : stats.likes}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1">Beijos</div>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 ml-2">
          <Stars size={18} className={colors.accent} />
          <P className="font-bold text-sm uppercase tracking-[0.2em] opacity-50">Cores do Quarto</P>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <button 
            onClick={() => { setGender(Gender.BOY); if(isEditing) setIsEditing(true); }}
            className={`p-8 rounded-[3rem] border-4 flex flex-col items-center gap-4 transition-all duration-500 shadow-sm ${gender === Gender.BOY ? `border-blue-400 bg-white scale-105 shadow-xl` : 'border-white bg-white/40 opacity-60'}`}
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-blue-300 flex items-center justify-center text-white shadow-inner">
              <Baby size={32} />
            </div>
            <span className="font-display font-bold text-sm text-blue-900">Azul Nuvem</span>
            {gender === Gender.BOY && <Check size={16} className="text-blue-400" />}
          </button>

          <button 
            onClick={() => { setGender(Gender.GIRL); if(isEditing) setIsEditing(true); }}
            className={`p-8 rounded-[3rem] border-4 flex flex-col items-center gap-4 transition-all duration-500 shadow-sm ${gender === Gender.GIRL ? `border-pink-400 bg-white scale-105 shadow-xl` : 'border-white bg-white/40 opacity-60'}`}
          >
            <div className="w-16 h-16 rounded-[1.5rem] bg-pink-300 flex items-center justify-center text-white shadow-inner">
              <Baby size={32} />
            </div>
            <span className="font-display font-bold text-sm text-pink-900">Rosa Algodão</span>
            {gender === Gender.GIRL && <Check size={16} className="text-pink-400" />}
          </button>
        </div>
      </div>

      {/* Family Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-8 border-4 border-dashed border-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className={`w-16 h-16 rounded-3xl ${colors.secondary} flex items-center justify-center border-4 border-white shadow-sm`}>
            <Heart size={32} className={colors.accent} fill="currentColor" />
          </div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">Família</div>
            <div className="text-xs text-gray-400 font-medium italic mt-1">Convidar Pessoas</div>
          </div>
        </div>
        <Button variant="outline" className="px-6 py-3 text-[10px] uppercase font-bold tracking-[0.2em] rounded-2xl bg-white shadow-sm">
           <Users size={16} />
        </Button>
      </div>
    </div>
  );
};
