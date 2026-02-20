
import React, { useState, useRef } from 'react';
import { useTheme } from '../themeContext';
import { Gender, ParentRole, PersonaType, User, Baby } from '../types';
import { VISUAL_STANDARDS } from '../styles';
import { H1, H2, P } from '../components/Typography';
import { Button } from '../components/Button';
import { 
  Baby as BabyIcon, ArrowRight, ArrowLeft, Stars, Sparkles, Cloud, Loader2, Smile, Camera, Hash, Search, CheckCircle
} from 'lucide-react';
import { uploadToCloudinary } from '../cloudinaryService';
import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, addDoc, writeBatch } from 'firebase/firestore';

const PERSONAS: { type: PersonaType; emoji: string; desc: string }[] = [
  { type: 'Coruja', emoji: '🦉', desc: 'Sempre atento a cada detalhe' },
  { type: 'Girafa', emoji: '🦒', desc: 'Com visão de futuro e carinho' },
  { type: 'Coelho', emoji: '🐰', desc: 'Puro salto de alegria e doçura' },
  { type: 'Urso', emoji: '🐻', desc: 'Um abraço que protege o mundo' },
  { type: 'Leão', emoji: '🦁', desc: 'Coragem e proteção para a cria' },
  { type: 'Elefante', emoji: '🐘', desc: 'Memória eterna e passos firmes' },
];

