
import React, { useState, useEffect } from 'react';
import { useTheme } from '../themeContext';
import { User, FriendRequest, Baby, ParentRole } from '../types';
import { VISUAL_STANDARDS } from '../styles';
import { H2, P } from '../components/Typography';
import { Search, UserPlus, Users, Loader2, Check, X, Clock, ArrowRight, ArrowLeft, Heart, Shield, Star, Baby as BabyIcon, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, arrayUnion, deleteDoc, orderBy, limit } from 'firebase/firestore';

interface FamilyManagerProps {
  currentUser: User;
  currentBaby: Baby;
  onClose: () => void;
  onUpdateUser: (u: User) => void;
}

const FAMILY_ROLES: ParentRole[] = ['Papai', 'Mamãe', 'Avô', 'Avó', 'Titio', 'Titia', 'Padrinho', 'Madrinha'];

export const FamilyManager: React.FC<FamilyManagerProps> = ({ currentUser, currentBaby, onClose, onUpdateUser }) => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'list' | 'search' | 'requests'>('list');
  const [loading, setLoading] = useState(false);
  
  // Data States
  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Cache de IDs para evitar re-solicitação visual
  const [tempSentIds, setTempSentIds] = useState<Set<string>>(new Set());

  // Modal de Perfil do Amigo
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

  useEffect(() => {
    loadFriends();
    loadAllRequests();
  }, []);

  const removeFriend = async (friendId: string) => {
      if (!confirm("Tem certeza que deseja remover este amigo?")) return;
      try {
          setLoading(true);
          const myRef = doc(db, "users", currentUser.id);
          await updateDoc(myRef, { friends: currentUser.friends.filter(id => id !== friendId) });

          const otherRef = doc(db, "users", friendId);
          // Tenta remover, mas se falhar (permissão), tudo bem, o importante é remover da minha lista
          try {
            const otherSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", friendId)));
            if (!otherSnap.empty) {
                 const otherData = otherSnap.docs[0].data() as User;
                 const newFriends = otherData.friends.filter(id => id !== currentUser.id);
                 await updateDoc(otherRef, { friends: newFriends });
            }
          } catch (e) { console.log("Não foi possível remover do outro lado (permissão)", e); }

          // Atualiza estado local
          const newUser = { ...currentUser, friends: currentUser.friends.filter(id => id !== friendId) };
          onUpdateUser(newUser);
          setFriends(prev => prev.filter(f => f.id !== friendId));
          setSelectedFriend(null); // Fecha modal se aberto
          alert("Amigo removido.");
      } catch (e) {
          alert("Erro ao remover.");
      } finally {
          setLoading(false);
      }
  };

  const loadFriends = async () => {
    if (!currentUser.friends || currentUser.friends.length === 0) {
        setFriends([]);
        return;
    }
    setLoading(true);
    try {
        const chunks = [];
        for (let i = 0; i < currentUser.friends.length; i += 10) {
            chunks.push(currentUser.friends.slice(i, i + 10));
        }
        
        let allFriends: User[] = [];
        for (const chunk of chunks) {
            const q = query(collection(db, "users"), where("__name__", "in", chunk));
            const snap = await getDocs(q);
            snap.forEach(d => allFriends.push({ id: d.id, ...d.data() } as User));
        }
        
        // Ordenação: Família Primeiro
        allFriends.sort((a, b) => {
            const aIsFamily = FAMILY_ROLES.includes(a.role);
            const bIsFamily = FAMILY_ROLES.includes(b.role);
            if (aIsFamily && !bIsFamily) return -1;
            if (!aIsFamily && bIsFamily) return 1;
            return a.name.localeCompare(b.name);
        });

        setFriends(allFriends);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const loadAllRequests = async () => {
    try {
        // 1. Recebidas (Alguém quer ser meu amigo)
        const qReceived = query(collection(db, "friend_requests"), where("toUserId", "==", currentUser.id), where("status", "==", "PENDING"));
        const snapReceived = await getDocs(qReceived);
        const recv: FriendRequest[] = [];
        snapReceived.forEach(d => recv.push({ id: d.id, ...d.data() } as FriendRequest));
        setReceivedRequests(recv);

        // 2. Enviadas (Eu quero ser amigo de alguém)
        const qSent = query(collection(db, "friend_requests"), where("fromUserId", "==", currentUser.id), where("status", "==", "PENDING"));
        const snapSent = await getDocs(qSent);
        const sent: FriendRequest[] = [];
        snapSent.forEach(d => sent.push({ id: d.id, ...d.data() } as FriendRequest));
        setSentRequests(sent);

    } catch (e) { console.error(e); }
  };

  const handleSearch = async () => {
    if (searchTerm.length < 3) return;
    setLoading(true);
    setSearchResults([]);
    
    try {
        const term = searchTerm.toLowerCase().trim();
        const usersRef = collection(db, "users");
        let results: User[] = [];

        const q = query(
            usersRef, 
            orderBy('searchName'), 
            where('searchName', '>=', term), 
            where('searchName', '<=', term + '\uf8ff'), 
            limit(10)
        );
        const snap = await getDocs(q);
        snap.forEach(d => results.push({ id: d.id, ...d.data() } as User));

        // Filtros:
        // 1. Não sou eu
        // 2. Não é amigo já aceito
        const filtered = results.filter(u => 
            u.id !== currentUser.id && 
            !currentUser.friends.includes(u.id)
        );
        
        setSearchResults(filtered);
    } catch (e) {
        console.error(e);
        alert("Erro na busca.");
    } finally {
        setLoading(false);
    }
  };

  const sendRequest = async (targetUser: User) => {
    try {
        setLoading(true);
        // Cria a solicitação
        const docRef = await addDoc(collection(db, "friend_requests"), {
            fromUserId: currentUser.id,
            fromUserName: currentUser.name,
            fromUserAvatar: currentUser.avatar,
            toUserId: targetUser.id,
            status: 'PENDING',
            createdAt: Date.now()
        });
        
        // Notificação
        await addDoc(collection(db, "notifications"), {
             recipientId: targetUser.id,
             senderId: currentUser.id,
             senderName: currentUser.name,
             senderAvatar: currentUser.avatar,
             type: 'INVITE',
             message: `${currentUser.name} enviou um convite de amizade!`,
             babyId: currentBaby.id,
             read: false,
             createdAt: Date.now()
        });

        setTempSentIds(prev => new Set(prev).add(targetUser.id));
        
        // Atualiza a lista de enviados localmente para feedback imediato na aba de solicitações
        const newReq: FriendRequest = {
            id: docRef.id,
            fromUserId: currentUser.id,
            fromUserName: currentUser.name,
            fromUserAvatar: currentUser.avatar,
            toUserId: targetUser.id,
            status: 'PENDING',
            createdAt: Date.now()
        };
        setSentRequests(prev => [...prev, newReq]);

        alert("Solicitação enviada!");
    } catch (e) {
        alert("Erro ao enviar.");
    } finally {
        setLoading(false);
    }
  };

  const acceptRequest = async (req: FriendRequest) => {
      try {
          setLoading(true);
          const myRef = doc(db, "users", currentUser.id);
          await updateDoc(myRef, { friends: arrayUnion(req.fromUserId) });

          const otherRef = doc(db, "users", req.fromUserId);
          await updateDoc(otherRef, { friends: arrayUnion(currentUser.id) });

          await deleteDoc(doc(db, "friend_requests", req.id));

          // Atualiza estado local
          const newUser = { ...currentUser, friends: [...currentUser.friends, req.fromUserId] };
          onUpdateUser(newUser);
          
          setReceivedRequests(prev => prev.filter(r => r.id !== req.id));
          loadFriends(); 
          
          alert("Oba! Novo membro na família!");
      } catch (e) {
          alert("Erro ao aceitar.");
      } finally {
          setLoading(false);
      }
  };

  const cancelRequest = async (id: string, type: 'sent' | 'received') => {
      try {
        await deleteDoc(doc(db, "friend_requests", id));
        if (type === 'sent') {
            setSentRequests(prev => prev.filter(r => r.id !== id));
        } else {
            setReceivedRequests(prev => prev.filter(r => r.id !== id));
        }
      } catch(e) {
          alert("Erro ao cancelar.");
      }
  };

  // Verifica se já enviei solicitação para este usuário (para a lista de busca)
  const hasSentRequestTo = (userId: string) => {
      return sentRequests.some(r => r.toUserId === userId) || tempSentIds.has(userId);
  };
  
  // Verifica se já recebi solicitação deste usuário
  const hasReceivedRequestFrom = (userId: string) => {
      return receivedRequests.some(r => r.fromUserId === userId);
  };

  return (
    <div className={VISUAL_STANDARDS.modal}>
        <div className={`${VISUAL_STANDARDS.card} w-full max-w-md h-[85vh] flex flex-col p-0 overflow-hidden animate-in zoom-in duration-200 bg-[#fdfbf7]`}>
            {/* HEADER */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                <div>
                    <H2 className={`text-xl ${colors.text}`}>Família & Amigos</H2>
                    <P className="text-[10px] text-gray-400 uppercase tracking-widest">Gerenciar Conexões</P>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-400 transition-colors"><X size={20}/></button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-gray-100 bg-white shadow-sm z-10">
                <button 
                    onClick={() => setActiveTab('list')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'list' ? `${colors.accent} ${colors.border}` : 'text-gray-300 border-transparent hover:bg-gray-50'}`}
                >
                    Quem já está
                </button>
                <button 
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'search' ? `${colors.accent} ${colors.border}` : 'text-gray-300 border-transparent hover:bg-gray-50'}`}
                >
                    Convidar
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 relative ${activeTab === 'requests' ? `${colors.accent} ${colors.border}` : 'text-gray-300 border-transparent hover:bg-gray-50'}`}
                >
                    Solicitações
                    {(receivedRequests.length > 0) && (
                        <span className="absolute top-3 right-3 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                
                {/* --- ABA 1: LISTA DE AMIGOS/FAMILIA --- */}
                {activeTab === 'list' && (
                    <div className="space-y-6">
                        {friends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                                <div className={`p-6 rounded-full ${colors.secondary} mb-4`}>
                                    <Users size={32} className={colors.accent}/>
                                </div>
                                <P className="text-gray-500 font-bold">O álbum está vazio</P>
                                <P className="text-xs text-gray-400 mt-1">Convide o papai, a mamãe e os titios!</P>
                            </div>
                        ) : (
                            <>
                                {/* Renderização Agrupada - Primeiro Família */}
                                {friends.some(f => FAMILY_ROLES.includes(f.role)) && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3 px-1">
                                            <Heart size={14} className="text-pink-400 fill-pink-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Família</span>
                                        </div>
                                        <div className="grid gap-3">
                                            {friends.filter(f => FAMILY_ROLES.includes(f.role)).map(f => (
                                                <div key={f.id} onClick={() => setSelectedFriend(f)} className="bg-white p-3 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] flex items-center gap-4 border border-pink-50 relative overflow-hidden group cursor-pointer active:scale-95 transition-transform">
                                                    <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <Star size={40} className="text-pink-300"/>
                                                    </div>
                                                    <img src={f.avatar} className="w-12 h-12 rounded-[1rem] object-cover border-2 border-white shadow-sm bg-gray-100"/>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                                                            {f.name}
                                                            <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-600 text-[9px] font-bold uppercase tracking-wide">
                                                                {f.role}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Conectado
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Depois Amigos */}
                                {friends.some(f => !FAMILY_ROLES.includes(f.role)) && (
                                    <div className="mt-6">
                                        <div className="flex items-center gap-2 mb-3 px-1">
                                            <Users size={14} className="text-blue-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Amigos</span>
                                        </div>
                                        <div className="grid gap-2">
                                            {friends.filter(f => !FAMILY_ROLES.includes(f.role)).map(f => (
                                                <div key={f.id} onClick={() => setSelectedFriend(f)} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-3 opacity-90 cursor-pointer active:scale-95 transition-transform">
                                                    <img src={f.avatar} className="w-10 h-10 rounded-full object-cover bg-gray-100 grayscale-[20%]"/>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-sm text-gray-700">{f.name}</div>
                                                        <div className="text-[10px] text-gray-400">{f.role} {f.persona}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* --- MODAL DE PERFIL DO AMIGO --- */}
                {selectedFriend && (
                    <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col animate-in zoom-in duration-200">
                        <div className="p-4 flex justify-end">
                            <button onClick={() => setSelectedFriend(null)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center -mt-10">
                            <div className="w-32 h-32 rounded-[2.5rem] p-1 bg-white shadow-2xl rotate-3 mb-6 relative">
                                <img src={selectedFriend.avatar} className="w-full h-full rounded-[2.2rem] object-cover" />
                                <div className="absolute -bottom-3 -right-3 bg-white p-2 rounded-full shadow-md text-2xl">
                                    {FAMILY_ROLES.includes(selectedFriend.role) ? '❤️' : '🤝'}
                                </div>
                            </div>
                            
                            <H2 className="text-2xl mb-1 text-gray-800">{selectedFriend.name}</H2>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase tracking-wider mb-8">
                                {selectedFriend.role} {selectedFriend.persona}
                            </div>

                            <div className="w-full space-y-3">
                                {selectedFriend.currentBabyId && (
                                    <button 
                                        onClick={() => {
                                            // Lógica para visitar (futuro: trocar contexto do app)
                                            alert("Em breve: Visitar álbum de " + selectedFriend.name);
                                        }}
                                        className={`w-full p-4 rounded-2xl ${colors.primary} text-white font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2`}
                                    >
                                        <BabyIcon size={20} /> Ver Álbum do Bebê
                                    </button>
                                )}
                                
                                <button 
                                    onClick={() => removeFriend(selectedFriend.id)}
                                    className="w-full p-4 rounded-2xl bg-red-50 text-red-500 font-bold border border-red-100 flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={20} /> Remover Amigo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ABA 2: BUSCA --- */}
                {activeTab === 'search' && (
                    <div className="animate-in fade-in">
                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-2">
                            <Search size={18} className="text-gray-300 ml-2" />
                            {/* CORREÇÃO DO INPUT: Fundo claro forçado */}
                            <input 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Nome ou E-mail..."
                                className="flex-1 py-3 bg-transparent text-gray-800 placeholder:text-gray-300 text-sm focus:outline-none font-medium"
                                style={{ backgroundColor: 'transparent' }} 
                            />
                            <button 
                                onClick={handleSearch} 
                                disabled={loading}
                                className={`p-3 rounded-xl ${colors.primary} text-white shadow-md active:scale-90 transition-transform`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18}/>}
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {searchResults.length === 0 && searchTerm.length > 2 && !loading && (
                                <div className="text-center text-gray-400 text-xs py-4">Nenhum usuário encontrado com este nome.</div>
                            )}

                            {searchResults.map(u => {
                                const isSent = hasSentRequestTo(u.id);
                                const isReceived = hasReceivedRequestFrom(u.id);

                                return (
                                    <div key={u.id} className="bg-white p-3 rounded-2xl shadow-sm flex items-center justify-between border border-gray-100">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={u.avatar} className="w-10 h-10 rounded-full object-cover bg-gray-100"/>
                                            <div className="min-w-0">
                                                <div className="font-bold text-sm text-gray-800 truncate">{u.name}</div>
                                                <div className="text-[10px] text-gray-400 truncate">{u.email}</div>
                                            </div>
                                        </div>
                                        
                                        {isSent ? (
                                            <span className="text-[10px] text-gray-400 font-bold px-3 py-1 bg-gray-100 rounded-lg flex items-center gap-1 border border-gray-200">
                                                <Clock size={10}/> Aguardando
                                            </span>
                                        ) : isReceived ? (
                                            <span className="text-[10px] text-green-500 font-bold px-3 py-1 bg-green-50 rounded-lg border border-green-100">
                                                Te convidou!
                                            </span>
                                        ) : (
                                            <button 
                                                onClick={() => sendRequest(u)} 
                                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-2"
                                            >
                                                <UserPlus size={14}/> Convidar
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- ABA 3: SOLICITAÇÕES --- */}
                {activeTab === 'requests' && (
                     <div className="space-y-8 animate-in slide-in-from-right duration-300">
                        
                        {/* RECEBIDAS */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 opacity-60 px-1">
                                <ArrowLeft size={14} className="text-purple-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-900">Recebidas ({receivedRequests.length})</span>
                            </div>
                            
                            {receivedRequests.length === 0 ? (
                                <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <P className="text-xs text-gray-400">Nenhum convite pendente.</P>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {receivedRequests.map(r => (
                                        <div key={r.id} className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-10px_rgba(168,85,247,0.2)] border-l-4 border-l-purple-400">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="relative">
                                                    <img src={r.fromUserAvatar} className="w-12 h-12 rounded-[1rem] object-cover bg-gray-100"/>
                                                    <div className="absolute -bottom-1 -right-1 bg-purple-100 p-1 rounded-full border border-white">
                                                        <ArrowLeft size={10} className="text-purple-600"/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-gray-800">{r.fromUserName}</div>
                                                    <div className="text-[10px] text-purple-500 font-bold bg-purple-50 px-2 py-0.5 rounded-md inline-block mt-1">Quer entrar na família</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => acceptRequest(r)} className="flex-1 py-2.5 bg-green-400 text-white rounded-xl text-xs font-bold shadow-md shadow-green-200 hover:bg-green-500 flex items-center justify-center gap-2 transition-all active:scale-95">
                                                    <Check size={16}/> Aceitar
                                                </button>
                                                <button onClick={() => cancelRequest(r.id, 'received')} className="px-4 py-2.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors">
                                                    <X size={16}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ENVIADAS */}
                        <div>
                            <div className="flex items-center gap-2 mb-3 opacity-60 px-1">
                                <ArrowRight size={14} className="text-gray-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Enviadas ({sentRequests.length})</span>
                            </div>

                            {sentRequests.length === 0 ? (
                                <div className="text-center py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                                    <P className="text-xs text-gray-400">Você não enviou convites recentes.</P>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sentRequests.map(r => (
                                        <div key={r.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between opacity-80">
                                             <div className="flex items-center gap-3">
                                                 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                     <ArrowRight size={16} className="text-gray-400"/>
                                                 </div>
                                                 <div>
                                                     <div className="text-[10px] text-gray-400 uppercase font-bold">Aguardando</div>
                                                     <div className="text-xs font-bold text-gray-700">ID: {r.toUserId.substring(0, 8)}...</div>
                                                 </div>
                                             </div>
                                             <button onClick={() => cancelRequest(r.id, 'sent')} className="text-red-300 hover:text-red-500 p-2">
                                                 <Trash2 size={16} /> {/* Usando Trash2 como X, mas X já importado */}
                                                 <X size={16} />
                                             </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                     </div>
                )}
            </div>
        </div>
    </div>
  );
};
    