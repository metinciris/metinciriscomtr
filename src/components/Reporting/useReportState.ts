// src/components/Reporting/useReportState.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface StoredDraft {
  timestamp: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: Record<string, any>;
}

const DRAFT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useReportState(schemaId: string) {
  const storageKey = `draft:${schemaId}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [values, setValues] = useState<Record<string, any>>({});
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(false);
  const [draftLoaded, setDraftLoaded] = useState<boolean>(false);

  // Check for saved draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: StoredDraft = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < DRAFT_EXPIRY_MS) {
          if (Object.keys(parsed.values || {}).length > 0) {
            setHasSavedDraft(true);
          }
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, [storageKey]);

  // Save values with 2-second debounce
  const valuesRef = useRef(values);

  useEffect(() => {
    valuesRef.current = values;
    const timer = setTimeout(() => {
      if (Object.keys(valuesRef.current).length > 0) {
        try {
          const payload: StoredDraft = {
            timestamp: Date.now(),
            values: valuesRef.current,
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
        } catch {
          // Ignore write errors
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [values, storageKey]);

  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: StoredDraft = JSON.parse(raw);
        setValues(parsed.values || {});
        setDraftLoaded(true);
        setHasSavedDraft(false);
      }
    } catch {
      // Ignore read errors
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setValues({});
      setHasSavedDraft(false);
      setDraftLoaded(false);
    } catch {
      // Ignore remove errors
    }
  }, [storageKey]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateValue = useCallback((fieldId: string, val: any) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: val,
    }));
  }, []);

  return {
    values,
    updateValue,
    hasSavedDraft,
    draftLoaded,
    loadDraft,
    clearDraft,
    setValues,
  };
}
