import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Play, Pause, RotateCcw, Settings, X, Volume2, VolumeX, Clock, Zap } from 'lucide-react';

// ────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────
interface TimerSettings {
    colorTheme: 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'indigo';
    displayMode: 'digital' | 'minimal' | 'circle';
    soundEnabled: boolean;
    showMilliseconds: boolean;
}

interface Preset {
    label: string;
    minutes: number;
    color: string;
    icon: string;
}

// ────────────────────────────────────────────────────────────
//  Constants
// ────────────────────────────────────────────────────────────
const PRESETS: Preset[] = [
    { label: 'TUS', minutes: 135, color: '#7c3aed', icon: '🎯' },
    { label: 'DUS', minutes: 150, color: '#2563eb', icon: '🦷' },
    { label: 'YDS', minutes: 180, color: '#059669', icon: '📝' },
    { label: 'Ders Saati', minutes: 50, color: '#dc2626', icon: '📚' },
];

const THEMES: Record<TimerSettings['colorTheme'], { bg: string; ring: string; text: string; btn: string; glow: string; hex: string }> = {
    violet: { bg: 'from-violet-900 via-purple-900 to-indigo-900', ring: '#8b5cf6', text: 'text-violet-300', btn: 'bg-violet-600 hover:bg-violet-500', glow: 'shadow-violet-500/40', hex: '#8b5cf6' },
    emerald: { bg: 'from-emerald-900 via-teal-900 to-green-900', ring: '#10b981', text: 'text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-500', glow: 'shadow-emerald-500/40', hex: '#10b981' },
    rose: { bg: 'from-rose-900 via-pink-900 to-red-900', ring: '#f43f5e', text: 'text-rose-300', btn: 'bg-rose-600 hover:bg-rose-500', glow: 'shadow-rose-500/40', hex: '#f43f5e' },
    amber: { bg: 'from-amber-900 via-orange-900 to-yellow-900', ring: '#f59e0b', text: 'text-amber-300', btn: 'bg-amber-600 hover:bg-amber-500', glow: 'shadow-amber-500/40', hex: '#f59e0b' },
    cyan: { bg: 'from-cyan-900 via-sky-900 to-blue-900', ring: '#06b6d4', text: 'text-cyan-300', btn: 'bg-cyan-600 hover:bg-cyan-500', glow: 'shadow-cyan-500/40', hex: '#06b6d4' },
    indigo: { bg: 'from-indigo-900 via-blue-900 to-slate-900', ring: '#6366f1', text: 'text-indigo-300', btn: 'bg-indigo-600 hover:bg-indigo-500', glow: 'shadow-indigo-500/40', hex: '#6366f1' },
};

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────
function pad(n: number) {
    return String(Math.floor(n)).padStart(2, '0');
}

function beep(ctx: AudioContext | null) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
}

// ────────────────────────────────────────────────────────────
//  SVG Progress Ring
// ────────────────────────────────────────────────────────────
function ProgressRing({ progress, color, size = 300 }: { progress: number; color: string; size?: number }) {
    const radius = (size / 2) * 0.82;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - progress);
    return (
        <svg width={size} height={size} className="absolute inset-0 m-auto" style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}>
            {/* bg track */}
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
            {/* progress */}
            <circle
                cx={size / 2} cy={size / 2} r={radius}
                fill="none"
                stroke={color}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
        </svg>
    );
}

// ────────────────────────────────────────────────────────────
//  Digit block for digital display
// ────────────────────────────────────────────────────────────
function DigitBlock({ value, label }: { value: string; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div
                className="font-mono font-black text-white select-none"
                style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', lineHeight: 1, letterSpacing: '0.04em', textShadow: '0 0 30px currentColor' }}
            >
                {value}
            </div>
            <div className="text-white/40 text-xs mt-1 uppercase tracking-widest">{label}</div>
        </div>
    );
}

