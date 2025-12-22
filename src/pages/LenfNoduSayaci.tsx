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

            const now = ctx.currentTime;

            if (type === 'Reaktif') {
                // "Bip" - Clean Sine (unchanged, maybe slightly higher)
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(700, now);
                oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                oscillator.start(now);
                oscillator.stop(now + 0.15);
            } else if (type === 'Metastatik') {
                // "Bop" - Lower Sine/Triangle (Less annoying than sawtooth)
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(150, now); // Lower pitch
                oscillator.frequency.linearRampToValueAtTime(100, now + 0.2); // Sliding down
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
                oscillator.start(now);
                oscillator.stop(now + 0.2);
            } else if (type === 'Deposit') {
                // "Bap" - Short high pip
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1200, now);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                oscillator.start(now);
                oscillator.stop(now + 0.08);
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
            if (e.key === 'Enter') {
                e.preventDefault();
                addCount('Reaktif');
            } else if (e.key === '+' || e.key === 'NumpadAdd') {
                addCount('Metastatik');
            } else if (e.key === '0' || e.key === 'Numpad0') {
                addCount('Deposit');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [soundEnabled]);

    return (
        <PageContainer>
            <div className="flex flex-col h-[calc(100vh-140px)] select-none">

                {/* Header Controls */}
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-bold text-slate-800">Lenf Nodu Sayacı</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}
                            title="Ses Aç/Kapa"
                        >
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button
                            onClick={reset}
                            className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Sıfırla"
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>

                {/* Top Summary Row REMOVED per user request */}

                {/* Main Counter Buttons - INLINE STYLES FORCED */}
                <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 min-h-[50vh]">
                    {/* REAKTIF */}
                    <button
                        onClick={() => addCount('Reaktif')}
                        className="group relative flex flex-col items-center justify-center transition-all duration-100 rounded-3xl shadow-xl hover:shadow-2xl active:scale-[0.98] active:translate-y-2 border-b-8 active:border-b-0"
                        style={{ backgroundColor: '#10b981', borderColor: '#047857' }}
                    >
                        <div className="text-emerald-100 text-2xl font-bold mb-4 uppercase tracking-widest">Reaktif</div>
                        <div className="rounded-2xl px-8 py-2 mb-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(6, 95, 70, 0.2)' }}>
                            <span className="text-white text-9xl font-black tracking-tighter drop-shadow-lg">{counts.Reaktif}</span>
                        </div>
                        <div className="absolute bottom-6 px-4 py-1 bg-black/20 rounded-full text-white/90 font-mono text-sm">
                            Tuş: Enter
                        </div>
                    </button>

                    {/* METASTATIK */}
                    <button
                        onClick={() => addCount('Metastatik')}
                        className="group relative flex flex-col items-center justify-center transition-all duration-100 rounded-3xl shadow-xl hover:shadow-2xl active:scale-[0.98] active:translate-y-2 border-b-8 active:border-b-0"
                        style={{ backgroundColor: '#f43f5e', borderColor: '#be123c' }}
                    >
                        <div className="text-rose-100 text-2xl font-bold mb-4 uppercase tracking-widest">Metastatik</div>
                        <div className="rounded-2xl px-8 py-2 mb-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(159, 18, 57, 0.2)' }}>
                            <span className="text-white text-9xl font-black tracking-tighter drop-shadow-lg">{counts.Metastatik}</span>
                        </div>
                        <div className="absolute bottom-6 px-4 py-1 bg-black/20 rounded-full text-white/90 font-mono text-sm">
                            Tuş: +
                        </div>
                    </button>

                    {/* DEPOSIT */}
                    <button
                        onClick={() => addCount('Deposit')}
                        className="group relative flex flex-col items-center justify-center transition-all duration-100 rounded-3xl shadow-xl hover:shadow-2xl active:scale-[0.98] active:translate-y-2 border-b-8 active:border-b-0"
                        style={{ backgroundColor: '#8b5cf6', borderColor: '#6d28d9' }}
                    >
                        <div className="text-violet-100 text-2xl font-bold mb-4 uppercase tracking-widest">Deposit</div>
                        <div className="rounded-2xl px-8 py-2 mb-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(91, 33, 182, 0.2)' }}>
                            <span className="text-white text-9xl font-black tracking-tighter drop-shadow-lg">{counts.Deposit}</span>
                        </div>
                        <div className="absolute bottom-6 px-4 py-1 bg-black/20 rounded-full text-white/90 font-mono text-sm">
                            Tuş: 0
                        </div>
                    </button>
                </main>

                {/* History Log - TALLER */}
                <div className="h-64 md:h-80 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col shadow-sm scroll-mt-4">
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
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: log.type === 'Reaktif' ? '#10b981' : log.type === 'Metastatik' ? '#f43f5e' : '#8b5cf6' }}></div>
                                    <span className="font-bold" style={{ color: log.type === 'Reaktif' ? '#047857' : log.type === 'Metastatik' ? '#be123c' : '#6d28d9' }}>{log.type}</span>
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
