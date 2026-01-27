import { createClient } from '@supabase/supabase-js';

// Supabase configuration for Konsensus app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}
