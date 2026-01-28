import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const config = {
        success: {
            icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
            bg: 'bg-green-50',
            border: 'border-green-100',
            text: 'text-green-800',
        },
        error: {
            icon: <AlertCircle className="w-5 h-5 text-red-500" />,
            bg: 'bg-red-50',
            border: 'border-red-100',
            text: 'text-red-800',
        },
        info: {
            icon: <Info className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-800',
        },
    };

    const { icon, bg, border, text } = config[type];

    return (
        <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${bg} ${border} animate-in slide-in-from-right duration-300`}>
            {icon}
            <p className={`text-sm font-black ${text}`}>{message}</p>
            <button onClick={onClose} className="ml-2 p-1 hover:bg-black/5 rounded-full transition">
                <X className="w-4 h-4 opacity-50" />
            </button>
        </div>
    );
}
