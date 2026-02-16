
import React, { useEffect, useState } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { Cloud, ArrowDownCircle, RefreshCw, CheckCircle, AlertCircle, XCircle, ShieldAlert } from 'lucide-react';
import { useTheme } from '../themeContext';
import { P } from './Typography';

// URL DO ARQUIVO JSON NO GITHUB (RAW)
const GITHUB_VERSION_URL = 'https://raw.githubusercontent.com/hudsonfs7/BabyAlbum/main/version.json';

export const OtaUpdater: React.FC = () => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'error' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [versionInfo, setVersionInfo] = useState<{ version: string, note?: string } | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initUpdater = async () => {
      try {
        // Notifica o sistema nativo que a versão atual carregou com sucesso
        await CapacitorUpdater.notifyAppReady();
        checkForUpdates();
      } catch (e) {
        console.error("Erro ao inicializar updater:", e);
      }
    };

    initUpdater();
  }, []);

  const checkForUpdates = async () => {
    if (status === 'downloading' || status === 'ready') return;
    
    setStatus('checking');
    try {
      // 1. Busca o JSON de versão no GitHub com timestamp para evitar cache
      const response = await fetch(`${GITHUB_VERSION_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Falha ao buscar versão");
      
      const data = await response.json();
      
      // 2. Verifica qual versão está rodando atualmente
      const current = await CapacitorUpdater.current();
      
      // 3. LÓGICA ANTI-LOOP (Bad Update Guard)
      const failedVersion = localStorage.getItem('ota_failed_version');
      
      if (current.id === data.version) {
        // Sucesso: Estamos na versão nova. Limpa a flag de erro.
        localStorage.removeItem('ota_failed_version');
        setStatus('idle');
        return;
      }

      if (failedVersion === data.version) {
        console.warn(`Atualização para ${data.version} falhou anteriormente. Bloqueando.`);
        setVersionInfo({ version: data.version, note: "Versão instável detectada" });
        setStatus('blocked'); 
        // Removemos o status blocked após alguns segundos para não poluir a tela,
        // mas impedimos o download.
        setTimeout(() => setStatus('idle'), 8000);
        return;
      }
      
      // Se versões diferem e não está na lista negra, baixa.
      if (data.version !== current.id) {
        setVersionInfo({ version: data.version, note: data.note });
        
        // Marca essa versão como "tentativa".
        localStorage.setItem('ota_failed_version', data.version);
        
        downloadUpdate(data.url, data.version);
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error("Sem atualizações ou erro:", e);
      setStatus('idle');
    }
  };

  const downloadUpdate = async (url: string, version: string) => {
    setStatus('downloading');
    
    CapacitorUpdater.addListener('download', (info: any) => {
      setProgress(info.percent);
    });

    try {
      const versionObj = await CapacitorUpdater.download({
        url: url,
        version: version,
      });
      
      await CapacitorUpdater.set(versionObj);
      setStatus('ready');
    } catch (e) {
      console.error("Erro no download:", e);
      // Erro de download (rede) não é erro de boot. Permite tentar de novo.
      localStorage.removeItem('ota_failed_version'); 
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const handleReload = async () => {
    window.location.reload(); 
  };

  if (status === 'idle' || !Capacitor.isNativePlatform()) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 z-50 pointer-events-none flex justify-center animate-in slide-in-from-bottom duration-500">
      <div className={`pointer-events-auto bg-white/95 backdrop-blur-md border-2 ${colors.border} shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[2rem] p-5 flex items-center gap-4 max-w-sm w-full`}>
        
        {/* Ícone de Status */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
          status === 'error' ? 'bg-red-50 text-red-400' : 
          status === 'blocked' ? 'bg-orange-50 text-orange-400' :
          status === 'checking' ? 'bg-gray-50 text-gray-400' :
          `${colors.secondary} ${colors.accent}`
        }`}>
          {status === 'checking' && <RefreshCw size={20} className="animate-spin" />}
          {status === 'downloading' && <ArrowDownCircle size={20} className="animate-bounce" />}
          {status === 'ready' && <CheckCircle size={24} />}
          {status === 'error' && <XCircle size={24} />}
          {status === 'blocked' && <ShieldAlert size={24} />}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          {status === 'checking' && (
            <div className="flex flex-col">
              <P className="text-xs font-bold text-gray-600">Verificando...</P>
              <P className="text-[10px] text-gray-400 truncate">Buscando atualizações</P>
            </div>
          )}
          
          {status === 'downloading' && (
            <div className="w-full">
              <div className="flex justify-between items-end mb-2">
                <P className="text-xs font-bold text-gray-700">Baixando magia...</P>
                <span className="text-[10px] font-bold text-gray-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className={`h-full ${colors.primary} transition-all duration-300 rounded-full`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex flex-col">
              <P className="text-sm font-bold text-gray-800">Tudo pronto!</P>
              <P className="text-[10px] text-gray-500 leading-tight mt-0.5 line-clamp-1">
                {versionInfo?.note || "Toque para atualizar o álbum"}
              </P>
            </div>
          )}

           {status === 'error' && (
            <div className="flex flex-col">
              <P className="text-xs font-bold text-red-400">Falha ao baixar</P>
              <P className="text-[10px] text-gray-400">Tente novamente mais tarde</P>
            </div>
          )}

          {status === 'blocked' && (
            <div className="flex flex-col">
              <P className="text-xs font-bold text-orange-400">Atualização Cancelada</P>
              <P className="text-[10px] text-gray-400 leading-tight">Versão instável detectada. O app foi restaurado.</P>
            </div>
          )}
        </div>

        {/* Ação */}
        {status === 'ready' && (
          <button 
            onClick={handleReload}
            className={`px-5 py-3 rounded-xl ${colors.primary} text-white text-xs font-bold shadow-lg shadow-blue-200/50 active:scale-95 transition-all hover:brightness-110 whitespace-nowrap`}
          >
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
};
