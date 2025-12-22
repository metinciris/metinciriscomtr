import React, { useState, useEffect, useRef } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Trash2, RotateCcw, Volume2, VolumeX, History } from 'lucide-react';

type LogType = 'Reaktif' | 'Metastatik' | 'Deposit';

interface LogEntry {
    id: number;
    type: LogType;
    timestamp: Date;
}

export function LenfNoduSayaci() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [soundEnabled, setSoundEnabled] = useState(true);

    // Derived counts
    const counts = {
        Reaktif: logs.filter(l => l.type === 'Reaktif').length,
        Metastatik: logs.filter(l => l.type === 'Metastatik').length,
        Deposit: logs.filter(l => l.type === 'Deposit').length,
        Total: logs.length
    };

    // Scroll ref for history
    const historyRef = useRef<HTMLDivElement>(null);

    // Audio Context (Lazy init)
    const audioCtxRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Auto-scroll history to top
        if (historyRef.current) {
            historyRef.current.scrollTop = 0;
        }
    }, [logs]);

    const playSound = (type: LogType) => {
        if (!soundEnabled) return;

        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // "Bip" (Reaktif - High, short)
            // "Bop" (Metastatik - Low, alarming)
            // "Bap" (Deposit - Mid, distinct)

            const now = ctx.currentTime;

            if (type === 'Reaktif') {
                // Happy "Ding"
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(660, now);
                oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
            } else if (type === 'Metastatik') {
                // Alarming "Buzz"
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(220, now);
                oscillator.frequency.linearRampToValueAtTime(110, now + 0.2);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
            } else if (type === 'Deposit') {
                // Distinct "Boop"
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(440, now);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
            }

        } catch (error) {
            console.error('Audio playback failed', error);
        }
    };

    const addCount = (type: LogType) => {
        playSound(type);
        setLogs(prev => [
            { id: Date.now(), type, timestamp: new Date() },
            ...prev
        ]);

        // Vibrate on mobile if supported
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    const reset = () => {
        if (window.confirm('Tüm sayacı sıfırlamak istediğinize emin misiniz?')) {
            setLogs([]);
        }
    };

    const deleteLog = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setLogs(prev => prev.filter(l => l.id !== id));
    };

    // Keyboard handlers
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default helpful for Enter to avoid button triggering
            if (e.key === 'Enter') {
                e.preventDefault();
                addCount('Reaktif');
            } else if (e.key === '+' || e.key === 'NumpadAdd') {
                addCount('Metastatik');
            } else if (e.key.toLowerCase() === 'd') {
                addCount('Deposit');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [soundEnabled]); // Re-bind if sound setting changes (though soundEnabled is in scope via closure, useEffect dep ensures freshness if wanted, but simpler is ref or just closure)

    return (
        <PageContainer>
            <div className="flex flex-col h-[calc(100vh-140px)] select-none">

                {/* Header Section */}
                <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Lenf Nodu Sayacı</h1>
                        <p className="text-xs text-slate-500 hidden sm:block">Klavye: Enter (Reaktif), + (Metastatik), D (Deposit)</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-3 rounded-xl transition-colors ${soundEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                        >
                            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                        </button>
                        <button
                            onClick={reset}
                            className="p-3 rounded-xl bg-slate-100 text-slate-600 pid hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                            <RotateCcw size={24} />
                        </button>
                    </div>
                </div>

                {/* Grand Total Display */}
                <div className="bg-slate-800 text-white rounded-3xl p-6 mb-6 text-center shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>

                    <div className="relative z-10">
                        <div className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-1">Toplam Lenf Nodu</div>
                        <div className="text-8xl font-bold font-mono tracking-tight leading-none">
                            {counts.Total}
                        </div>
                    </div>
                </div>

                <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 min-h-0">
                    {/* BUTTONS - REAKTIF */}
                    <button
                        onClick={() => addCount('Reaktif')}
                        className="group relative flex flex-col items-center justify-center bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all duration-150 rounded-3xl shadow-xl overflow-hidden md:h-full p-6 min-h-[160px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-emerald-100 text-lg font-bold mb-2 uppercase tracking-widest">Reaktif</span>
                        <span className="text-white text-7xl font-bold">{counts.Reaktif}</span>
                        <span className="absolute bottom-4 text-emerald-200/50 text-xs font-mono">ENTER</span>
                    </button>

                    {/* BUTTONS - METASTATIK */}
                    <button
                        onClick={() => addCount('Metastatik')}
                        className="group relative flex flex-col items-center justify-center bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all duration-150 rounded-3xl shadow-xl overflow-hidden md:h-full p-6 min-h-[160px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-rose-100 text-lg font-bold mb-2 uppercase tracking-widest">Metastatik</span>
                        <span className="text-white text-7xl font-bold">{counts.Metastatik}</span>
                        <span className="absolute bottom-4 text-rose-200/50 text-xs font-mono">( + )</span>
                    </button>

                    {/* BUTTONS - DEPOSIT */}
                    <button
                        onClick={() => addCount('Deposit')}
                        className="group relative flex flex-col items-center justify-center bg-violet-500 hover:bg-violet-600 active:scale-95 transition-all duration-150 rounded-3xl shadow-xl overflow-hidden md:h-full p-6 min-h-[160px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-violet-100 text-lg font-bold mb-2 uppercase tracking-widest">Deposit</span>
                        <span className="text-white text-7xl font-bold">{counts.Deposit}</span>
                        <span className="absolute bottom-4 text-violet-200/50 text-xs font-mono">Key: D</span>
                    </button>
                </main>

                {/* History Log */}
                <div className="h-48 md:h-64 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                        <History size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500 uppercase">Son İşlemler</span>
                    </div>
                    <div ref={historyRef} className="flex-1 overflow-y-auto p-2 space-y-2">
                        {logs.length === 0 && (
                            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                Henüz kayıt yok...
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${log.type === 'Reaktif' ? 'bg-emerald-500' :
                                            log.type === 'Metastatik' ? 'bg-rose-500' :
                                                'bg-violet-500'
                                        }`}></div>
                                    <span className={`font-bold ${log.type === 'Reaktif' ? 'text-emerald-700' :
                                            log.type === 'Metastatik' ? 'text-rose-700' :
                                                'text-violet-700'
                                        }`}>{log.type}</span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {log.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => deleteLog(log.id, e)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Sil"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}
