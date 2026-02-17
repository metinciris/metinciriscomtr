import { useEffect, useState } from 'react';

/**
 * Verilen metin dizisini belirli aralıklarla döndüren hook.
 * Ana sayfadaki karo alt yazıları için kullanılır.
 */
export function useRotatingText(texts: string[], intervalMs: number): string {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!texts || texts.length <= 1) return;

        const id = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % texts.length);
        }, intervalMs);

        return () => window.clearInterval(id);
    }, [texts, intervalMs]);

    return texts[index] ?? '';
}
