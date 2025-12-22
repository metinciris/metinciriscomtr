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
                // "Bum" - Low, serious thud (Neutral)
                oscillator.type = 'triangle'; // Triangle has a bit more weight than sine
                oscillator.frequency.setValueAtTime(200, now);
                oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                gainNode.gain.setValueAtTime(0.3, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
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
                <div className="flex flex-col gap-1 mb-4">
                    <div className="flex items-center justify-between">
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
                    {/* Shortcuts moved here */}
                    <div className="text-sm text-slate-500 font-medium">
                        Klavye: <span className="text-emerald-600 font-bold">Enter (Reaktif)</span> • <span className="text-rose-600 font-bold">+ (Metastatik)</span> • <span className="text-violet-600 font-bold">0 (Deposit)</span>
                    </div>
                </div>

                {/* Main Counter Buttons - HUGE */}
                <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 min-h-[600px]">
                    {/* REAKTIF */}
                    <button
                        onClick={() => addCount('Reaktif')}
                        className="group relative flex flex-col items-center justify-center transition-all duration-100 rounded-[3rem] shadow-xl hover:shadow-2xl active:scale-[0.98] active:translate-y-2 border-b-8 active:border-b-0 overflow-hidden"
                        style={{ backgroundColor: '#10b981', borderColor: '#047857' }}
                    >
                        <div
                            className="text-3xl font-bold uppercase tracking-widest text-left pointer-events-none"
                            style={{ position: 'absolute', top: '24px', left: '24px', color: 'white' }}
                        >
                            Reaktif
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full">
                            <span className="text-white font-black tracking-tighter drop-shadow-lg leading-none select-none" style={{ fontSize: '12rem' }}>
                                {counts.Reaktif}
                            </span>
                        </div>
                    </button>

                    {/* METASTATIK */}
                    <button
                        onClick={() => addCount('Metastatik')}
                        className="group relative flex flex-col items-center justify-center transition-all duration-100 rounded-[3rem] shadow-xl hover:shadow-2xl active:scale-[0.98] active:translate-y-2 border-b-8 active:border-b-0 overflow-hidden"
                        style={{ backgroundColor: '#f43f5e', borderColor: '#be123c' }}
                    >
                        <div
                            className="text-3xl font-bold uppercase tracking-widest text-left pointer-events-none"
                            style={{ position: 'absolute', top: '24px', left: '24px', color: 'white' }}
                        >
                            Metastatik
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full">
                            <span className="text-white font-black tracking-tighter drop-shadow-lg leading-none select-none" style={{ fontSize: '12rem' }}>
                                {counts.Metastatik}
                            </span>
                        </div>
                    </button>

                    {/* DEPOSIT */}
                    <button
                        onClick={() => addCount('Deposit')}
                        className="group relative flex flex-col items-center justify-center transition-all duration-100 rounded-[3rem] shadow-xl hover:shadow-2xl active:scale-[0.98] active:translate-y-2 border-b-8 active:border-b-0 overflow-hidden"
                        style={{ backgroundColor: '#8b5cf6', borderColor: '#6d28d9' }}
                    >
                        <div
                            className="text-3xl font-bold uppercase tracking-widest text-left pointer-events-none"
                            style={{ position: 'absolute', top: '24px', left: '24px', color: 'white' }}
                        >
                            Deposit
                        </div>
                        <div className="flex-1 flex items-center justify-center w-full">
                            <span className="text-white font-black tracking-tighter drop-shadow-lg leading-none select-none" style={{ fontSize: '12rem' }}>
                                {counts.Deposit}
                            </span>
                        </div>
                    </button>
                </main>

                {/* History Log - CHIPS */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        <History size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Son İşlemler (Silmek için tıklayın)</span>
                    </div>

                    <div className="flex flex-wrap gap-2 content-start pb-8">
                        {logs.length === 0 && (
                            <span className="text-slate-300 text-sm italic">Henüz işlem yok</span>
                        )}
                        {logs.map((log, index) => (
                            <button
                                key={log.id}
                                onClick={(e) => deleteLog(log.id, e)}
                                className={`px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-2 text-sm font-bold text-white relative group border-b-2 active:border-b-0 ${index === 0 ? 'ring-2 ring-offset-2 ring-offset-slate-100 ring-slate-400 scale-105 font-black' : ''}`}
                                style={{
                                    backgroundColor: log.type === 'Reaktif' ? '#10b981' : log.type === 'Metastatik' ? '#f43f5e' : '#8b5cf6',
                                    borderColor: log.type === 'Reaktif' ? '#047857' : log.type === 'Metastatik' ? '#be123c' : '#6d28d9'
                                }}
                                title={`${log.timestamp.toLocaleTimeString()} - Silmek için tıkla`}
                            >
                                <span>{index === 0 ? '👉️ ' : ''}{log.type}</span>
                                <span className="opacity-70 text-[10px] bg-black/10 px-1 rounded">
                                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </PageContainer>
    );
}
