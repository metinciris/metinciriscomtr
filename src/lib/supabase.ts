import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration for Konsensus app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let _supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabaseClient;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient = new Proxy({} as any, {
  get(_target, prop, receiver) {
    const client = getSupabase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = Reflect.get(client as any, prop, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

// Meeting type definition
export interface Meeting {
    id: string;
    title: string;
    organizer: string;
    date: string;
    time: string;
    duration: number;
    description: string;
    zoom_link?: string;
    zoom_id?: string;
    zoom_password?: string;
    poster_url?: string;
    created_at?: string;
    updated_at?: string;
}

// Meeting form data type
export interface MeetingFormData {
    title: string;
    organizer: string;
    customOrganizer: string;
    date: string;
    time: string;
    duration: number;
    description: string;
    zoomLink: string;
    zoomId: string;
    zoomPassword: string;
    posterUrl: string;
}
