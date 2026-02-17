
import React, { useState, useRef } from 'react';
import { useTheme } from '../themeContext';
import { Gender, ParentRole, PersonaType, User } from '../types';
import { VISUAL_STANDARDS } from '../styles';
import { H1, H2, P } from '../components/Typography';
import { Button } from '../components/Button';
import { 
  Baby, Heart, ArrowRight, ArrowLeft, Stars, Sparkles, Cloud, Loader2, Smile, LogIn, Camera
} from 'lucide-react';
import { uploadToCloudinary } from '../cloudinaryService';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
  const [step, setStep] = useState(0); // 0: Landing, 1: Login, 2+: Register
  const [loading, setLoading] = useState(false);
  
  // State para controlar visibilidade do Header baseado no foco
  const [isFocused, setIsFocused] = useState(false);

  // Form State
  const [role, setRole] = useState<ParentRole | null>(null);
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [parentName, setParentName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [babyName, setBabyName] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState('');
  const [babyGender, setBabyGenderState] = useState<Gender>(Gender.BOY);
  const [parentAvatar, setParentAvatar] = useState<string>('');
  const [babyAvatar, setBabyAvatar] = useState<string>('');

  const parentFileRef = useRef<HTMLInputElement>(null);
  const babyFileRef = useRef<HTMLInputElement>(null);

  // Helper para corrigir sobreposição do teclado e esconder o header
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    const target = e.target;
    setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // Restaura o header quando o foco sai (se não for para outro input)
  const handleInputBlur = () => {
    setTimeout(() => {
        // Só restaura se o novo elemento focado NÃO for um input
        // Isso evita que o header fique "piscando" ao navegar entre campos (ex: Tab ou Next)
        if (document.activeElement?.tagName !== "INPUT") {
            setIsFocused(false);
        }
    }, 150);
  };

  const handleFileUpload = async (file: File, type: 'parent' | 'baby') => {
    try {
      setLoading(true);
      const url = await uploadToCloudinary(file);
      if (type === 'parent') setParentAvatar(url);
      else setBabyAvatar(url);
    } catch (e) {
      alert("Erro no upload da foto.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;

    if (email === 'admin@master.com' && password === 'master') {
        const adminUser: User = {
            id: 'MASTER_ADMIN',
            name: 'Administrador',
            email: 'admin@master.com',
            avatar: '',
            role: 'ADMIN',
            persona: 'SISTEMA',
            babyName: 'Sistema',
            babyAvatar: '',
            babyGender: Gender.BOY,
            babyBirthDate: new Date().toISOString(),
            age: 'Infinite',
            friends: [],
            storyVisibility: 'PRIVATE'
        };
        localStorage.setItem('baby_user', JSON.stringify(adminUser));
        onAuthSuccess();
        return;
    }

    setLoading(true);
    try {
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        localStorage.setItem('baby_user', JSON.stringify(userData));
        onAuthSuccess();
      } else {
        alert("Álbum não encontrado. Verifique seu e-mail.");
      }
    } catch (e) {
      alert("Erro ao acessar álbum.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!persona || !role) return;
    setLoading(true);
    try {
      const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
      const userData: User = {
        id: userId,
        name: parentName,
        email,
        avatar: parentAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        role,
        persona,
        babyName,
        babyAvatar: babyAvatar || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200',
        babyGender,
        babyBirthDate,
        age: '', 
        friends: [],
        storyVisibility: 'FAMILY',
        createdAt: Date.now()
      } as any; 
      
      await setDoc(doc(db, "users", userId), userData);
      localStorage.setItem('baby_user', JSON.stringify(userData));
      onAuthSuccess();
    } catch (e) {
      alert("Erro ao criar conta.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s === 1 ? 0 : s - 1);

  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-white overflow-hidden flex flex-col">
      
      {/* Background Fixo */}
      <div className="absolute inset-0 w-full h-full opacity-10 pointer-events-none z-0">
        <Cloud size={100} className="absolute top-20 -left-10 animate-pulse" />
        <Stars size={80} className="absolute bottom-40 -right-10 animate-bounce" />
      </div>

      <div className="flex-1 overflow-y-auto w-full px-6 pb-[50vh] scroll-smooth z-10">
        <div className="max-w-md mx-auto min-h-full flex flex-col pt-6">

            {/* HEADER COLAPSÁVEL */}
            <header className={`text-center shrink-0 transition-all duration-500 ease-in-out overflow-hidden ${
                isFocused ? 'max-h-0 opacity-0 py-0 my-0' : 'max-h-[500px] opacity-100 py-8 mb-6'
            }`}>
                <div className="inline-flex relative mb-6">
                <div className={`w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center shadow-2xl ring-8 ring-white overflow-hidden relative rotate-3`}>
                    {babyAvatar ? (
                        <img src={babyAvatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className={`w-full h-full ${colors.secondary} flex items-center justify-center`}>
                        <Baby size={48} className={colors.accent} />
                        </div>
                    )}
                </div>
                <div className="absolute -top-4 -right-4 p-3 bg-yellow-300 rounded-full shadow-xl animate-float">
                    <Sparkles size={20} className="text-white" />
                </div>
                <div className="absolute -bottom-2 -left-6 bg-white p-2 rounded-xl shadow-lg -rotate-12 border-2 border-dashed border-blue-100 text-blue-400">
                    <Heart size={16} fill="currentColor" />
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
                        Ainda não tenho uma conta
                    </button>
                </div>
                </div>
            )}

            {/* STEP 1: LOGIN */}
            {step === 1 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8 bg-white/95 shadow-2xl animate-in slide-in-from-right duration-500`}>
                <button onClick={() => setStep(0)} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                <H2 className="text-xl mb-10 text-center mt-4">Bom te ver de novo!</H2>
                
                <div className="space-y-6 flex-col justify-center">
                    <div className="relative">
                        <input 
                        type="email" 
                        placeholder="Seu E-mail"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={VISUAL_STANDARDS.input}
                        />
                    </div>
                    <div className="relative">
                        <input 
                        type="password" 
                        placeholder="Sua Senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={handleInputFocus}
                        onBlur={handleInputBlur}
                        className={VISUAL_STANDARDS.input}
                        />
                    </div>
                    <Button onClick={handleLogin} disabled={loading || !email || !password} className="w-full py-6 mt-4">
                        {loading ? <Loader2 className="animate-spin" /> : <LogIn size={20} />}
                        {loading ? "Acessando..." : "Abrir Álbum"}
                    </Button>
                </div>
                </div>
            )}

            {/* STEPS 2+: REGISTRO */}
            {step >= 2 && (
                <div className={`${VISUAL_STANDARDS.card} flex-col p-8 bg-white/95 shadow-2xl animate-in slide-in-from-right duration-500`}>
                
                {/* ROLE */}
                {step === 2 && (
                    <div className="flex flex-col">
                    <button onClick={() => setStep(0)} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-10 text-center mt-4">Quem é você?</H2>
                    <div className="grid grid-cols-1 gap-6">
                        <button 
                        onClick={() => { setRole('Papai'); nextStep(); }}
                        className={`p-8 rounded-[3rem] border-4 ${colors.border} bg-white flex flex-col items-center gap-4 active:scale-95 transition-all shadow-sm hover:shadow-xl`}
                        >
                        <div className="w-16 h-16 rounded-3xl bg-blue-100 flex items-center justify-center text-blue-500 shadow-inner">
                            <Smile size={32} />
                        </div>
                        <span className="font-display font-bold text-lg text-blue-900">O Papai</span>
                        </button>
                        <button 
                        onClick={() => { setRole('Mamãe'); nextStep(); }}
                        className={`p-8 rounded-[3rem] border-4 border-pink-100 bg-white flex flex-col items-center gap-4 active:scale-95 transition-all shadow-sm hover:shadow-xl`}
                        >
                        <div className="w-16 h-16 rounded-3xl bg-pink-100 flex items-center justify-center text-pink-500 shadow-inner">
                            <Smile size={32} />
                        </div>
                        <span className="font-display font-bold text-lg text-pink-900">A Mamãe</span>
                        </button>
                    </div>
                    </div>
                )}

                {/* PERSONA */}
                {step === 3 && (
                    <div className="flex flex-col">
                    <button onClick={prevStep} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-lg mb-2 text-center mt-4">Que tipo de {role?.toLowerCase()} você é?</H2>
                    <P className="text-[10px] text-center uppercase tracking-widest opacity-40 mb-8 italic font-bold">Escolha o seu bichinho fofo</P>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {PERSONAS.map(p => (
                        <button 
                            key={p.type}
                            onClick={() => { setPersona(p.type); nextStep(); }}
                            className={`p-5 rounded-3xl border-2 border-dashed ${persona === p.type ? colors.border + ' bg-white scale-105' : 'border-gray-100 bg-gray-50/50'} transition-all text-center flex flex-col items-center gap-2`}
                        >
                            <span className="text-3xl mb-1">{p.emoji}</span>
                            <div className="font-display font-bold text-sm leading-tight">{role} {p.type}</div>
                            <span className="text-[8px] opacity-40 font-bold leading-tight">{p.desc}</span>
                        </button>
                        ))}
                    </div>
                    </div>
                )}

                {/* PARENT INFO */}
                {step === 4 && (
                    <div className="flex flex-col">
                    <button onClick={prevStep} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <div className="text-center mb-10 mt-6">
                        <div className="text-4xl mb-4 animate-bounce">
                            {PERSONAS.find(p => p.type === persona)?.emoji}
                        </div>
                        <H2 className="text-xl leading-tight">Olá, {role} {persona}!</H2>
                        <P className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-2">Vamos configurar seu acesso</P>
                    </div>

                    <div className="space-y-5">
                        <input 
                            type="text" 
                            placeholder="Seu Nome"
                            value={parentName}
                            onChange={e => setParentName(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            className={VISUAL_STANDARDS.input}
                        />
                        <input 
                            type="email" 
                            placeholder="E-mail"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            className={VISUAL_STANDARDS.input}
                        />
                        <input 
                            type="password" 
                            placeholder="Senha"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            className={VISUAL_STANDARDS.input}
                        />
                        <Button onClick={nextStep} disabled={!parentName || !email || !password} className="w-full mt-4">
                            Próximo <ArrowRight size={20} />
                        </Button>
                    </div>
                    </div>
                )}

                {/* BABY INFO */}
                {step === 5 && (
                    <div className="flex flex-col">
                    <button onClick={prevStep} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-10 text-center mt-4">Sobre o seu tesouro</H2>

                    <div className="space-y-6">
                        <input 
                            type="text" 
                            placeholder="Nome do Bebê"
                            value={babyName}
                            onChange={e => setBabyName(e.target.value)}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            className={VISUAL_STANDARDS.input}
                        />
                        <div className="flex flex-col gap-2">
                            <P className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-6 mb-1">Data de Nascimento</P>
                            <input 
                                type="date" 
                                value={babyBirthDate}
                                onChange={e => setBabyBirthDate(e.target.value)}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                                className={VISUAL_STANDARDS.input}
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                            onClick={() => { setBabyGenderState(Gender.BOY); setGender(Gender.BOY); }}
                            className={`p-4 rounded-3xl border-4 ${babyGender === Gender.BOY ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-white'} transition-all font-display font-bold text-sm`}
                            >
                            👶 Menino
                            </button>
                            <button 
                            onClick={() => { setBabyGenderState(Gender.GIRL); setGender(Gender.GIRL); }}
                            className={`p-4 rounded-3xl border-4 ${babyGender === Gender.GIRL ? 'border-pink-400 bg-pink-50' : 'border-gray-100 bg-white'} transition-all font-display font-bold text-sm`}
                            >
                            👧 Menina
                            </button>
                        </div>

                        <Button onClick={nextStep} disabled={!babyName || !babyBirthDate} className="w-full mt-6">
                            Quase lá! <ArrowRight size={20} />
                        </Button>
                    </div>
                    </div>
                )}

                {/* PHOTOS */}
                {step === 6 && (
                    <div className="flex flex-col text-center">
                    <button onClick={prevStep} className="absolute top-6 left-6 opacity-30"><ArrowLeft size={20}/></button>
                    <H2 className="text-xl mb-10 mt-4">Fotos do Álbum</H2>

                    <div className="flex flex-col gap-10 mb-10 justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div 
                                onClick={() => parentFileRef.current?.click()}
                                className={`w-28 h-28 rounded-full border-4 border-dashed ${colors.border} overflow-hidden flex items-center justify-center relative group cursor-pointer shadow-inner bg-gray-50/50`}
                            >
                                {parentAvatar ? <img src={parentAvatar} className="w-full h-full object-cover"/> : <Camera className="opacity-20" size={32}/>}
                                {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                            </div>
                            <P className="text-[10px] font-bold uppercase tracking-widest opacity-40">Sua Foto ({role})</P>
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div 
                                onClick={() => babyFileRef.current?.click()}
                                className={`w-32 h-32 rounded-[2.5rem] border-4 border-dashed ${colors.border} overflow-hidden flex items-center justify-center relative group cursor-pointer shadow-xl bg-gray-50/50`}
                            >
                                {babyAvatar ? <img src={babyAvatar} className="w-full h-full object-cover"/> : <Baby className="opacity-20" size={40}/>}
                                {loading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><Loader2 className="animate-spin"/></div>}
                            </div>
                            <P className="text-[10px] font-bold uppercase tracking-widest opacity-40">Foto do Bebê</P>
                        </div>
                    </div>

                    <input type="file" ref={parentFileRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'parent')} />
                    <input type="file" ref={babyFileRef} className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'baby')} />

                    <Button onClick={handleRegister} className="w-full py-6 text-xl rounded-[2.5rem] mb-4">
                        {loading ? <Loader2 className="animate-spin" /> : "Criar Meu Álbum! 🎊"}
                    </Button>
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
