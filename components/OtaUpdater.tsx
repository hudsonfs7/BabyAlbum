
import React, { useEffect, useState } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { Cloud, ArrowDownCircle, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useTheme } from '../themeContext';
import { P } from './Typography';

// URL DO ARQUIVO JSON NO GITHUB (RAW)
const GITHUB_VERSION_URL = 'https://raw.githubusercontent.com/hudsonfs7/BabyAlbum/main/version.json';

export const OtaUpdater: React.FC = () => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [versionInfo, setVersionInfo] = useState<{ version: string, note?: string } | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initUpdater = async () => {
      try {
        // Notifica o sistema nativo que a versão atual carregou com sucesso
        // Se isso não for chamado, o Capgo reverte para a versão anterior após 30s
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
      // 1. Busca o JSON de versão no GitHub
      // Adiciona timestamp para evitar cache
      const response = await fetch(`${GITHUB_VERSION_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error("Falha ao buscar versão");
      
      const data = await response.json();
      
      // 2. Verifica qual versão está rodando atualmente
      const current = await CapacitorUpdater.current();
      
      // Compara versões (Simples string compare, idealmente usar semver)
      if (data.version !== current.id) {
        setVersionInfo({ version: data.version, note: data.note });
        downloadUpdate(data.url, data.version);
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error("Sem atualizações ou erro:", e);
      setStatus('idle'); // Falha silenciosa para não incomodar o usuário
    }
  };

  const downloadUpdate = async (url: string, version: string) => {
    setStatus('downloading');
    
    // Listener de progresso (Opcional, o Capgo suporta em versões mais novas)
    CapacitorUpdater.addListener('download', (info: any) => {
      setProgress(info.percent);
    });

    try {
      const versionObj = await CapacitorUpdater.download({
        url: url,
        version: version,
      });
      
      // Define como a próxima versão a ser carregada
      await CapacitorUpdater.set(versionObj);
      setStatus('ready');
    } catch (e) {
      console.error("Erro no download:", e);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleReload = async () => {
    // Recarrega o app para aplicar a atualização
    // Em alguns casos o 'set' já faz isso se configurado, mas forçar é seguro
    window.location.reload(); 
  };

  if (status === 'idle' || !Capacitor.isNativePlatform()) return null;

  return (
    <div className="fixed bottom-24 left-6 right-6 z-50 pointer-events-none flex justify-center animate-in slide-in-from-bottom duration-500">
      <div className={`pointer-events-auto bg-white/95 backdrop-blur-md border-2 ${colors.border} shadow-xl rounded-2xl p-4 flex items-center gap-4 max-w-sm w-full`}>
        
        {/* Ícone de Status */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${status === 'error' ? 'bg-red-100 text-red-500' : `${colors.secondary} ${colors.accent}`}`}>
          {status === 'checking' && <RefreshCw size={20} className="animate-spin" />}
          {status === 'downloading' && <ArrowDownCircle size={20} className="animate-bounce" />}
          {status === 'ready' && <CheckCircle size={20} />}
          {status === 'error' && <AlertCircle size={20} />}
        </div>

        {/* Texto */}
        <div className="flex-1">
          {status === 'checking' && (
            <P className="text-xs font-bold text-gray-500">Buscando novidades...</P>
          )}
          
          {status === 'downloading' && (
            <div>
              <P className="text-xs font-bold text-gray-700">Baixando atualização...</P>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full ${colors.primary} transition-all duration-300`} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div>
              <P className="text-xs font-bold text-gray-700">Nova versão pronta!</P>
              <P className="text-[10px] text-gray-400">{versionInfo?.note || "Melhorias disponíveis"}</P>
            </div>
          )}

           {status === 'error' && (
            <P className="text-xs font-bold text-red-400">Ops, tente mais tarde.</P>
          )}
        </div>

        {/* Ação */}
        {status === 'ready' && (
          <button 
            onClick={handleReload}
            className={`px-4 py-2 rounded-xl ${colors.primary} text-white text-xs font-bold shadow-md active:scale-95 transition-transform`}
          >
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
};