export const Auth: React.FC<{ onAuthSuccess: () => void }> = ({ onAuthSuccess }) => {
  const { colors, setGender } = useTheme();
  
  // 0: Landing, 1: Login, 
  // 2: Role, 3: Persona, 4: ParentInfo, 5: ParentPhoto 
  // 6: DECISION (New vs Existing), 
  // 7: NEW_BABY_INFO, 8: NEW_BABY_PHOTO
  // 9: JOIN_BABY_CODE
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Form State - PARENT
  const [role, setRole] = useState<ParentRole | null>(null);
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [parentAvatar, setParentAvatar] = useState<string>('');
  
  // Form State - BABY
  const [babyName, setBabyName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [babyGender, setBabyGenderState] = useState<Gender>(Gender.BOY);
  const [babyAvatar, setBabyAvatar] = useState<string>('');
  
  // Form State - JOIN
  const [inviteCode, setInviteCode] = useState('');
  const [foundBaby, setFoundBaby] = useState<Baby | null>(null);

  const parentFileRef = useRef<HTMLInputElement>(null);
  const babyFileRef = useRef<HTMLInputElement>(null);

  const handleInputFocus = () => setIsFocused(true);
  const handleInputBlur = () => {
    setTimeout(() => {
        if (document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
            setIsFocused(false);
        }
    }, 150);
  };

  const handleFileUpload = async (file: File, type: 'parent' | 'baby') => {
    try {
      setLoading(true);
      setLoadingMsg("Enviando foto...");
      const url = await uploadToCloudinary(file);
      if (type === 'parent') setParentAvatar(url);
      else setBabyAvatar(url);
    } catch (e) {
      alert("Erro no upload da foto.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setLoadingMsg("Abrindo seu diário...");
    
    try {
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        
        // Auto-fix para contas antigas sem searchName
        if (!userData.searchName) {
            await setDoc(userDocRef, { searchName: userData.name.toLowerCase() }, { merge: true });
            userData.searchName = userData.name.toLowerCase();
        }

        if (userData.currentBabyId) {
             const babyDoc = await getDoc(doc(db, "babies", userData.currentBabyId));
             if (babyDoc.exists()) {
                 localStorage.setItem('baby_data', JSON.stringify({ id: babyDoc.id, ...babyDoc.data() }));
                 localStorage.setItem('baby_user', JSON.stringify(userData));
                 onAuthSuccess();
             } else {
                 alert("Erro crítico: Bebê não encontrado.");
             }
        } else {
            // Lógica de migração legada omitida para brevidade, mas deve manter o searchName
            alert("Conta antiga detectada. Por favor, contate o suporte.");
        }
      } else {
        alert("Conta não encontrada.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao acessar.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const handleSearchBaby = async () => {
    if (!inviteCode) return;
    setLoading(true);
    setLoadingMsg("Buscando bebê...");
    try {
        const q = query(collection(db, "babies"), where("uniqueCode", "==", inviteCode.toUpperCase().trim()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const babyData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Baby;
            setFoundBaby(babyData);
            setGender(babyData.gender); 
        } else {
            alert("Bebê não encontrado.");
            setFoundBaby(null);
        }
    } catch (e) {
        alert("Erro ao buscar.");
    } finally {
        setLoading(false);
        setLoadingMsg("");
    }
  };

  const handleRegisterNew = async () => {
    if (!persona || !role) return;
    setLoading(true);
    setLoadingMsg("Criando seu álbum...");
    try {
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
      
      const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
      const firstName = babyName.split(' ')[0].toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "");
      const uniqueCode = `#${firstName || 'BABY'}-${randomSuffix}`;

      const babyRef = await addDoc(collection(db, "babies"), {
        uniqueCode,
        name: babyName,
        birthDate: babyBirthDate,
        gender: babyGender,
        avatar: babyAvatar || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200',
        createdByUserId: userId,
        createdAt: Date.now()
      });

      const userData: User = {
        id: userId,
        name: parentName,
        searchName: parentName.toLowerCase(), // CRUCIAL PARA BUSCA
        email,
        avatar: parentAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        role,
        persona,
        currentBabyId: babyRef.id,
        friends: [],
        storyVisibility: 'FAMILY',
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, "users", userId), userData);

      const babyData: Baby = {
          id: babyRef.id,
          uniqueCode,
          name: babyName,
          birthDate: babyBirthDate,
          gender: babyGender,
          avatar: babyAvatar || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200',
          createdByUserId: userId,
          createdAt: Date.now()
      };

      localStorage.setItem('baby_user', JSON.stringify(userData));
      localStorage.setItem('baby_data', JSON.stringify(babyData));
      onAuthSuccess();

    } catch (e) {
      alert("Erro ao criar conta.");
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  };

  const handleRegisterJoin = async () => {
    if (!persona || !role || !foundBaby) return;
    setLoading(true);
    setLoadingMsg("Vinculando contas...");
    try {
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_');

      const userData: User = {
        id: userId,
        name: parentName,
        searchName: parentName.toLowerCase(), // CRUCIAL PARA BUSCA
        email,
        avatar: parentAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        role,
        persona,
        currentBabyId: foundBaby.id,
        friends: [],
        storyVisibility: 'FAMILY',
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, "users", userId), userData);

      localStorage.setItem('baby_user', JSON.stringify(userData));
      localStorage.setItem('baby_data', JSON.stringify(foundBaby));
      onAuthSuccess();
    } catch (e) {
        alert("Erro ao vincular conta.");
    } finally {
        setLoading(false);
        setLoadingMsg("");
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s === 1 ? 0 : s - 1);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-white overflow-hidden flex flex-col">
      <div className="absolute inset-0 w-full h-full opacity-10 pointer-events-none z-0">
        <Cloud size={100} className="absolute top-20 -left-10 animate-pulse" />
        <Stars size={80} className="absolute bottom-40 -right-10 animate-bounce" />
      </div>

      <div className="flex-1 overflow-y-auto w-full px-6 pb-[50vh] scroll-smooth z-10">
        <div className={`max-w-md mx-auto flex flex-col transition-all duration-500 ease-in-out ${isFocused ? 'justify-start mt-2 pt-0' : 'min-h-full pt-6'}`}>

            {/* HEADER COLAPSÁVEL */}
            <header className={`text-center shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${
                isFocused ? 'max-h-0 opacity-0 py-0 my-0' : 'max-h-[500px] opacity-100 py-8 mb-6'
            }`}>
                <div className="inline-flex relative mb-6">
                <div className={`w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center shadow-2xl ring-8 ring-white overflow-hidden relative rotate-3`}>
                    {foundBaby ? (
                         <img src={foundBaby.avatar} className="w-full h-full object-cover" />
                    ) : babyAvatar ? (
                        <img src={babyAvatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full ${colors.secondary} flex items-center justify-center`}>
                        <BabyIcon size={48} className={colors.accent} />
                        </div>
                    )}
                </div>
                </div>
                <H1 className={`text-4xl font-display ${colors.accent}`}>BabyAlbum</H1>
                <P className="text-[11px] font-bold uppercase tracking-[0.4em] opacity-40 mt-2">Nosso Diário de Amor</P>
            </header>

            {/* STEP 0: LANDING */}
            {step === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 min-h-[300px]">
                <div className="text-center mb-12">
                    <H2 className="text-2xl mb-4">Bem-vindo à sua nova <br/> história favorita.</H2>
                    <P className="text-gray-400 max-w-[250px] mx-auto text-sm leading-relaxed">Guarde cada descoberta, cada sorriso e cada tropeço do seu pequeno tesouro.</P>
                </div>
                
                <div className="w-full space-y-4">
                    <Button onClick={() => setStep(1)} className="w-full py-6 text-xl rounded-[2.5rem]">
                        Entrar no Álbum <ArrowRight size={24} />
                    </Button>
                    <button onClick={() => setStep(2)} className="w-full py-4 text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
                        Criar nova conta
                    </button>
                </div>
                </div>
            )}

            {/* STEP 1: LOGIN */}
            {step === 1 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8 bg-white/95 shadow-2xl animate-in slide-in-from-right duration-500`}>
                <button onClick={() => setStep(0)} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                <H2 className="text-xl mb-10 text-center mt-4">Login</H2>
                <div className="space-y-6 flex-col justify-center">
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className={VISUAL_STANDARDS.input} />
                    <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className={VISUAL_STANDARDS.input} />
                    <Button onClick={handleLogin} disabled={loading || !email || !password} className="w-full py-6 mt-4">
                        {loading ? <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> {loadingMsg}</div> : "Abrir Álbum"}
                    </Button>
                </div>
                </div>
            )}

            {/* STEP 2-9 REMAIN MOSTLY THE SAME, OMITTED FOR BREVITY BUT FULL CONTENT BELOW */}
            {step === 2 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8 bg-white/95 shadow-2xl animate-in slide-in-from-right duration-500`}>
                    <button onClick={() => setStep(0)} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-10 text-center mt-4">Quem é você?</H2>
                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={() => { setRole('Papai'); nextStep(); }} className={`p-6 rounded-[2rem] bg-blue-50 text-blue-900 border-2 border-blue-100 font-bold flex items-center gap-4`}>
                             <div className="p-2 bg-white rounded-full"><Smile size={24} className="text-blue-400"/></div> O Papai
                        </button>
                        <button onClick={() => { setRole('Mamãe'); nextStep(); }} className={`p-6 rounded-[2rem] bg-pink-50 text-pink-900 border-2 border-pink-100 font-bold flex items-center gap-4`}>
                             <div className="p-2 bg-white rounded-full"><Smile size={24} className="text-pink-400"/></div> A Mamãe
                        </button>
                        <button onClick={() => { setRole('Avó'); nextStep(); }} className={`p-4 rounded-[2rem] bg-gray-50 text-gray-700 font-bold opacity-60`}>Outro Familiar / Amigo</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="flex flex-col">
                     <button onClick={prevStep} className="absolute top-6 left-6 opacity-30 z-20"><ArrowLeft size={20}/></button>
                     <div className={`${VISUAL_STANDARDS.card} p-6`}>
                        <H2 className="text-lg mb-2 text-center">Seu Espírito Animal</H2>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {PERSONAS.map(p => (
                            <button key={p.type} onClick={() => { setPersona(p.type); nextStep(); }}
                                className={`p-3 rounded-2xl border-2 ${persona === p.type ? colors.border + ' bg-white' : 'border-gray-100 bg-gray-50/50'} flex flex-col items-center gap-1`}>
                                <span className="text-2xl">{p.emoji}</span>
                                <div className="font-bold text-xs">{role} {p.type}</div>
                            </button>
                            ))}
                        </div>
                     </div>
                </div>
            )}

            {step === 4 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8`}>
                    <button onClick={prevStep} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-6 text-center mt-2">Dados do {role}</H2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Seu Nome" value={parentName} onChange={e => setParentName(e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className={VISUAL_STANDARDS.input} />
                        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className={VISUAL_STANDARDS.input} />
                        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className={VISUAL_STANDARDS.input} />
                        <Button onClick={nextStep} disabled={!parentName || !email || !password} className="w-full mt-4">Próximo</Button>
                    </div>
                </div>
            )}

            {step === 5 && (
                 <div className={`${VISUAL_STANDARDS.card} flex-col p-8 text-center`}>
                    <button onClick={prevStep} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-8 mt-2">Sua Foto de Perfil</H2>
                    <div onClick={() => parentFileRef.current?.click()}
                        className={`w-32 h-32 mx-auto rounded-full border-4 border-dashed ${colors.border} flex items-center justify-center relative bg-gray-50 mb-8`}>
                        {parentAvatar ? <img src={parentAvatar} className="w-full h-full rounded-full object-cover"/> : <Camera className="opacity-20" size={32}/>}
                        {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/50"><Loader2 className="animate-spin"/></div>}
                    </div>
                    <input type="file" ref={parentFileRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'parent')} />
                    <Button onClick={nextStep} className="w-full">Tudo Pronto!</Button>
                 </div>
            )}

            {step === 6 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8 text-center`}>
                    <H2 className="text-xl mb-8">Jornada do Bebê</H2>
                    <div className="space-y-4">
                        <button onClick={() => setStep(7)} className="w-full p-6 rounded-[2rem] bg-blue-50 border-2 border-blue-200 flex items-center gap-4 text-left hover:scale-[1.02] transition-transform">
                            <div className="bg-white p-3 rounded-full"><Sparkles size={24} className="text-blue-400" /></div>
                            <div>
                                <div className="font-bold text-blue-900 text-sm">Criar Novo Bebê</div>
                                <div className="text-[10px] text-blue-400">Começar um álbum do zero</div>
                            </div>
                        </button>
                        
                        <div className="flex items-center gap-2 opacity-30 text-xs font-bold justify-center"><div className="h-px w-full bg-black"></div>OU<div className="h-px w-full bg-black"></div></div>

                        <button onClick={() => setStep(9)} className="w-full p-6 rounded-[2rem] bg-pink-50 border-2 border-pink-200 flex items-center gap-4 text-left hover:scale-[1.02] transition-transform">
                            <div className="bg-white p-3 rounded-full"><Hash size={24} className="text-pink-400" /></div>
                            <div>
                                <div className="font-bold text-pink-900 text-sm">Já tenho um Código</div>
                                <div className="text-[10px] text-pink-400">Entrar em um álbum existente</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {step === 7 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8`}>
                    <button onClick={() => setStep(6)} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-6 text-center mt-2">Nasce uma Estrela</H2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Nome do Bebê" value={babyName} onChange={e => setBabyName(e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className={VISUAL_STANDARDS.input} />
                        <input type="date" value={babyBirthDate} onChange={e => setBabyBirthDate(e.target.value)} onFocus={handleInputFocus} onBlur={handleInputBlur} className={VISUAL_STANDARDS.input} />
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => { setBabyGenderState(Gender.BOY); setGender(Gender.BOY); }} className={`p-4 rounded-2xl border-2 ${babyGender === Gender.BOY ? 'border-blue-400 bg-blue-50' : 'border-gray-100'}`}>👦 Menino</button>
                            <button onClick={() => { setBabyGenderState(Gender.GIRL); setGender(Gender.GIRL); }} className={`p-4 rounded-2xl border-2 ${babyGender === Gender.GIRL ? 'border-pink-400 bg-pink-50' : 'border-gray-100'}`}>👧 Menina</button>
                        </div>
                        <Button onClick={nextStep} disabled={!babyName || !babyBirthDate} className="w-full mt-4">Próximo</Button>
                    </div>
                </div>
            )}

            {step === 8 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8 text-center`}>
                    <button onClick={prevStep} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-8 mt-2">Carinha do Bebê</H2>
                    <div onClick={() => babyFileRef.current?.click()} className={`w-32 h-32 mx-auto rounded-[2rem] border-4 border-dashed ${colors.border} flex items-center justify-center relative bg-gray-50 mb-8`}>
                        {babyAvatar ? <img src={babyAvatar} className="w-full h-full object-cover rounded-[1.8rem]"/> : <BabyIcon className="opacity-20" size={32}/>}
                        {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/50"><Loader2 className="animate-spin"/></div>}
                    </div>
                    <input type="file" ref={babyFileRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'baby')} />
                    <Button onClick={handleRegisterNew} className="w-full">{loading ? <div className="flex items-center gap-2 justify-center"><Loader2 className="animate-spin"/> {loadingMsg}</div> : "Criar Álbum!"}</Button>
                </div>
            )}

            {step === 9 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8 text-center`}>
                     <button onClick={() => setStep(6)} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                     <H2 className="text-xl mb-4 mt-2">Vincular Bebê</H2>
                     
                     {!foundBaby ? (
                        <div className="space-y-4">
                            <P className="text-sm text-gray-400 mb-4">Peça o código para quem criou o álbum (Ex: #CLARA-X92)</P>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="#CODIGO" 
                                    value={inviteCode} 
                                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                    onFocus={handleInputFocus} onBlur={handleInputBlur}
                                    className={`${VISUAL_STANDARDS.input} text-center font-mono text-lg tracking-widest uppercase`} 
                                />
                            </div>
                            <Button onClick={handleSearchBaby} disabled={loading || inviteCode.length < 5} className="w-full">
                                {loading ? <Loader2 className="animate-spin"/> : <Search size={20} />} Buscar
                            </Button>
                        </div>
                     ) : (
                        <div className="animate-in zoom-in duration-300">
                             <div className="w-24 h-24 mx-auto rounded-[2rem] overflow-hidden mb-4 border-4 border-white shadow-lg">
                                 <img src={foundBaby.avatar} className="w-full h-full object-cover" />
                             </div>
                             <H2 className="text-2xl text-blue-500 mb-1">{foundBaby.name}</H2>
                             <P className="text-xs uppercase font-bold tracking-widest text-gray-400 mb-6">Encontramos!</P>
                             
                             <Button onClick={handleRegisterJoin} className="w-full bg-green-500 text-white border-none shadow-green-200">
                                 {loading ? <Loader2 className="animate-spin"/> : <><CheckCircle size={20}/> Confirmar Vínculo</>}
                             </Button>
                             <button onClick={() => setFoundBaby(null)} className="mt-4 text-xs text-red-400 underline">Não é esse bebê</button>
                        </div>
                     )}
                </div>
            )}
            
            <div className="h-20 w-full shrink-0"></div>
        </div>
      </div>
    </div>
  );
};
