export type LogType = 'Reaktif' | 'Metastatik' | 'Deposit';

export interface LogEntry {
    id: number;
    type: LogType;
    timestamp: Date;
}

export interface LymphNodeCounts {
    Reaktif: number;
    Metastatik: number;
    Deposit: number;
    Total: number;
}

export function calculateLymphNodeCounts(logs: LogEntry[]): LymphNodeCounts {
    return {
        Reaktif: logs.filter(l => l.type === 'Reaktif').length,
        Metastatik: logs.filter(l => l.type === 'Metastatik').length,
        Deposit: logs.filter(l => l.type === 'Deposit').length,
        Total: logs.length
    };
}

export function createLogEntry(type: LogType): LogEntry {
    return {
        id: Date.now(),
        type,
        timestamp: new Date()
    };
}
