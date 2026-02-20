<<<<<<< HEAD

=======
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, Stars, Loader2, Sparkles, BookOpen, Move, ZoomIn } from 'lucide-react';
import { useTheme } from '../themeContext';
import { Button } from '../components/Button';
import { H2, P } from '../components/Typography';
import { VISUAL_STANDARDS } from '../styles';
import { uploadToCloudinary } from '../cloudinaryService';
import { db } from '../firebase';
<<<<<<< HEAD
import { collection, addDoc, getDoc, doc, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, PersonaType, Baby } from '../types';

=======
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, PersonaType } from '../types';
import html2canvas from 'html2canvas';

// Mapeamento local para garantir o emoji correto no post
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
const PERSONA_EMOJIS: Record<PersonaType, string> = {
  'Coruja': '🦉',
  'Girafa': '🦒',
  'Coelho': '🐰',
  'Urso': '🐻',
  'Leão': '🦁',
  'Elefante': '🐘',
  'SISTEMA': '🤖'
};

export const CreatePost: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [story, setStory] = useState(""); 
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States para Zoom e Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('baby_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

<<<<<<< HEAD
  // State para Aspect Ratio dinâmico
  const [aspectRatio, setAspectRatio] = useState(4/5);

=======
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
<<<<<<< HEAD
        const result = e.target?.result as string;
        setPhotoPreview(result);
        
        const img = new Image();
        img.onload = () => {
          // Define o aspect ratio baseada na imagem, mas com limites
          // Limites comuns: 4/5 (portrait) até 1.91/1 (landscape)
          let newAspect = img.width / img.height;
          
          // Opcional: Limitar para não quebrar layout vertical
          // Instagram usa entre 4:5 (0.8) e 1.91:1 (1.91)
          if (newAspect < 0.8) newAspect = 0.8; 
          if (newAspect > 1.91) newAspect = 1.91;
          
          setAspectRatio(newAspect);
          setZoom(1); 
          setPan({ x: 0, y: 0 }); 
        };
        img.src = result;
=======
        setPhotoPreview(e.target?.result as string);
        setZoom(1); // Reset zoom
        setPan({ x: 0, y: 0 }); // Reset pan
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
      };
      reader.readAsDataURL(file);
    }
  };

