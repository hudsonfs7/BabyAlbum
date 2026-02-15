
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Post, User } from '../types';
import { useTheme } from '../themeContext';
import { VISUAL_STANDARDS } from '../styles';
import { P } from './Typography';
import { Heart, MessageCircle, MapPin, Send, Stars, Cloud, Baby, X, Smile, MoreVertical, Trash2, Edit2, Check, Loader2, BookOpen, Share2 } from 'lucide-react';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import html2canvas from 'html2canvas';

interface PostProps {
  post: Post;
  currentUser: User;
  isFriend: boolean;
}

export const PostCard: React.FC<PostProps> = ({ post, currentUser, isFriend }) => {
  const { colors } = useTheme();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(post.comments);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Estados de Edição/Exclusão
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [editCaption, setEditCaption] = useState(post.caption);
  const [editStory, setEditStory] = useState(post.story || "");
  const [editLocation, setEditLocation] = useState(post.location || "");

  // Ref para captura de tela (Compartilhamento)
  const storyRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser.id === post.userId;
  const hasStory = !!post.story || (isOwner && isEditing);

  const toggleLike = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isFriend) return;

    const newComment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      text: commentText,
      createdAt: Date.now()
    };

    setComments([...comments, newComment]);
    setCommentText("");
  };

  const confirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "posts", post.id));
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Não foi possível apagar o post agora.");
      setIsProcessing(false);
      setShowDeleteModal(false);
    }
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        caption: editCaption,
        story: editStory,
        location: editLocation
      });
      setIsEditing(false);
      setShowMenu(false);
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("Erro ao atualizar.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Lógica de Compartilhamento Premium
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!storyRef.current || isSharing) return;

    setIsSharing(true);
    try {
      // Pequeno delay para garantir renderização antes do print
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(storyRef.current, {
        scale: 2, // Equilíbrio entre qualidade e performance
        useCORS: true, 
        backgroundColor: null,
        logging: false,
        allowTaint: true
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
            setIsSharing(false);
            return;
        }

        const fileName = `babyalbum-${post.id}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // Verifica suporte a compartilhamento de arquivos
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Memória BabyAlbum',
              text: `Olha que momento lindo do ${post.userName}!`
            });
          } catch (shareError) {
             console.log("Compartilhamento cancelado ou falhou", shareError);
          }
        } else {
          // Fallback para Download se o navegador não suportar compartilhamento de arquivos
          try {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (downloadError) {
            alert("Não foi possível compartilhar a imagem automaticamente.");
          }
        }
        setIsSharing(false);
      }, 'image/png', 0.9);

    } catch (error) {
      console.error("Erro ao gerar imagem", error);
      alert("Não foi possível gerar a imagem para compartilhar.");
      setIsSharing(false);
    }
  };

  return (
    <>
      <div className={`mb-12 ${VISUAL_STANDARDS.card} shadow-xl transform transition-transform hover:scale-[1.01] relative`}>
        
        {/* DELETE CONFIRMATION OVERLAY */}
        {showDeleteModal && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200 rounded-[2.5rem]">
            <div className="bg-red-50 p-4 rounded-full mb-4 animate-bounce">
              <Trash2 size={32} className="text-red-400" />
            </div>
            <P className="text-lg font-bold text-gray-700 mb-2">Apagar Memória?</P>
            <P className="text-sm text-gray-400 mb-8 max-w-[200px]">Essa ação não pode ser desfeita. A foto sumirá do álbum.</P>
            
            <div className="flex gap-3 w-full">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteModal(false); }}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 font-bold text-gray-500 text-sm hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 rounded-xl bg-red-400 font-bold text-white text-sm hover:bg-red-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-200"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : "Sim, Apagar"}
              </button>
            </div>
          </div>
        )}

        {/* Menu de Opções */}
        {isOwner && !isEditing && !showDeleteModal && (
          <div className="absolute top-6 right-6 z-30">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-2 bg-white/80 rounded-full shadow-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowMenu(false); }}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-gray-600 hover:bg-blue-50 flex items-center gap-2"
                >
                  <Edit2 size={14} /> Editar
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowDeleteModal(true); }}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-red-400 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} /> Apagar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stickers - Visíveis fora do card */}
        <div className="absolute -top-3 -right-3 rotate-12 z-20 pointer-events-none">
          <div className={`p-2 rounded-full ${colors.primary} text-white shadow-lg border-4 border-white`}>
            <Stars size={20} />
          </div>
        </div>
        <div className="absolute -top-3 -left-3 -rotate-12 z-20 pointer-events-none">
          <div className={`p-2 rounded-full bg-white ${colors.accent} shadow-lg border-4 ${colors.border}`}>
            <Baby size={20} />
          </div>
        </div>

        {/* Header Info */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="relative">
            <img src={post.userAvatar} alt={post.userName} className={`w-12 h-12 rounded-[1.2rem] object-cover border-4 border-white shadow-sm`} />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${colors.primary} border-2 border-white`}></div>
          </div>
          <div className="flex-1">
            <span className="font-display font-bold text-base block leading-none">{post.userName}</span>
            {isEditing ? (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} className={colors.accent} />
                <input 
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="text-xs bg-gray-50 rounded-md px-2 py-1 w-full border border-gray-200 focus:outline-none focus:ring-1 ring-blue-200"
                  placeholder="Localização..."
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : post.location && (
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${colors.accent} mt-1`}>
                <MapPin size={10} strokeWidth={3} />
                <span>{editLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Photo */}
        <div 
          className="relative group mb-4 cursor-pointer" 
          onClick={() => !isEditing && !showDeleteModal && setIsExpanded(true)}
        >
          <div className="absolute inset-0 bg-white rounded-[2.5rem] -rotate-1 shadow-inner z-0"></div>
          <div className="relative aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-md z-10">
            <img 
              src={post.photoUrl} 
              alt="Baby Memory" 
              className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
            />
            {!isEditing && (
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">Ver Memória</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="px-2 pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={toggleLike} className="flex flex-col items-center group">
                <div className={`p-3 rounded-full ${liked ? colors.secondary : 'bg-gray-50'} transition-all group-active:scale-150`}>
                  <Heart size={24} fill={liked ? '#f472b6' : 'none'} color={liked ? '#f472b6' : '#cbd5e1'} />
                </div>
                <span className="text-[10px] font-bold mt-1 opacity-40">{likesCount}</span>
              </button>
              
              <button className="flex flex-col items-center group">
                <div className={`p-3 rounded-full bg-gray-50 transition-all`}>
                  <MessageCircle size={24} color="#cbd5e1" />
                </div>
                <span className="text-[10px] font-bold mt-1 opacity-40">{comments.length}</span>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
                className={`flex flex-col items-center group ${!hasStory && !isEditing ? 'opacity-30' : ''}`}
                disabled={!hasStory && !isEditing}
              >
                <div className={`p-3 rounded-full ${hasStory ? colors.secondary : 'bg-gray-50'} transition-all`}>
                  <BookOpen size={24} className={hasStory ? colors.accent : 'text-gray-300'} />
                </div>
                <span className="text-[10px] font-bold mt-1 opacity-40">História</span>
              </button>
            </div>
            
            <div className={`flex items-center gap-2 ${colors.secondary} px-4 py-2 rounded-full border border-white`}>
              <Cloud size={14} className={colors.accent} />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {/* Edit Context */}
          <div className="bg-[#fffdf9] p-5 rounded-[2rem] border-2 border-dashed border-gray-100 relative mb-4">
            {isEditing ? (
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase">Legenda</label>
                <input 
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  className="w-full bg-white p-3 rounded-xl border border-blue-100 text-sm focus:outline-none focus:ring-2 ring-blue-100"
                  placeholder="Escreva a legenda..."
                  onClick={(e) => e.stopPropagation()}
                />
                
                <label className="text-xs font-bold text-gray-400 uppercase mt-2 block">História Completa</label>
                <textarea 
                  value={editStory}
                  onChange={(e) => setEditStory(e.target.value)}
                  className="w-full bg-white p-3 rounded-xl border border-blue-100 text-sm focus:outline-none focus:ring-2 ring-blue-100 resize-none h-24"
                  placeholder="Conte os detalhes..."
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex gap-2 justify-end mt-2">
                   <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditCaption(post.caption); setEditStory(post.story || ""); setEditLocation(post.location || ""); }}
                    className="p-2 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200"
                   >
                     <X size={16} />
                   </button>
                   <button 
                    onClick={handleUpdate}
                    disabled={isProcessing}
                    className={`px-4 py-2 rounded-full ${colors.primary} text-white text-xs font-bold flex items-center gap-2 shadow-md`}
                   >
                     {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar
                   </button>
                </div>
              </div>
            ) : (
              <P className="text-sm leading-relaxed text-gray-700 italic">
                "{editCaption}"
              </P>
            )}
            
            <div className="absolute -bottom-2 -right-2 opacity-10 pointer-events-none">
              <Baby size={40} />
            </div>
          </div>

          {/* Comments */}
          {!isEditing && comments.length > 0 && (
            <div className="space-y-3 mb-4">
              {comments.slice(0, 2).map(c => (
                <div key={c.id} className="bg-white/40 p-3 rounded-2xl flex items-start gap-2 border border-white/50">
                  <div className={`w-2 h-2 rounded-full ${colors.primary} mt-1.5 shrink-0`}></div>
                  <P className="text-xs leading-tight">
                    <span className={`font-bold mr-1 ${colors.accent}`}>{c.userName}:</span>
                    {c.text}
                  </P>
                </div>
              ))}
            </div>
          )}

          {/* Input Comment */}
          {!isEditing && isFriend && (
            <form onSubmit={handleAddComment} className={`flex items-center gap-3 bg-white p-2 pl-5 rounded-full border-2 ${colors.border} shadow-inner`}>
              <input 
                type="text" 
                placeholder="Escreva um carinho..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-transparent text-xs focus:outline-none placeholder:text-gray-300 font-medium"
              />
              <button type="submit" disabled={!commentText.trim()} className={`p-3 rounded-full ${colors.primary} text-white shadow-md active:scale-90 transition-transform`}>
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 
        EXPANDED STORY MODAL with PORTAL
      */}
      {isExpanded && !showDeleteModal && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-start bg-[#fdfbf7] animate-in fade-in duration-300 overflow-y-auto"
          onClick={() => setIsExpanded(false)}
          style={{ touchAction: 'pan-y' }}
        >
          {/* Action Buttons Fixed Top */}
          <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-3">
             <button 
              className={`p-3 rounded-full bg-white shadow-lg border-2 border-gray-100 text-gray-400 hover:text-gray-600 active:scale-90 transition-transform`}
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            >
              <X size={24} strokeWidth={3} />
            </button>
             <button 
              className={`p-3 rounded-full ${colors.primary} shadow-lg text-white active:scale-90 transition-transform flex items-center justify-center`}
              onClick={handleShare}
              disabled={isSharing}
            >
              {isSharing ? <Loader2 size={24} className="animate-spin"/> : <Share2 size={24} />}
            </button>
          </div>

          <div 
            className="w-full min-h-screen flex flex-col items-center pt-20 pb-10 px-1"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 
               THE CAPTURE CARD
            */}
            <div 
              ref={storyRef}
              className="bg-[#fffefc] px-1 py-4 sm:p-6 rounded-[1.5rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.1)] border border-stone-100 relative w-full max-w-lg transform transition-all"
              style={{
                backgroundImage: `radial-gradient(#00000005 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }}
            >
               {/* Card Decor: Pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-100/80 backdrop-blur-sm rotate-[-2deg] shadow-sm border border-yellow-200/50 z-20"></div>

               {/* Card Decor: Cloud */}
              <div className="absolute -top-6 -left-4 z-30">
                 <Cloud size={70} fill={colors.accent.includes('blue') ? '#bae6fd' : '#fbcfe8'} className={`${colors.accent} drop-shadow-xl`} />
              </div>
              
              {/* Card Decor: Stars */}
              <div className="absolute -bottom-3 -right-3 rotate-12 bg-yellow-300 p-2 rounded-full shadow-xl border-2 border-white z-30">
                 <Stars size={20} className="text-white" />
              </div>

              {/* User Header */}
              <div className="flex flex-col items-center mb-4 pt-4 relative z-10">
                 <div className={`px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm flex items-center gap-2 mb-1`}>
                   <Smile size={14} className={colors.accent} />
                   <span className="font-display font-bold text-xs text-gray-700">{post.userName}</span>
                </div>
                {post.location && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    <MapPin size={9} />
                    {post.location}
                  </div>
                )}
              </div>

              {/* Photo Frame */}
              <div className="bg-white p-0.5 rounded-[1rem] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-2 border-white transform rotate-0 mb-4 relative z-10">
                 <img 
                   src={post.photoUrl} 
                   alt="Memory" 
                   className="w-full h-auto object-contain rounded-[0.8rem] shadow-inner max-h-[80vh]"
                   crossOrigin="anonymous" 
                 />
              </div>

              {/* Story Content */}
              <div className="text-center px-1 pb-4 relative z-10">
                 <div className="mb-4 relative inline-block">
                    <Stars size={10} className={`absolute -top-2 -left-3 ${colors.accent}`} />
                    <P className="text-base font-display font-bold text-gray-700 italic leading-relaxed">"{post.caption}"</P>
                    <Stars size={10} className={`absolute -bottom-2 -right-3 ${colors.accent}`} />
                 </div>

                 {post.story ? (
                   <div className="text-left bg-white/80 backdrop-blur-sm p-4 rounded-[1.5rem] border-2 border-dashed border-gray-200 relative">
                     <BookOpen size={16} className={`mb-2 ${colors.accent} opacity-60`} />
                     <P className="text-xs leading-6 text-gray-600 font-medium whitespace-pre-wrap">
                       {post.story}
                     </P>
                   </div>
                 ) : (
                    <div className="text-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
                       Uma memória guardada com amor
                    </div>
                 )}

                 {/* Watermark / Footer */}
                 <div className="mt-6 flex flex-col items-center opacity-40">
                    <P className="text-[9px] uppercase tracking-[0.3em] font-bold mb-1">
                      {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </P>
                    <span className="text-[7px] font-bold">BabyAlbum App</span>
                 </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
