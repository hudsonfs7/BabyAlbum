
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../themeContext';
import { Gender, User, PrivacyLevel, Baby } from '../types';
import { H2, P } from '../components/Typography';
import { Button } from '../components/Button';
import { Heart, Baby as BabyIcon, Stars, Camera, Users, Cloud, Edit3, Save, Loader2, Check, Settings, Globe, Home, Copy, Share2, X } from 'lucide-react';
import { VISUAL_STANDARDS } from '../styles';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '../cloudinaryService';
import { calculateBabyAge } from '../utils/dateUtils';
import { Share } from '@capacitor/share';
import { FamilyManager } from './FamilyManager';
import appVersion from '../version.json';

export const Profile: React.FC = () => {
  const { gender, setGender, colors } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Settings & Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showFamilyManager, setShowFamilyManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'privacy' | 'invite'>('privacy');
  const [storyVisibility, setStoryVisibility] = useState<PrivacyLevel>('FAMILY');

  // Stats State
  const [stats, setStats] = useState({ photos: 0, family: 0, likes: 0 });

  const [profile, setProfile] = useState<User | null>(null);
  const [baby, setBaby] = useState<Baby | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const stored = localStorage.getItem('baby_user');
      if (!stored) return;

      const localUser = JSON.parse(stored) as User;
      
      try {
        const userDocRef = doc(db, "users", localUser.id);
        const userSnap = await getDoc(userDocRef);
        let userData = localUser;
        if (userSnap.exists()) {
          userData = userSnap.data() as User;
          
          // AUTO-FIX: Garante que searchName existe (para busca case insensitive)
          if (!userData.searchName && userData.name) {
              userData.searchName = userData.name.toLowerCase();
              await setDoc(userDocRef, { searchName: userData.searchName }, { merge: true });
          }

          localStorage.setItem('baby_user', JSON.stringify(userData));
        }
        setProfile(userData);
        if (userData.storyVisibility) setStoryVisibility(userData.storyVisibility);

        if (userData.currentBabyId) {
            const babyDoc = await getDoc(doc(db, "babies", userData.currentBabyId));
            if (babyDoc.exists()) {
                const bData = { id: babyDoc.id, ...babyDoc.data() } as Baby;
                setBaby(bData);
                setGender(bData.gender);
                localStorage.setItem('baby_data', JSON.stringify(bData));
            }
        }

        if (userData.currentBabyId) {
            const q = query(collection(db, "posts"), where("babyId", "==", userData.currentBabyId));
            const querySnapshot = await getDocs(q);
            let totalLikes = 0;
            querySnapshot.forEach((doc) => totalLikes += (doc.data().likes || 0));
            setStats({
              photos: querySnapshot.size,
              family: userData.friends?.length || 0,
              likes: totalLikes
            });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setGender]);

  const handleAvatarClick = () => { if (isEditing) fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !baby) return;
    try {
      setIsSaving(true);
      const url = await uploadToCloudinary(file);
      setBaby(prev => prev ? ({ ...prev, avatar: url }) : null);
    } catch (err) { alert("Erro ao subir foto."); } finally { setIsSaving(false); }
  };

  const saveProfile = async () => {
    if (!profile || !baby) return;
    try {
      setIsSaving(true);
      
      // Update User (incluindo searchName se nome mudou)
      const updatedProfile = { 
          ...profile, 
          storyVisibility: storyVisibility,
          searchName: profile.name.toLowerCase() 
      };
      
      await setDoc(doc(db, "users", profile.id), updatedProfile, { merge: true });
      localStorage.setItem('baby_user', JSON.stringify(updatedProfile));

      // Update Baby
      const updatedBaby = { ...baby, gender: gender };
      await setDoc(doc(db, "babies", baby.id), updatedBaby, { merge: true });
      localStorage.setItem('baby_data', JSON.stringify(updatedBaby));
      
      setIsEditing(false);
      setShowSettings(false);
    } catch (err) { alert("Erro ao salvar."); } finally { setIsSaving(false); }
  };

  const copyCode = () => { if (baby?.uniqueCode) { navigator.clipboard.writeText(baby.uniqueCode); alert('Código copiado!'); } };
  const shareCode = async () => { if (baby?.uniqueCode) { await Share.share({ title: 'Convite', text: `Código: ${baby.uniqueCode}`, dialogTitle: 'Convidar' }); } };

  if (loading || !profile || !baby) {
    return ( <div className="min-h-screen flex items-center justify-center opacity-20"><Loader2 size={40} className="animate-spin" /></div> );
  }

  return (
    <div className="p-8 pb-32 relative">
      
      {/* FAMILY MANAGER MODAL */}
      {showFamilyManager && profile && baby && (
          <FamilyManager 
            currentUser={profile} 
            currentBaby={baby} 
            onClose={() => setShowFamilyManager(false)} 
            onUpdateUser={(u) => {
                setProfile(u);
                setStats(prev => ({...prev, family: u.friends.length}));
            }}
          />
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className={VISUAL_STANDARDS.modal}>
          <div className={`${VISUAL_STANDARDS.card} bg-white p-0 w-full max-w-sm animate-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[80vh]`}>
            <div className={`p-6 pb-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50`}>
                <H2 className="text-lg">Configurações</H2>
                <button onClick={() => setShowSettings(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} className="text-gray-400"/></button>
            </div>

            <div className="flex border-b border-gray-100">
                <button onClick={() => setActiveTab('privacy')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'privacy' ? `text-blue-500 border-b-2 border-blue-500 bg-blue-50/30` : 'text-gray-400'}`}>Privacidade</button>
                <button onClick={() => setActiveTab('invite')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'invite' ? `text-pink-500 border-b-2 border-pink-500 bg-pink-50/30` : 'text-gray-400'}`}>Convite</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                {activeTab === 'privacy' && (
                    <div className="space-y-6 animate-in slide-in-from-left duration-200">
                        <div>
                            <P className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quem vê as histórias?</P>
                            <div className="space-y-3">
                                <button onClick={() => setStoryVisibility('PUBLIC')} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${storyVisibility === 'PUBLIC' ? `${colors.border} bg-blue-50` : 'border-gray-100 bg-white'}`}>
                                <Globe size={20} className={storyVisibility === 'PUBLIC' ? 'text-blue-500' : 'text-gray-300'} />
                                <div className="text-left"><div className="font-bold text-sm text-gray-700">Público</div><div className="text-[10px] text-gray-400">Todos com o link podem ver</div></div>
                                {storyVisibility === 'PUBLIC' && <Check size={16} className="ml-auto text-blue-500" />}
                                </button>
                                <button onClick={() => setStoryVisibility('FAMILY')} className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all ${storyVisibility === 'FAMILY' ? `${colors.border} bg-pink-50` : 'border-gray-100 bg-white'}`}>
                                <Home size={20} className={storyVisibility === 'FAMILY' ? 'text-pink-500' : 'text-gray-300'} />
                                <div className="text-left"><div className="font-bold text-sm text-gray-700">Apenas Família</div><div className="text-[10px] text-gray-400">Só quem você adicionou</div></div>
                                {storyVisibility === 'FAMILY' && <Check size={16} className="ml-auto text-pink-500" />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'invite' && (
                    <div className="space-y-8 animate-in slide-in-from-right duration-200">
                        <div className={`relative rounded-2xl border-2 border-dashed ${colors.border} ${colors.secondary} p-6 text-center group`}>
                             <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-gray-100 shadow-sm">Código do Bebê</div>
                             <div className="flex flex-col items-center gap-3 mt-2">
                                <div className={`font-mono text-2xl tracking-widest font-bold ${colors.text} bg-white/50 px-4 py-2 rounded-xl border border-white/50`}>{baby.uniqueCode}</div>
                                <div className="flex gap-2 w-full">
                                    <button onClick={copyCode} className="flex-1 py-2 bg-white rounded-lg text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50 flex items-center justify-center gap-2"><Copy size={14}/> Copiar</button>
                                    <button onClick={shareCode} className={`flex-1 py-2 ${colors.primary} text-white rounded-lg text-xs font-bold shadow-md hover:opacity-90 flex items-center justify-center gap-2`}><Share2 size={14}/> Enviar</button>
                                </div>
                             </div>
                             <P className="text-[10px] text-gray-400 mt-3 px-4 leading-tight">Quem usar este código terá acesso total ao álbum como pai/mãe.</P>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 pt-2 border-t border-gray-100">
                <Button onClick={saveProfile} className="w-full">{isSaving ? <Loader2 className="animate-spin" /> : "Salvar Tudo"}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colors.secondary}`}><Cloud size={24} className={colors.accent} /></div>
          <H2 className="text-2xl">Álbum do Bebê</H2>
        </div>
        
        <div className="flex gap-2">
           <button onClick={() => setShowSettings(true)} className="p-4 bg-white rounded-[1.5rem] shadow-md border-2 border-gray-100 text-gray-400 active:scale-90 transition-all hover:bg-gray-50"><Settings size={24} /></button>
           <button onClick={() => isEditing ? saveProfile() : setIsEditing(true)} disabled={isSaving} className={`p-4 bg-white rounded-[1.5rem] shadow-md border-2 ${isEditing ? 'border-green-400 text-green-500' : `${colors.border} ${colors.accent}`} active:scale-90 transition-all flex items-center gap-2`}>
            {isSaving ? <Loader2 size={24} className="animate-spin" /> : isEditing ? <Save size={24} /> : <Edit3 size={24} />}
          </button>
        </div>
      </div>

      <div className={`bg-white rounded-[4rem] p-10 flex flex-col items-center text-center mb-12 shadow-2xl relative border-8 border-white transition-all ${isEditing ? 'ring-4 ring-dashed ring-gray-200' : ''}`}>
        <div className="relative mb-6 group cursor-pointer" onClick={handleAvatarClick}>
          <div className={`w-40 h-40 rounded-[3rem] p-2 bg-gradient-to-tr from-white to-gray-50 shadow-xl ${isEditing ? 'rotate-0 scale-105' : 'rotate-[-4deg]'} transition-transform border-4 border-dashed border-gray-100 overflow-hidden`}>
            {baby.avatar ? <img src={baby.avatar} className="w-full h-full rounded-[2.5rem] object-cover" alt="Baby" /> : <div className={`w-full h-full rounded-[2.5rem] ${colors.secondary} flex items-center justify-center`}><BabyIcon size={48} className={colors.accent} /></div>}
            {isEditing && <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center text-white"><Camera size={32} /></div>}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-14 h-14 rounded-full ${colors.primary} flex items-center justify-center text-white shadow-lg border-4 border-white rotate-12`}><BabyIcon size={28} /></div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        {isEditing ? (
          <div className="w-full space-y-4">
            <input value={baby.name} onChange={e => setBaby(prev => prev ? ({ ...prev, name: e.target.value }) : null)} placeholder="Nome do Bebê" className="w-full text-center text-3xl font-display font-bold bg-gray-50 rounded-2xl p-2 focus:outline-none focus:ring-2 ring-blue-200"/>
            <div className="flex flex-col items-center"><label className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Data de Nascimento</label><input type="date" value={baby.birthDate} onChange={e => setBaby(prev => prev ? ({ ...prev, birthDate: e.target.value }) : null)} className="w-full text-center text-sm font-bold uppercase tracking-widest bg-gray-50 rounded-xl p-2 focus:outline-none focus:ring-2 ring-blue-200"/></div>
          </div>
        ) : (
          <>
            <H2 className={`text-3xl font-display ${colors.accent} mb-2`}>{baby.name}</H2>
            <div className={`px-4 py-1 rounded-full ${colors.secondary} text-[10px] font-bold uppercase tracking-[0.2em] mb-8`}>{baby.birthDate ? calculateBabyAge(baby.birthDate) : 'Recém-chegado'} de vida</div>
          </>
        )}

        <div className="grid grid-cols-3 gap-6 w-full border-t-2 border-dashed border-gray-50 pt-8 mt-4">
          <div className="flex flex-col items-center"><Camera size={20} className="mb-2 opacity-20" /><div className="font-display font-bold text-xl leading-none">{stats.photos}</div><div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1">Fotos</div></div>
          
          {/* BOTÃO FAMÍLIA ATIVÁVEL */}
          <button 
            onClick={() => setShowFamilyManager(true)}
            className="flex flex-col items-center border-x-2 border-dashed border-gray-50 active:scale-95 transition-transform"
          >
            <Users size={20} className={`mb-2 ${colors.accent}`} />
            <div className="font-display font-bold text-xl leading-none">{stats.family}</div>
            <div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1">Família</div>
          </button>
          
          <div className="flex flex-col items-center"><Heart size={20} className="mb-2 opacity-20" /><div className="font-display font-bold text-xl leading-none">{stats.likes > 999 ? '999+' : stats.likes}</div><div className="text-[9px] font-bold uppercase tracking-wider opacity-30 mt-1">Beijos</div></div>
        </div>
      </div>

      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6 ml-2"><Stars size={18} className={colors.accent} /><P className="font-bold text-sm uppercase tracking-[0.2em] opacity-50">Cores do Quarto</P></div>
        <div className="grid grid-cols-2 gap-6">
          <button onClick={() => { setGender(Gender.BOY); if(isEditing) setIsEditing(true); }} className={`p-8 rounded-[3rem] border-4 flex flex-col items-center gap-4 transition-all duration-500 shadow-sm ${gender === Gender.BOY ? `border-blue-400 bg-white scale-105 shadow-xl` : 'border-white bg-white/40 opacity-60'}`}><div className="w-16 h-16 rounded-[1.5rem] bg-blue-300 flex items-center justify-center text-white shadow-inner"><BabyIcon size={32} /></div><span className="font-display font-bold text-sm text-blue-900">Azul Nuvem</span>{gender === Gender.BOY && <Check size={16} className="text-blue-400" />}</button>
          <button onClick={() => { setGender(Gender.GIRL); if(isEditing) setIsEditing(true); }} className={`p-8 rounded-[3rem] border-4 flex flex-col items-center gap-4 transition-all duration-500 shadow-sm ${gender === Gender.GIRL ? `border-pink-400 bg-white scale-105 shadow-xl` : 'border-white bg-white/40 opacity-60'}`}><div className="w-16 h-16 rounded-[1.5rem] bg-pink-300 flex items-center justify-center text-white shadow-inner"><BabyIcon size={32} /></div><span className="font-display font-bold text-sm text-pink-900">Rosa Algodão</span>{gender === Gender.GIRL && <Check size={16} className="text-pink-400" />}</button>
        </div>
      </div>
      
      <div className="text-center pb-8 opacity-30">
        <P className="text-[10px] font-mono">v{appVersion.version}</P>
      </div>
    </div>
  );
};