// ────────────────────────────────────────────────────────────
//  Main Component
// ────────────────────────────────────────────────────────────
export function GeriSayim() {
    const [settings, setSettings] = useState<TimerSettings>({
        colorTheme: 'violet',
        displayMode: 'digital',
        soundEnabled: true,
        showMilliseconds: false,
    });
    const [showSettings, setShowSettings] = useState(false);

    // Timer state (in ms)
    const [totalMs, setTotalMs] = useState(135 * 60 * 1000);
    const [remainingMs, setRemainingMs] = useState(135 * 60 * 1000);
    const [isRunning, setIsRunning] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [activePreset, setActivePreset] = useState<number>(0);

    // Custom input
    const [inputH, setInputH] = useState(2);
    const [inputM, setInputM] = useState(15);
    const [inputS, setInputS] = useState(0);

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const lastTickRef = useRef<number>(0);

    const theme = THEMES[settings.colorTheme];

    // ── Audio context (lazy init) ──
    const getAudioCtx = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioCtxRef.current;
    }, []);

    // ── Interval tick ──
    useEffect(() => {
        if (isRunning) {
            lastTickRef.current = Date.now();
            intervalRef.current = setInterval(() => {
                const now = Date.now();
                const delta = now - lastTickRef.current;
                lastTickRef.current = now;
                setRemainingMs(prev => {
                    const next = Math.max(0, prev - delta);
                    if (next === 0) {
                        setIsRunning(false);
                        setIsFinished(true);
                        if (settings.soundEnabled) {
                            const ctx = getAudioCtx();
                            for (let i = 0; i < 3; i++) setTimeout(() => beep(ctx), i * 500);
                        }
                    }
                    return next;
                });
            }, 50);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, settings.soundEnabled, getAudioCtx]);

    // ── Beep at last 5 seconds ──
    useEffect(() => {
        if (!isRunning || !settings.soundEnabled) return;
        const secs = Math.ceil(remainingMs / 1000);
        if (secs <= 5 && secs > 0) {
            beep(getAudioCtx());
        }
    }, [Math.ceil(remainingMs / 1000)]);

    // ── Derived ──
    const progress = totalMs > 0 ? remainingMs / totalMs : 0;
    const hours = Math.floor(remainingMs / 3_600_000);
    const minutes = Math.floor((remainingMs % 3_600_000) / 60_000);
    const seconds = Math.floor((remainingMs % 60_000) / 1_000);
    const millis = Math.floor((remainingMs % 1_000) / 10);

    // ── Actions ──
    const applyCustomTime = () => {
        const ms = ((inputH * 3600) + (inputM * 60) + inputS) * 1000;
        if (ms <= 0) return;
        setTotalMs(ms);
        setRemainingMs(ms);
        setIsRunning(false);
        setIsFinished(false);
        setActivePreset(-1);
    };

    const applyPreset = (idx: number) => {
        const ms = PRESETS[idx].minutes * 60 * 1000;
        setTotalMs(ms);
        setRemainingMs(ms);
        setIsRunning(false);
        setIsFinished(false);
        setActivePreset(idx);
        setInputH(0);
        setInputM(PRESETS[idx].minutes);
        setInputS(0);
    };

    const handleReset = () => {
        setRemainingMs(totalMs);
        setIsRunning(false);
        setIsFinished(false);
    };

    const handleStartPause = () => {
        if (isFinished) return;
        if (!isRunning && settings.soundEnabled) {
            const ctx = getAudioCtx();
            beep(ctx);
        }
        setIsRunning(r => !r);
    };

    // ── Progress bar width ──
    const barWidth = `${(progress * 100).toFixed(2)}%`;

    // ── Ring size responsive ──
    const ringSize = 280;

    return (
        <PageContainer>
            {/* Settings Panel */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white font-bold text-xl flex items-center gap-2">
                                <Settings size={20} className="text-violet-400" />
                                Ayarlar
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Color theme */}
                        <div className="mb-5">
                            <p className="text-gray-400 text-sm font-medium mb-3">Renk Teması</p>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(THEMES) as TimerSettings['colorTheme'][]).map(k => (
                                    <button
                                        key={k}
                                        onClick={() => setSettings(s => ({ ...s, colorTheme: k }))}
                                        className="w-8 h-8 rounded-full border-2 transition-all"
                                        style={{
                                            backgroundColor: THEMES[k].hex,
                                            borderColor: settings.colorTheme === k ? 'white' : 'transparent',
                                            transform: settings.colorTheme === k ? 'scale(1.2)' : 'scale(1)',
                                        }}
                                        title={k}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Display mode */}
                        <div className="mb-5">
                            <p className="text-gray-400 text-sm font-medium mb-3">Kadran Modu</p>
                            <div className="grid grid-cols-3 gap-2">
                                {(['digital', 'minimal', 'circle'] as TimerSettings['displayMode'][]).map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setSettings(s => ({ ...s, displayMode: m }))}
                                        className="py-2 rounded-xl text-sm font-medium transition-all"
                                        style={{
                                            background: settings.displayMode === m ? theme.hex : 'rgba(255,255,255,0.05)',
                                            color: settings.displayMode === m ? 'white' : '#9ca3af',
                                            border: `1px solid ${settings.displayMode === m ? theme.hex : 'rgba(255,255,255,0.1)'}`,
                                        }}
                                    >
                                        {m === 'digital' ? '🖥 Dijital' : m === 'minimal' ? '✦ Minimal' : '⭕ Çember'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sound */}
                        <div className="mb-5">
                            <p className="text-gray-400 text-sm font-medium mb-3">Ses</p>
                            <button
                                onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                                className="flex items-center gap-3 w-full py-2 px-3 rounded-xl transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {settings.soundEnabled ? <Volume2 size={18} className="text-green-400" /> : <VolumeX size={18} className="text-gray-500" />}
                                <span className="text-white text-sm">{settings.soundEnabled ? 'Ses Açık' : 'Ses Kapalı'}</span>
                            </button>
                        </div>

                        {/* Milliseconds */}
                        <div>
                            <p className="text-gray-400 text-sm font-medium mb-3">Milisaniye Göster</p>
                            <button
                                onClick={() => setSettings(s => ({ ...s, showMilliseconds: !s.showMilliseconds }))}
                                className="flex items-center gap-3 w-full py-2 px-3 rounded-xl transition-all"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                <span className="text-white text-sm">{settings.showMilliseconds ? '✅ Gösteriliyor' : '⬜ Gizli'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dark full-page wrapper */}
            <div className={`min-h-screen bg-gradient-to-br ${theme.bg} -mx-4 sm:-mx-6 lg:-mx-8 -my-8 px-4 pb-16`} style={{ marginTop: '-2rem' }}>
                <div className="max-w-2xl mx-auto pt-8">

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <Clock size={20} className="text-white/60" />
                                <h1 className="text-white font-black text-2xl tracking-tight">Geri Sayım</h1>
                            </div>
                            <p className="text-white/40 text-sm mt-0.5">Sınav ve çalışma sayacı</p>
                        </div>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    {/* ── Quick Presets ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                        {PRESETS.map((p, i) => (
                            <button
                                key={p.label}
                                onClick={() => applyPreset(i)}
                                className="flex flex-col items-center gap-1 py-3 px-2 rounded-2xl transition-all duration-200 border"
                                style={{
                                    background: activePreset === i ? p.color + 'cc' : 'rgba(255,255,255,0.06)',
                                    borderColor: activePreset === i ? p.color : 'rgba(255,255,255,0.1)',
                                    boxShadow: activePreset === i ? `0 4px 20px ${p.color}55` : 'none',
                                    transform: activePreset === i ? 'scale(1.04)' : 'scale(1)',
                                }}
                            >
                                <span className="text-xl">{p.icon}</span>
                                <span className="text-white font-bold text-sm">{p.label}</span>
                                <span className="text-white/50 text-xs">{p.minutes} dk</span>
                            </button>
                        ))}
                    </div>

                    {/* ── Custom Time Input ── */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8">
                        <p className="text-white/50 text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Zap size={12} /> Manuel Süre
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex flex-col items-center">
                                <input
                                    type="number" min={0} max={23}
                                    value={inputH}
                                    onChange={e => setInputH(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                                    className="w-full text-center bg-white/10 border border-white/10 rounded-xl py-2 text-white font-mono text-xl font-bold focus:outline-none focus:border-white/30 transition-colors"
                                />
                                <span className="text-white/40 text-xs mt-1">saat</span>
                            </div>
                            <span className="text-white/40 font-bold text-2xl mb-4">:</span>
                            <div className="flex-1 flex flex-col items-center">
                                <input
                                    type="number" min={0} max={59}
                                    value={inputM}
                                    onChange={e => setInputM(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    className="w-full text-center bg-white/10 border border-white/10 rounded-xl py-2 text-white font-mono text-xl font-bold focus:outline-none focus:border-white/30 transition-colors"
                                />
                                <span className="text-white/40 text-xs mt-1">dakika</span>
                            </div>
                            <span className="text-white/40 font-bold text-2xl mb-4">:</span>
                            <div className="flex-1 flex flex-col items-center">
                                <input
                                    type="number" min={0} max={59}
                                    value={inputS}
                                    onChange={e => setInputS(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                    className="w-full text-center bg-white/10 border border-white/10 rounded-xl py-2 text-white font-mono text-xl font-bold focus:outline-none focus:border-white/30 transition-colors"
                                />
                                <span className="text-white/40 text-xs mt-1">saniye</span>
                            </div>
                            <button
                                onClick={applyCustomTime}
                                className="mb-5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                                style={{ background: theme.hex, boxShadow: `0 2px 12px ${theme.hex}55` }}
                            >
                                Ayarla
                            </button>
                        </div>
                    </div>

                    {/* ── Timer Display ── */}
                    <div className="relative flex items-center justify-center mb-8"
                        style={{ minHeight: settings.displayMode === 'circle' ? `${ringSize}px` : '180px' }}>

                        {/* Circle display */}
                        {settings.displayMode === 'circle' && (
                            <>
                                <ProgressRing progress={progress} color={theme.hex} size={ringSize} />
                                <div className="relative z-10 flex flex-col items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                                    <div className="font-mono font-black text-white text-center" style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', textShadow: `0 0 30px ${theme.hex}` }}>
                                        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
                                        {settings.showMilliseconds && <span className="text-xl text-white/50">.{pad(millis)}</span>}
                                    </div>
                                    <div className="text-white/40 text-sm mt-2">{(progress * 100).toFixed(1)}% kaldı</div>
                                </div>
                            </>
                        )}

                        {/* Digital display */}
                        {settings.displayMode === 'digital' && (
                            <div className="w-full bg-black/40 border border-white/10 rounded-3xl p-8 flex items-center justify-center gap-3 sm:gap-6"
                                style={{ boxShadow: `0 0 60px ${theme.hex}22, inset 0 1px 0 rgba(255,255,255,0.05)` }}>
                                {hours > 0 && (
                                    <>
                                        <DigitBlock value={pad(hours)} label="saat" />
                                        <span className="text-white/30 font-black text-5xl sm:text-7xl mb-4">:</span>
                                    </>
                                )}
                                <DigitBlock value={pad(minutes)} label="dakika" />
                                <span className="text-white/30 font-black text-5xl sm:text-7xl mb-4" style={{ animation: isRunning ? 'blink 1s step-end infinite' : 'none' }}>:</span>
                                <DigitBlock value={pad(seconds)} label="saniye" />
                                {settings.showMilliseconds && (
                                    <>
                                        <span className="text-white/20 font-black text-3xl mb-4">.</span>
                                        <DigitBlock value={pad(millis)} label="ms" />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Minimal display */}
                        {settings.displayMode === 'minimal' && (
                            <div className="flex flex-col items-center">
                                <div className="font-mono font-black text-white" style={{ fontSize: 'clamp(4rem, 20vw, 8rem)', lineHeight: 1, textShadow: `0 0 60px ${theme.hex}` }}>
                                    {pad(minutes)}:{pad(seconds)}
                                </div>
                                {hours > 0 && <div className="text-white/40 text-lg mt-1">{pad(hours)} saat</div>}
                                {settings.showMilliseconds && <div className="text-white/30 text-2xl font-mono">.{pad(millis)}</div>}
                            </div>
                        )}
                    </div>

                    {/* Finished alert */}
                    {isFinished && (
                        <div className="mb-6 p-4 rounded-2xl text-center font-bold text-white text-lg animate-bounce"
                            style={{ background: `linear-gradient(135deg, ${theme.hex}99, ${theme.hex}44)`, border: `1px solid ${theme.hex}` }}>
                            ⏰ Süre Doldu!
                        </div>
                    )}

                    {/* ── Progress Bar ── */}
                    <div className="mb-8">
                        <div className="flex justify-between text-white/40 text-xs mb-2">
                            <span>0:00</span>
                            <span className={theme.text}>{(progress * 100).toFixed(1)}% kaldı</span>
                            <span>{pad(Math.floor(totalMs / 60000))}:{pad((totalMs % 60000) / 1000)}</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: barWidth,
                                    background: `linear-gradient(90deg, ${theme.hex}bb, ${theme.hex})`,
                                    boxShadow: `0 0 12px ${theme.hex}88`,
                                }}
                            />
                        </div>
                        {/* Tick marks */}
                        <div className="relative h-2 mt-1">
                            {[0.25, 0.5, 0.75].map(pct => (
                                <div key={pct} className="absolute w-px h-2 bg-white/20 top-0" style={{ left: `${pct * 100}%` }} />
                            ))}
                        </div>
                    </div>

                    {/* ── Controls ── */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={handleReset}
                            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                        >
                            <RotateCcw size={22} />
                        </button>

                        <button
                            onClick={handleStartPause}
                            disabled={isFinished}
                            className="flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95 disabled:opacity-40"
                            style={{
                                background: isRunning
                                    ? 'linear-gradient(135deg, #374151, #1f2937)'
                                    : `linear-gradient(135deg, ${theme.hex}, ${theme.hex}cc)`,
                                boxShadow: isRunning ? 'none' : `0 8px 32px ${theme.hex}55`,
                            }}
                        >
                            {isRunning ? <Pause size={24} /> : <Play size={24} />}
                            {isRunning ? 'Duraklat' : 'Başlat'}
                        </button>

                        <button
                            onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                            className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
                            title={settings.soundEnabled ? 'Sesi kapat' : 'Sesi aç'}
                        >
                            {settings.soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} className="text-gray-500" />}
                        </button>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.2; }
                }
            `}</style>
        </PageContainer>
    );
}
