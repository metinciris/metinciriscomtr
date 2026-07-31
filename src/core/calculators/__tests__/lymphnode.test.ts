import { describe, it, expect } from 'vitest';
import { calculateLymphNodeCounts, createLogEntry, type LogEntry } from '../lymphnode';

describe('calculateLymphNodeCounts', () => {
  it('boş log listesi → tüm sayımlar 0', () => {
    const counts = calculateLymphNodeCounts([]);
    expect(counts).toEqual({
      Reaktif: 0,
      Metastatik: 0,
      Deposit: 0,
      Total: 0,
    });
  });

  it('karışık log tipleri doğru sayılır', () => {
    const logs: LogEntry[] = [
      { id: 1, type: 'Reaktif', timestamp: new Date() },
      { id: 2, type: 'Metastatik', timestamp: new Date() },
      { id: 3, type: 'Reaktif', timestamp: new Date() },
      { id: 4, type: 'Deposit', timestamp: new Date() },
      { id: 5, type: 'Metastatik', timestamp: new Date() },
    ];
    const counts = calculateLymphNodeCounts(logs);
    expect(counts.Reaktif).toBe(2);
    expect(counts.Metastatik).toBe(2);
    expect(counts.Deposit).toBe(1);
    expect(counts.Total).toBe(5);
  });
});

describe('createLogEntry', () => {
  it('doğru id, tip ve zaman damgası nesnesi üretir', () => {
    const entry = createLogEntry('Metastatik');
    expect(entry.type).toBe('Metastatik');
    expect(typeof entry.id).toBe('number');
    expect(entry.timestamp).toBeInstanceOf(Date);
  });
});
