
import React, { useEffect, useState } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { ArrowDownCircle, RefreshCw, CheckCircle, XCircle, ShieldAlert, Terminal, Trash2, X } from 'lucide-react';
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
    
    // Intercepta erros globais para salvar no log
    const originalError = console.error;
    console.error = (...args) => {
      addLog('error', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      addLog('warn', args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      originalWarn.apply(console, args);
    };

  }, []);

  const addLog = (type: 'info' | 'error' | 'warn', msg: string) => {
    const newLog = {
      type,
      msg: msg.substring(0, 300), // Limita tamanho
      time: new Date().toLocaleTimeString()
    };
    
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // Guarda os ultimos 50
      localStorage.setItem('app_debug_logs', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initUpdater = async () => {
      try {
        addLog('info', 'Iniciando CapacitorUpdater notifyAppReady');
        await CapacitorUpdater.notifyAppReady();
        addLog('info', 'AppReady notificado com sucesso');
        checkForUpdates();
      } catch (e) {
        addLog('error', `Erro notifyAppReady: ${JSON.stringify(e)}`);
      }
    };

    initUpdater();
  }, []);

  const checkForUpdates = async () => {
    if (status === 'downloading' || status === 'ready') return;
    
    setStatus('checking');
    try {
      addLog('info', `Buscando versão em: ${GITHUB_VERSION_URL}`);
      const response = await fetch(`${GITHUB_VERSION_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const data = await response.json();
      addLog('info', `Versão remota: ${data.version}`);

      const current = await CapacitorUpdater.current();
      addLog('info', `Versão atual instalada: ${current.bundle}`);

      // Lógica Simplificada: Se for diferente, baixa.
      // Removemos o bloqueio via localStorage ('ota_failed_version') para evitar falsos positivos.
      // O plugin nativo fará o rollback se o app crashar no boot.
      
      if (data.version !== current.bundle) {
        addLog('info', `Nova versão detectada: ${data.version}. Iniciando processo...`);
        setVersionInfo({ version: data.version, note: data.note });
        downloadUpdate(data.url, data.version);
      } else {
        addLog('info', 'App atualizado.');
        setStatus('idle');
      }
    } catch (e) {
      addLog('error', `Erro checkUpdates: ${e}`);
      setStatus('idle');
    }
  };

  const downloadUpdate = async (url: string, version: string) => {
    setStatus('downloading');
    
    CapacitorUpdater.addListener('download', (info: any) => {
      setProgress(info.percent);
    });

    try {
      addLog('info', `Baixando ZIP: ${url}`);
      const versionObj = await CapacitorUpdater.download({
        url: url,
        version: version,
      });
      
      addLog('info', 'Download concluído. Configurando boot...');
      await CapacitorUpdater.set(versionObj);
      
      addLog('info', 'Update configurado. Pronto para reiniciar.');
      setStatus('ready');
    } catch (e) {
      addLog('error', `Erro no download/set: ${JSON.stringify(e)}`);
      setStatus('error');
      // Reseta para idle após um tempo para permitir nova tentativa futura
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleReload = async () => {
    // Recarrega a página para carregar os novos arquivos do bundle
    window.location.reload(); 
  };

  const handleDebugClick = () => {
    const newCount = debugClicks + 1;
    setDebugClicks(newCount);
    if (newCount >= 5) {
      setShowDebug(true);
      setDebugClicks(0);
    }
  };

  const clearLogsAndReset = () => {
    localStorage.removeItem('ota_failed_version'); // Limpeza legado
    localStorage.removeItem('app_debug_logs');
    setLogs([]);
    alert("Logs limpos.");
    setShowDebug(false);
    setStatus('idle');
    checkForUpdates();
  };

  // DEBUG OVERLAY
  if (showDebug) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 text-green-400 p-4 font-mono text-xs overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-green-800 pb-2">
          <h3 className="font-bold flex items-center gap-2"><Terminal size={16}/> DEBUG CONSOLE</h3>
          <button onClick={() => setShowDebug(false)}><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 mb-4">
          {logs.length === 0 && <span className="opacity-50">Nenhum log registrado.</span>}
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
            className="flex-1 bg-red-900/50 border border-red-500 text-red-200 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> LIMPAR LOGS
          </button>
        </div>
      </div>
    );
  }

  if (status === 'idle' || !Capacitor.isNativePlatform()) return null;

  // Renderização compacta para erros
  if (status === 'error' || status === 'blocked') {
    return (
      <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center animate-in slide-in-from-bottom duration-300">
        <div 
          onClick={handleDebugClick}
          className="bg-white/90 backdrop-blur-md shadow-lg border border-red-100 rounded-full py-2 px-4 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
        >
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