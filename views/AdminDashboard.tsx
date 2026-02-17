import React, { useEffect, useState } from 'react';
import { Terminal, RefreshCw, Trash2, Power, ShieldAlert, Cpu, Activity, Database, LogOut } from 'lucide-react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { P, H2 } from '../components/Typography';

interface LogEntry {
  type: 'info' | 'error' | 'warn';
  msg: string;
  time: string;
}

export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [versionInfo, setVersionInfo] = useState<any>({ current: 'Detectando...', native: '...' });
  const [blockedVersion, setBlockedVersion] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
    checkSystemStatus();
    
    // Auto-refresh logs every 2 seconds
    const interval = setInterval(() => {
        loadLogs();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const loadLogs = () => {
    const savedLogs = localStorage.getItem('app_debug_logs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {}
    }
  };

  const checkSystemStatus = async () => {
    const failed = localStorage.getItem('ota_failed_version');
    setBlockedVersion(failed);

    if (Capacitor.isNativePlatform()) {
        try {
            const current = await CapacitorUpdater.current();
            setVersionInfo({
                current: (current as any).id, // Casting to any to avoid TS error
                native: (await CapacitorUpdater.getLatest()).url || 'N/A'
            });
        } catch (e) {
            setVersionInfo({ current: 'Erro', native: 'Erro' });
        }
    } else {
        setVersionInfo({ current: 'Web Mode', native: 'N/A' });
    }
  };

  const clearOtaBlock = () => {
    localStorage.removeItem('ota_failed_version');
    setBlockedVersion(null);
    alert('Bloqueio de OTA removido. O app tentará atualizar no próximo reinício.');
  };

  const clearAllData = () => {
    if (confirm('ATENÇÃO: Isso apagará o login do usuário (não admin) e logs. Continuar?')) {
        const adminSession = localStorage.getItem('baby_user'); // Preserve admin session
        localStorage.clear();
        if (adminSession) localStorage.setItem('baby_user', adminSession);
        
        loadLogs();
        checkSystemStatus();
        alert('Dados limpos.');
    }
  };

  const forceReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-green-500 font-mono p-4 pb-20 overflow-x-hidden">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-green-900 pb-4">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/20 rounded-lg border border-green-500/50">
                <Terminal size={20} />
            </div>
            <div>
                <H2 className="text-lg text-green-400 font-bold">GOD MODE</H2>
                <P className="text-[10px] text-green-700 uppercase">System Diagnostics</P>
            </div>
        </div>
        <button 
            onClick={onLogout}
            className="p-2 bg-red-900/20 text-red-500 rounded-lg border border-red-900 hover:bg-red-900/40"
        >
            <LogOut size={18} />
        </button>
      </div>

      {/* SYSTEM STATUS CARD */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#111] p-3 rounded-lg border border-green-900">
            <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs uppercase font-bold">
                <Cpu size={14} /> Platform
            </div>
            <div className="text-white text-sm truncate">
                {Capacitor.getPlatform()}
            </div>
        </div>
        <div className="bg-[#111] p-3 rounded-lg border border-green-900">
            <div className="flex items-center gap-2 mb-2 text-gray-500 text-xs uppercase font-bold">
                <Activity size={14} /> Version
            </div>
            <div className="text-white text-sm truncate">
                {versionInfo.current}
            </div>
        </div>
      </div>

      {/* CRITICAL ACTIONS */}
      <div className="space-y-3 mb-8">
        <div className="text-xs font-bold text-gray-600 uppercase mb-1 px-1">OTA Management</div>
        
        {blockedVersion ? (
            <div className="bg-red-900/10 border border-red-500/50 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-red-400 font-bold text-sm flex items-center gap-2">
                        <ShieldAlert size={16} /> BLOQUEIO ATIVO
                    </div>
                    <div className="text-red-500/60 text-xs mt-1">Versão {blockedVersion} marcada como instável.</div>
                </div>
                <button 
                    onClick={clearOtaBlock}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg shadow-red-900/20 active:scale-95"
                >
                    DESBLOQUEAR
                </button>
            </div>
        ) : (
            <div className="bg-green-900/10 border border-green-500/30 p-3 rounded-xl flex items-center gap-2 text-green-600 text-xs">
                <ShieldAlert size={16} />
                Sistema OTA operando normalmente.
            </div>
        )}

        <div className="grid grid-cols-2 gap-3">
             <button 
                onClick={forceReload}
                className="bg-[#222] border border-gray-700 text-gray-300 p-3 rounded-xl flex flex-col items-center justify-center gap-2 active:bg-[#333]"
             >
                <RefreshCw size={20} />
                <span className="text-xs font-bold">Reload App</span>
             </button>
             <button 
                onClick={clearAllData}
                className="bg-[#222] border border-gray-700 text-gray-300 p-3 rounded-xl flex flex-col items-center justify-center gap-2 active:bg-[#333]"
             >
                <Trash2 size={20} />
                <span className="text-xs font-bold">Clear Cache</span>
             </button>
        </div>
      </div>

      {/* LOGS CONSOLE */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <Database size={14} className="text-gray-500"/>
        <span className="text-xs font-bold text-gray-600 uppercase">System Logs</span>
        <span className="text-[10px] bg-gray-800 text-gray-400 px-1.5 rounded-md ml-auto">{logs.length} events</span>
      </div>
      
      <div className="bg-[#050505] border border-gray-800 rounded-xl h-64 overflow-y-auto p-2 font-mono text-[10px] leading-relaxed shadow-inner">
        {logs.length === 0 && (
            <div className="text-gray-700 text-center mt-10 italic">-- No logs recorded --</div>
        )}
        {logs.map((log, i) => (
            <div key={i} className="mb-1 border-b border-gray-900 pb-1 last:border-0">
                <span className="text-gray-600 mr-2">[{log.time}]</span>
                <span className={`font-bold mr-2 ${
                    log.type === 'error' ? 'text-red-500' : 
                    log.type === 'warn' ? 'text-yellow-500' : 'text-blue-500'
                }`}>
                    {log.type.toUpperCase()}
                </span>
                <span className="text-gray-300 break-all">{log.msg}</span>
            </div>
        ))}
      </div>

    </div>
  );
};
