import React, { useEffect, useState } from 'react';

interface StarExplosionProps {
    active: boolean;
    onComplete?: () => void;
}

export function StarExplosion({ active, onComplete }: StarExplosionProps) {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; size: number }[]>([]);

    useEffect(() => {
        if (active) {
            const newParticles = Array.from({ length: 20 }).map((_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 100, // -50 to 50
                y: (Math.random() - 0.5) * 100, // -50 to 50
                color: ['#FFD700', '#FFA500', '#FF4500', '#FFFF00'][Math.floor(Math.random() * 4)],
                size: Math.random() * 8 + 4,
            }));
            setParticles(newParticles);

            const timer = setTimeout(() => {
                setParticles([]);
                if (onComplete) onComplete();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [active, onComplete]);

    if (!active || particles.length === 0) return null;

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 overflow-visible z-50">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full opacity-0 animate-explosion"
                    style={{
                        backgroundColor: p.color,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        '--tx': `${p.x}px`,
                        '--ty': `${p.y}px`,
                    } as React.CSSProperties}
                />
            ))}
            <style>{`
        @keyframes explosion {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
          }
        }
        .animate-explosion {
          animation: explosion 0.8s ease-out forwards;
        }
      `}</style>
        </div>
    );
}