<<<<<<< HEAD
=======
  // Lógica de Arrasto (Pan)
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handlePost = async () => {
<<<<<<< HEAD
    if ((!photoFile && !photoPreview) || !user || !user.currentBabyId) return;

    try {
      setIsUploading(true);
      
      if (!photoFile) throw new Error("Falha ao processar imagem");

      const imageUrl = await uploadToCloudinary(photoFile);
      const emoji = PERSONA_EMOJIS[user.persona] || '✨';
      const formattedName = `${emoji} ${user.role} ${user.persona} ${user.name}`;

      const postRef = await addDoc(collection(db, "posts"), {
        userId: user.id,
        babyId: user.currentBabyId, // IMPORTANT: Vincula ao Bebê
        userName: formattedName,
        userAvatar: user.avatar,
        photoUrl: imageUrl,
        cropConfig: {
          zoom: zoom,
          x: pan.x,
          y: pan.y,
          aspectRatio: aspectRatio
        },
=======
    if ((!photoFile && !photoPreview) || !user) return;

    try {
      setIsUploading(true);

      // PASSO 1: Gerar a imagem recortada/zoomada
      let finalFile = photoFile;

      if (previewContainerRef.current && photoPreview) {
        // Usa html2canvas para capturar o estado visual atual (zoom + pan)
        const canvas = await html2canvas(previewContainerRef.current, {
          useCORS: true,
          scale: 2, // Melhor qualidade
          backgroundColor: '#ffffff'
        });

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
        if (blob) {
          finalFile = new File([blob], "edited_memory.jpg", { type: "image/jpeg" });
        }
      }

      if (!finalFile) throw new Error("Falha ao processar imagem");

      // PASSO 2: Upload
      const imageUrl = await uploadToCloudinary(finalFile);

      const emoji = PERSONA_EMOJIS[user.persona] || '✨';
      const formattedName = `${emoji} ${user.role} ${user.persona} ${user.name}`;

      await addDoc(collection(db, "posts"), {
        userId: user.id,
        userName: formattedName,
        userAvatar: user.avatar,
        photoUrl: imageUrl,
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
        caption: caption,
        story: story,
        location: location,
        likes: 0,
        isLiked: false,
        comments: [],
        createdAt: Date.now()
      });

<<<<<<< HEAD
      // --- LOGICA DE NOTIFICAÇÃO ---
      // 1. Busca dados do Bebê para saber quem criou
      const babyDoc = await getDoc(doc(db, "babies", user.currentBabyId));
      if (babyDoc.exists()) {
          const babyData = babyDoc.data() as Baby;
          const creatorId = babyData.createdByUserId;

          // 2. Busca o Criador para ver lista de amigos
          const creatorUserDoc = await getDoc(doc(db, "users", creatorId));
          
          if (creatorUserDoc.exists()) {
              const creatorData = creatorUserDoc.data() as User;
              const friends = creatorData.friends || [];
              
              // 3. Monta lista de quem deve receber (Criador + Amigos), excluindo quem postou
              const recipients = new Set([...friends, creatorId]);
              recipients.delete(user.id);

              if (recipients.size > 0) {
                  const batch = writeBatch(db);
                  
                  recipients.forEach(recipientId => {
                      const notifRef = doc(collection(db, "notifications"));
                      batch.set(notifRef, {
                          recipientId: recipientId,
                          senderId: user.id,
                          senderName: user.name, // Nome simples
                          senderAvatar: user.avatar,
                          type: 'NEW_POST',
                          message: `${user.role} ${user.name} postou uma nova foto!`,
                          babyId: user.currentBabyId,
                          postId: postRef.id,
                          read: false,
                          createdAt: Date.now()
                      });
                  });
                  
                  await batch.commit();
              }
          }
      }

=======
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
      navigate('/');
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 pb-32">
      <header className="flex items-center gap-3 mb-10">
        <div className={`p-3 rounded-2xl ${colors.primary} text-white shadow-lg rotate-[-6deg]`}>
          <Stars size={24} />
        </div>
        <H2 className="text-2xl">Nova Memória</H2>
      </header>
      
      <div className={`${VISUAL_STANDARDS.card} bg-white/80 p-6 mb-10`}>
        {photoPreview ? (
          <div className="mb-6">
<<<<<<< HEAD
            <div 
              ref={previewContainerRef}
              className="relative rounded-[2.5rem] overflow-hidden shadow-xl border-8 border-white bg-white touch-none cursor-move flex items-center justify-center transition-all duration-300"
              style={{ aspectRatio: aspectRatio }}
=======
            {/* CONTAINER DE VISUALIZAÇÃO/EDIÇÃO */}
            <div 
              ref={previewContainerRef}
              className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-xl border-8 border-white bg-white touch-none cursor-move"
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
<<<<<<< HEAD
              <img 
                src={photoPreview}
                alt="Preview"
                className="max-w-none max-h-none pointer-events-none select-none"
                style={{
                  height: '100%',
                  width: 'auto',
                  minWidth: '100%',
                  objectFit: 'contain',
=======
              <div 
                className="w-full h-full pointer-events-none select-none"
                style={{
                  backgroundImage: `url(${photoPreview})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transformOrigin: 'center'
                }}
              />
              
              {!isUploading && (
                <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-[2rem]"></div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                  <Loader2 size={30} className={`animate-spin ${colors.accent}`} />
                  <P className={`font-display font-bold mt-4 ${colors.accent}`}>Guardando carinho...</P>
                </div>
              )}
            </div>

<<<<<<< HEAD
=======
            {/* CONTROLES DE EDIÇÃO */}
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
            {!isUploading && (
              <div className="mt-4 px-2 space-y-3">
                <div className="flex items-center gap-4 bg-white/50 p-3 rounded-2xl border border-white/50">
                   <ZoomIn size={20} className="text-gray-400" />
                   <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full accent-blue-400"
                   />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                   <span className="flex items-center gap-1"><Move size={10}/> Arraste para ajustar</span>
                   <button 
                    onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}
                    className="text-red-400 hover:text-red-500"
                   >
                     Trocar Foto
                   </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`aspect-[4/5] rounded-[3rem] border-4 border-dashed ${colors.border} flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white transition-all mb-6 group`}
          >
            <div className={`w-24 h-24 rounded-[2rem] ${colors.secondary} flex items-center justify-center ${colors.accent} shadow-inner group-hover:scale-110 transition-transform`}>
              <Camera size={48} />
            </div>
            <P className="font-display font-bold text-lg mb-1 opacity-60 text-center px-4">Escolher Foto</P>
          </div>
        )}
        
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} disabled={isUploading} />

        <div className="space-y-6 mt-6">
<<<<<<< HEAD
=======
          {/* Legenda Curta */}
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
          <input 
            placeholder="Legenda curta..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isUploading}
            className={`w-full px-6 py-4 rounded-[1.5rem] border-2 ${colors.border} focus:outline-none focus:ring-4 bg-white/50 shadow-inner text-sm font-medium`}
          />
<<<<<<< HEAD
=======

          {/* História Completa */}
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
          <div className="relative">
             <BookOpen size={20} className={`absolute top-4 left-4 ${colors.accent} opacity-50`} />
             <textarea 
              placeholder="Conte a história completa deste momento..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              disabled={isUploading}
              className={`${VISUAL_STANDARDS.input} ${colors.border} ${colors.focusRing} resize-none h-40 pt-10 pl-12`}
             />
          </div>
<<<<<<< HEAD
=======

>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
          <div className={`flex items-center gap-4 bg-white/60 p-5 rounded-[2rem] border-4 border-white shadow-sm`}>
            <MapPin size={24} strokeWidth={3} className={colors.accent} />
            <input 
              type="text"
              placeholder="Localização"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isUploading}
              className={`flex-1 bg-transparent text-sm focus:outline-none font-bold placeholder:text-gray-300`}
            />
          </div>
        </div>
      </div>

      <Button onClick={handlePost} disabled={!photoPreview || isUploading || !caption.trim()} className="w-full">
        {isUploading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
        {isUploading ? "Eternizando..." : "Guardar no Álbum"}
      </Button>
    </div>
  );
<<<<<<< HEAD
};
=======
};
>>>>>>> bb2008dfefce5a66fca89ac3452f00371cdd832f
