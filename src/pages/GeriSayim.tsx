import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageContainer } from '../components/PageContainer';
import { Play, Pause, RotateCcw, Settings, X, Volume2, VolumeX, Clock, Zap, Maximize2, Minimize2 } from 'lucide-react';

// ────────────────────────────────────────────────────────────
//  Types
// ────────────────────────────────────────────────────────────
interface TimerSettings {
    colorTheme: 'violet' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'indigo' | 'black';
    displayMode: 'digital' | 'minimal' | 'circle';
    soundEnabled: boolean;
    showSeconds: boolean;
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
    black: { bg: 'from-black via-zinc-950 to-black', ring: '#ffffff', text: 'text-zinc-400', btn: 'bg-zinc-800 hover:bg-zinc-700', glow: 'shadow-white/10', hex: '#ffffff' },
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
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={10} />
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
function DigitBlock({ value, label, opacity = 1 }: { value: string; label: string; opacity?: number }) {
    return (
        <div className="flex flex-col items-center" style={{ opacity }}>
            <div
                className="font-mono font-black text-white select-none transition-all duration-300"
                style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)', lineHeight: 1, letterSpacing: '0.04em', textShadow: '0 0 30px currentColor' }}
            >
                {value}
            </div>
            <div className="text-white/40 text-[10px] mt-1 uppercase tracking-widest">{label}</div>
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
        showSeconds: true,
    });
    const [showSettings, setShowSettings] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

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
    const containerRef = useRef<HTMLDivElement>(null);

    const theme = THEMES[settings.colorTheme];

    // ── Fullscreen Logic ──
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

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

    // ── Actions ──
    const applyCustomTime = () => {
        const ms = ((inputH * 3600) + (inputM * 60) + inputS) * 1000;
        if (ms <= 0) return;
        setTotalMs(ms);
        setRemainingMs(ms);
        setIsFinished(false);
        setActivePreset(-1); // Mark as manual setup

        // Auto-start requested
        setIsRunning(true);
        if (settings.soundEnabled) beep(getAudioCtx());
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

    const barWidth = `${(progress * 100).toFixed(2)}%`;
    const ringSize = isFullscreen ? 420 : 280;

    // Direct use of settings.showSeconds ensures it works reliably in all modes
    // The previous interpretation to "force" it for manual setup might have caused confusion
    const effectivelyShowSeconds = settings.showSeconds;

    // Minimal mode visibility condition: last minute
    const showDigitsInMinimal = settings.displayMode === 'minimal' ? remainingMs < 60000 : true;

    return (
        <PageContainer>
            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-white font-bold text-xl flex items-center gap-2">
                                <Settings size={20} className="text-violet-400" />
                                Ayarlar
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Display mode */}
                            <div>
                                <p className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest text-center">Kadran Modu</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['digital', 'minimal', 'circle'] as TimerSettings['displayMode'][]).map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setSettings(s => ({ ...s, displayMode: m }))}
                                            className="py-2.5 rounded-xl text-xs font-bold transition-all"
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

                            {/* Color theme */}
                            <div>
                                <p className="text-gray-400 text-xs font-bold mb-3 uppercase tracking-widest text-center">Renk Teması</p>
                                <div className="flex justify-center flex-wrap gap-3">
                                    {(Object.keys(THEMES) as TimerSettings['colorTheme'][]).map(k => (
                                        <button
                                            key={k}
                                            onClick={() => setSettings(s => ({ ...s, colorTheme: k }))}
                                            className={`w-10 h-10 rounded-full border-2 transition-all relative ${k === 'black' ? 'border-white/20' : ''}`}
                                            style={{
                                                backgroundColor: k === 'black' ? '#0a0a0a' : THEMES[k].hex,
                                                borderColor: settings.colorTheme === k ? 'white' : (k === 'black' ? 'rgba(255,255,255,0.2)' : 'transparent'),
                                                transform: settings.colorTheme === k ? 'scale(1.1)' : 'scale(1)',
                                            }}
                                            title={k}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                {/* Toggle Seconds */}
                                <button
                                    onClick={() => setSettings(s => ({ ...s, showSeconds: !s.showSeconds }))}
                                    className="flex items-center justify-between w-full py-3 px-4 rounded-2xl bg-white/5 border border-white/5"
                                >
                                    <span className="text-white text-sm font-medium">Saniye Göster</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.showSeconds ? 'bg-green-500' : 'bg-gray-700'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.showSeconds ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </button>

                                {/* Sound Toggle */}
                                <button
                                    onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                                    className="flex items-center justify-between w-full py-3 px-4 rounded-2xl bg-white/5 border border-white/5"
                                >
                                    <span className="text-white text-sm font-medium">Ses Efektleri</span>
                                    <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.soundEnabled ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.soundEnabled ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div ref={containerRef} className={`min-h-screen bg-gradient-to-br transition-all duration-700 ${theme.bg} ${isFullscreen ? 'p-0 flex items-center justify-center overflow-hidden' : '-mx-4 sm:-mx-6 lg:-mx-8 -my-8 px-4 pb-16 pt-12'}`} style={{ marginTop: isFullscreen ? '0' : '-2rem' }}>
                <div className={`${isFullscreen ? 'w-full max-w-4xl p-12' : 'max-w-2xl mx-auto flex flex-col gap-12'}`}>

                    {/* ──── [1] TIMER DISPLAY (ALWAYS TOP) ──── */}
                    <div className="relative flex items-center justify-center"
                        style={{ minHeight: settings.displayMode === 'circle' ? `${ringSize}px` : isFullscreen ? '300px' : '220px' }}>

                        {/* Circle mode */}
                        {settings.displayMode === 'circle' && (
                            <>
                                <ProgressRing progress={progress} color={theme.hex} size={ringSize} />
                                <div className="relative z-10 flex flex-col items-center justify-center" style={{ width: ringSize, height: ringSize }}>
                                    <div className="font-mono font-black text-white text-center" style={{ fontSize: `clamp(2rem, ${isFullscreen ? '12vw' : '8vw'}, ${isFullscreen ? '6rem' : '3.5rem'})`, textShadow: `0 0 30px ${theme.hex}` }}>
                                        {hours > 0 && <span>{pad(hours)}:</span>}{pad(minutes)}{effectivelyShowSeconds && <span className="opacity-50">:{pad(seconds)}</span>}
                                    </div>
                                    <div className="text-white/30 text-[10px] uppercase font-bold tracking-[0.3em] mt-3">
                                        {(progress * 100).toFixed(1)}% KALDI
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Digital mode */}
                        {settings.displayMode === 'digital' && (
                            <div className={`w-full bg-black/40 border border-white/10 rounded-[3rem] flex items-center justify-center gap-3 sm:gap-6 ${isFullscreen ? 'p-20' : 'p-10'}`}
                                style={{ boxShadow: `0 0 60px ${theme.hex}22, inset 0 1px 0 rgba(255,255,255,0.05)` }}>
                                {hours > 0 && (
                                    <>
                                        <DigitBlock value={pad(hours)} label="saat" />
                                        <span className={`text-white/25 font-black mb-4 ${isFullscreen ? 'text-8xl' : 'text-6xl'}`}>:</span>
                                    </>
                                )}
                                <DigitBlock value={pad(minutes)} label="dakika" />
                                {effectivelyShowSeconds && (
                                    <>
                                        <span className={`text-white/20 font-black mb-4 ${isFullscreen ? 'text-8xl' : 'text-6xl'}`} style={{ animation: isRunning ? 'blink 1.5s infinite steps(2)' : 'none' }}>:</span>
                                        <DigitBlock value={pad(seconds)} label="saniye" opacity={0.4} />
                                    </>
                                )}
                            </div>
                        )}

                        {/* Minimal mode */}
                        {settings.displayMode === 'minimal' && (
                            <div className="flex flex-col items-center text-center">
                                <div className={`font-mono font-black text-white transition-opacity duration-1000 ${showDigitsInMinimal ? 'opacity-100' : 'opacity-0'}`}
                                    style={{ fontSize: `clamp(4rem, ${isFullscreen ? '25vw' : '20vw'}, ${isFullscreen ? '14rem' : '8rem'})`, lineHeight: 1, textShadow: `0 0 60px ${theme.hex}` }}>
                                    {hours > 0 && <span>{pad(hours)}:</span>}{pad(minutes)}{effectivelyShowSeconds && <span className="opacity-50">:{pad(seconds)}</span>}
                                </div>
                                {!showDigitsInMinimal && (
                                    <div className="flex flex-col items-center gap-6 opacity-30">
                                        <div className="w-20 h-20 rounded-full border-[6px] border-white/10 border-t-white" />
                                        <div className="text-white font-bold tracking-[0.5em] text-sm">FOCUS</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full">
                        <div className="h-[6px] bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: barWidth,
                                    background: `linear-gradient(90deg, ${theme.hex}99, ${theme.hex})`,
                                    boxShadow: `0 0 20px ${theme.hex}44`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Finished Alert */}
                    {isFinished && (
                        <div className="p-8 rounded-[2.5rem] text-center font-black text-white text-3xl animate-bounce shadow-2xl"
                            style={{ background: `linear-gradient(135deg, ${theme.hex}, ${theme.hex}88)`, border: `1px solid ${theme.hex}` }}>
                            ⏰ SÜRE DOLDU
                        </div>
                    )}

                    {/* ──── [2] MAIN CONTROLS ──── */}
                    <div className="flex items-center justify-center gap-8">
                        <button
                            onClick={handleReset}
                            className={`rounded-full bg-white/5 hover:bg-white/15 text-white/60 transition-all active:scale-90 ${isFullscreen ? 'p-8' : 'p-5'}`}
                        >
                            <RotateCcw size={isFullscreen ? 36 : 24} />
                        </button>

                        <button
                            onClick={handleStartPause}
                            disabled={isFinished}
                            className={`flex items-center gap-4 rounded-[2rem] text-white font-black transition-all active:scale-95 disabled:opacity-30 ${isFullscreen ? 'px-20 py-10 text-4xl' : 'px-14 py-6 text-2xl'}`}
                            style={{
                                background: isRunning
                                    ? 'linear-gradient(135deg, #374151, #111827)'
                                    : `linear-gradient(135deg, ${theme.hex}, ${theme.hex}aa)`,
                                boxShadow: isRunning ? 'none' : `0 15px 45px ${theme.hex}55`,
                            }}
                        >
                            {isRunning ? <Pause size={isFullscreen ? 44 : 28} /> : <Play size={isFullscreen ? 44 : 28} className="fill-current" />}
                            {isRunning ? 'DURAKLAT' : (remainingMs < totalMs ? 'DEVAM' : 'BAŞLAT')}
                        </button>

                        <button
                            onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
                            className={`rounded-full bg-white/5 hover:bg-white/15 text-white/60 transition-all active:scale-90 ${isFullscreen ? 'p-8' : 'p-5'}`}
                        >
                            {settings.soundEnabled ? <Volume2 size={isFullscreen ? 36 : 24} /> : <VolumeX size={isFullscreen ? 36 : 24} />}
                        </button>
                    </div>

                    {/* ──── [3] SETUP AREA ──── */}
                    {!isFullscreen && (
                        <div className="mt-8 space-y-12">
                            {/* Manuel Input Area */}
                            <div className="bg-black/20 border border-white/5 rounded-[3rem] p-10">
                                <p className="text-white/20 text-[10px] uppercase font-bold tracking-[0.4em] mb-8 text-center flex items-center justify-center gap-3">
                                    <Zap size={14} className="text-amber-500/50" /> MANUEL KURULUM
                                </p>
                                <div className="flex items-end justify-center gap-4 max-w-sm mx-auto">
                                    <div className="flex-1">
                                        <input
                                            type="number" min={0} max={23} value={inputH}
                                            onChange={e => setInputH(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                                            className="w-full text-center bg-white/5 border border-white/10 rounded-3xl py-4 text-white font-mono text-3xl font-black focus:outline-none focus:border-white/20 transition-all"
                                        />
                                        <span className="block text-center text-white/20 text-[9px] mt-3 uppercase tracking-[0.2em] font-bold">Saat</span>
                                    </div>
                                    <span className="text-white/10 font-black text-4xl mb-12">:</span>
                                    <div className="flex-1">
                                        <input
                                            type="number" min={0} max={59} value={inputM}
                                            onChange={e => setInputM(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                            className="w-full text-center bg-white/5 border border-white/10 rounded-3xl py-4 text-white font-mono text-3xl font-black focus:outline-none focus:border-white/20 transition-all"
                                        />
                                        <span className="block text-center text-white/20 text-[9px] mt-3 uppercase tracking-[0.2em] font-bold">Dakika</span>
                                    </div>
                                    <span className="text-white/10 font-black text-4xl mb-12">:</span>
                                    <div className="flex-1">
                                        <input
                                            type="number" min={0} max={59} value={inputS}
                                            onChange={e => setInputS(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                            className="w-full text-center bg-white/5 border border-white/10 rounded-3xl py-4 text-white font-mono text-3xl font-black focus:outline-none focus:border-white/20 transition-all"
                                        />
                                        <span className="block text-center text-white/20 text-[9px] mt-3 uppercase tracking-[0.2em] font-bold">Saniye</span>
                                    </div>
                                    <button
                                        onClick={applyCustomTime}
                                        className="mb-10 px-8 py-5 rounded-3xl text-white text-sm font-black transition-all hover:scale-110 active:scale-95 shadow-xl"
                                        style={{ background: theme.hex, boxShadow: `0 10px 30px ${theme.hex}44` }}
                                    >
                                        KUR
                                    </button>
                                </div>
                            </div>

                            {/* Presets Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {PRESETS.map((p, i) => (
                                    <button
                                        key={p.label}
                                        onClick={() => applyPreset(i)}
                                        className="flex flex-col items-center gap-3 py-6 px-4 rounded-[2rem] transition-all duration-500 border hover:bg-white/5 group"
                                        style={{
                                            background: activePreset === i ? p.color + 'bb' : 'rgba(255,255,255,0.03)',
                                            borderColor: activePreset === i ? p.color : 'rgba(255,255,255,0.05)',
                                            boxShadow: activePreset === i ? `0 10px 25px ${p.color}33` : 'none',
                                        }}
                                    >
                                        <span className="text-3xl transition-transform group-hover:scale-125">{p.icon}</span>
                                        <div className="text-center">
                                            <div className="text-white font-black text-sm tracking-tight">{p.label}</div>
                                            <div className="text-white/30 text-[10px] font-bold mt-1">{p.minutes} DK</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ──── [4] FOOTER (HEADER/SETTINGS MOVED HERE) ──── */}
                    {!isFullscreen && (
                        <div className="border-t border-white/5 pt-16 pb-8 flex flex-col items-center gap-8 opacity-40 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Clock size={18} className="text-white/60" />
                                </div>
                                <div>
                                    <h1 className="text-white font-black text-xl tracking-tight leading-none">Geri Sayım</h1>
                                    <p className="text-white/40 text-[10px] uppercase tracking-widest mt-1">Sınav ve Ders Sayacı</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={toggleFullscreen}
                                    className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/15 text-white flex items-center gap-2 text-xs font-bold transition-all"
                                >
                                    <Maximize2 size={16} /> TAM EKRAN
                                </button>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 text-xs font-bold transition-all"
                                >
                                    <Settings size={16} /> AYARLAR
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Global Styles */}
            <style>{`
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.1; }
                }
                ::-webkit-scrollbar { display: none; }
                * { -ms-overflow-style: none; scrollbar-width: none; }
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; margin: 0; 
                }
            `}</style>
        </PageContainer>
    );
}
