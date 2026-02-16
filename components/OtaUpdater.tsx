
import React, { useEffect, useState } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { ArrowDownCircle, RefreshCw, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
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
      const response = await fetch(`${GITHUB_VERSION_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Falha ao buscar versão");
      
      const data = await response.json();
      const current = await CapacitorUpdater.current();
      const failedVersion = localStorage.getItem('ota_failed_version');
      
      if (current.id === data.version) {
        localStorage.removeItem('ota_failed_version');
        setStatus('idle');
        return;
      }

      if (failedVersion === data.version) {
        setVersionInfo({ version: data.version, note: "Versão instável" });
        setStatus('blocked'); 
        setTimeout(() => setStatus('idle'), 5000);
        return;
      }
      
      if (data.version !== current.id) {
        setVersionInfo({ version: data.version, note: data.note });
        localStorage.setItem('ota_failed_version', data.version);
        downloadUpdate(data.url, data.version);
      } else {
        setStatus('idle');
      }
    } catch (e) {
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
      localStorage.removeItem('ota_failed_version'); 
      setStatus('error');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  const handleReload = async () => {
    window.location.reload(); 
  };

  if (status === 'idle' || !Capacitor.isNativePlatform()) return null;

  // Renderização compacta para erros
  if (status === 'error' || status === 'blocked') {
    return (
      <div className="fixed bottom-24 left-0 right-0 z-50 pointer-events-none flex justify-center animate-in slide-in-from-bottom duration-300">
        <div className="bg-white/90 backdrop-blur-md shadow-lg border border-red-100 rounded-full py-2 px-4 flex items-center gap-2">
           {status === 'blocked' ? <ShieldAlert size={16} className="text-orange-400" /> : <XCircle size={16} className="text-red-400" />}
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
             {status === 'blocked' ? 'Atualização evitada' : 'Falha na conexão'}
           </span>
        </div>
      </div>
    );
  }

  // Renderização padrão para download/ready
  return (
    <div className="fixed bottom-24 left-6 right-6 z-50 pointer-events-none flex justify-center animate-in slide-in-from-bottom duration-500">
      <div className={`pointer-events-auto bg-white/95 backdrop-blur-md border-2 ${colors.border} shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-[2rem] p-4 flex items-center gap-4 max-w-sm w-full`}>
        
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300 ${
          status === 'checking' ? 'bg-gray-50 text-gray-400' :
          `${colors.secondary} ${colors.accent}`
        }`}>
          {status === 'checking' && <RefreshCw size={18} className="animate-spin" />}
          {status === 'downloading' && <ArrowDownCircle size={18} className="animate-bounce" />}
          {status === 'ready' && <CheckCircle size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          {status === 'checking' && (
            <div className="flex flex-col">
              <P className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verificando...</P>
            </div>
          )}
          
          {status === 'downloading' && (
            <div className="w-full">
              <div className="flex justify-between items-end mb-1.5">
                <P className="text-xs font-bold text-gray-700">Baixando novidades</P>
                <span className="text-[9px] font-bold text-gray-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
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
              <P className="text-[10px] text-gray-500 leading-tight mt-0.5 truncate">
                {versionInfo?.note || "Nova versão disponível"}
              </P>
            </div>
          )}
        </div>

        {status === 'ready' && (
          <button 
            onClick={handleReload}
            className={`px-4 py-2 rounded-xl ${colors.primary} text-white text-[10px] font-bold uppercase tracking-wider shadow-lg active:scale-95 transition-all`}
          >
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
};
