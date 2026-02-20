import React, { useEffect, useState } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { ArrowDownCircle, RefreshCw, CheckCircle, XCircle, Terminal, Trash2, X, ShieldAlert } from 'lucide-react';
import { useTheme } from '../themeContext';
import { P } from './Typography';

// URL DO ARQUIVO JSON NO GITHUB (RAW)
const GITHUB_VERSION_URL = 'https://raw.githubusercontent.com/hudsonfs7/BabyAlbum/main/version.json';

// Interface para logs
interface LogEntry {
  type: 'info' | 'error' | 'warn';
  msg: string;
  time: string;
}

export const OtaUpdater: React.FC = () => {
  const { colors } = useTheme();
  const [status, setStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready' | 'error' | 'blocked'>('idle');
  const [progress, setProgress] = useState(0);
  const [versionInfo, setVersionInfo] = useState<{ version: string, note?: string } | null>(null);
  
  // Debug States
  const [debugClicks, setDebugClicks] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Carrega logs salvos ao iniciar
  useEffect(() => {
    const savedLogs = localStorage.getItem('app_debug_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {}
    }
  }, []);

  const addLog = (type: 'info' | 'error' | 'warn', msg: string) => {
    const newLog = {
      type,
      msg: msg.substring(0, 300),
      time: new Date().toLocaleTimeString()
    };
    
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50);
      localStorage.setItem('app_debug_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Lógica principal de atualização com TRAVA DE SEGURANÇA
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const executeSafeOtaLogic = async () => {
      setStatus('checking');
      
      // --- FASE 1: DIAGNÓSTICO DE BOOT (A Trava) ---
      const lastAttempt = localStorage.getItem('ota_attempt_version');
      
      let currentBundle = "";
      try {
        const current = await CapacitorUpdater.current();
        // Cast to any because TS might complain about id property depending on version
        currentBundle = (current as any).id || ""; 
      } catch (e) {
        addLog('info', 'Versão nativa (0.0.0).');
        currentBundle = "";
      }

      addLog('info', `BOOT: Atual="${currentBundle || 'Nativa'}", Tentativa="${lastAttempt || 'Nenhuma'}"`);

      // Se havia uma tentativa pendente...
      if (lastAttempt) {
        if (lastAttempt !== currentBundle) {
          // ...e não estamos nela: O SISTEMA REVERTEU. FALHA GRAVE.
          addLog('error', `TRAVA ATIVADA: Falha ao bootar versão ${lastAttempt}. Bloqueando.`);
          localStorage.setItem('ota_failed_version', lastAttempt);
          localStorage.removeItem('ota_attempt_version');
        } else {
          // ...e estamos nela: SUCESSO.
          addLog('info', `Sucesso: Atualização para ${lastAttempt} confirmada.`);
          localStorage.removeItem('ota_attempt_version');
        }
      }

      // --- FASE 2: NOTIFICAR SISTEMA ---
      try {
        await CapacitorUpdater.notifyAppReady();
        addLog('info', 'AppReady notificado.');
      } catch (e) {
        // Ignora erro se for versão nativa antiga
      }

      // --- FASE 3: BUSCAR NOVA VERSÃO ---
      let remoteData;
      try {
        const response = await fetch(`${GITHUB_VERSION_URL}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Erro HTTP');
        remoteData = await response.json();
      } catch (e) {
        addLog('warn', 'Offline/Erro busca. Abortando.');
        setStatus('idle');
        return;
      }

      const remoteVersion = remoteData.version;
      const blockedVersion = localStorage.getItem('ota_failed_version');

      // --- FASE 4: VERIFICAÇÕES DE SEGURANÇA ---
      
      // 1. Verifica se a versão está bloqueada
      if (blockedVersion === remoteVersion) {
        addLog('warn', `Versão ${remoteVersion} está na lista negra (Falha anterior). Mantendo versão atual.`);
        setStatus('idle'); // Fica quieto
        return;
      }

      // 2. Verifica se já temos essa versão
      if (currentBundle === remoteVersion) {
        addLog('info', 'Versão já atualizada.');
        setStatus('idle');
        return;
      }

      // --- FASE 5: EXECUTAR ATUALIZAÇÃO ---
      addLog('info', `Iniciando atualização: ${currentBundle} -> ${remoteVersion}`);
      setVersionInfo({ version: remoteVersion, note: remoteData.note });
      
      // MARCA A TENTATIVA (A "Bandeira" que detecta o loop)
      localStorage.setItem('ota_attempt_version', remoteVersion);
      
      await downloadAndSetUpdate(remoteData.url, remoteVersion);
    };

    executeSafeOtaLogic();
  }, []);

  const downloadAndSetUpdate = async (url: string, version: string) => {
    setStatus('downloading');
    
    const listener = await CapacitorUpdater.addListener('download', (info: any) => {
      setProgress(info.percent);
    });

    try {
      const versionObj = await CapacitorUpdater.download({
        url: url,
        version: version,
      });
      
      addLog('info', 'Download OK. Configurando boot...');
      await CapacitorUpdater.set(versionObj);
      
      addLog('info', 'Boot configurado. Aguardando usuário.');
      setStatus('ready');
      listener.remove();

    } catch (e) {
      addLog('error', `Erro crítico Download/Set: ${JSON.stringify(e)}`);
      setStatus('error');
      // Se falhou o download, limpa a tentativa pois não vai reiniciar
      localStorage.removeItem('ota_attempt_version');
      listener.remove();
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleReload = async () => {
    window.location.reload(); 
  };

  const handleDebugClick = () => {
    setDebugClicks(p => p + 1);
    if (debugClicks + 1 >= 5) {
      setShowDebug(true);
      setDebugClicks(0);
    }
  };

  const clearLogsAndReset = () => {
    localStorage.removeItem('app_debug_logs');
    // Opcional: Limpar trava manualmente via debug
    localStorage.removeItem('ota_failed_version');
    setLogs([]);
    setShowDebug(false);
    alert('Logs e travas limpos.');
  };

  // --- UI RENDER ---

  if (showDebug) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 text-green-400 p-4 font-mono text-xs overflow-hidden flex flex-col animate-in fade-in">
        <div className="flex justify-between items-center mb-4 border-b border-green-800 pb-2">
          <h3 className="font-bold flex items-center gap-2"><Terminal size={16}/> OTA DEBUGGER</h3>
          <button onClick={() => setShowDebug(false)}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 mb-4 select-text">
          {logs.length === 0 && <span className="opacity-50">Sem logs.</span>}
          {logs.map((l, i) => (
            <div key={i} className={`border-b border-white/10 pb-1 ${l.type === 'error' ? 'text-red-400' : l.type === 'warn' ? 'text-yellow-400' : 'text-green-400'}`}>
              <span className="opacity-50 mr-2">[{l.time}]</span>
              <span className="font-bold mr-2 uppercase">[{l.type}]</span>
              {l.msg}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={clearLogsAndReset}
            className="flex-1 bg-red-900/40 border border-red-500/50 text-red-200 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> RESETAR TRAVAS
          </button>
        </div>
      </div>
    );
  }

  // Se não for nativo ou estiver idle (incluindo bloqueado/quieto), não renderiza nada
  if (!Capacitor.isNativePlatform() || status === 'idle') return null;

  if (status === 'error') {
    return (
      <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center animate-in slide-in-from-bottom duration-300 pointer-events-none">
        <div 
          onClick={handleDebugClick}
          className="pointer-events-auto bg-white/90 backdrop-blur-md shadow-lg border border-red-100 rounded-full py-2 px-4 flex items-center gap-2 cursor-pointer"
        >
           <XCircle size={16} className="text-red-400" />
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
             Falha na conexão
           </span>
        </div>
      </div>
    );
  }

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

        <div className="flex-1 min-w-0" onClick={handleDebugClick}>
          {status === 'checking' && (
            <div className="flex flex-col">
              <P className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Buscando novidades...</P>
            </div>
          )}
          
          {status === 'downloading' && (
            <div className="w-full">
              <div className="flex justify-between items-end mb-1.5">
                <P className="text-xs font-bold text-gray-700">Baixando atualização</P>
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
                {versionInfo?.note || "Toque para atualizar"}
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
