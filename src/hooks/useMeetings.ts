import { useState, useEffect, useCallback } from 'react';
import { supabase, Meeting } from '../lib/supabase';

interface UseMeetingsReturn {
    meetings: Meeting[];
    loading: boolean;
    error: string | null;
    addMeeting: (meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => Promise<{ success: boolean; error?: string }>;
    deleteMeeting: (id: string) => Promise<{ success: boolean; error?: string }>;
    getUpcomingMeetings: () => Meeting[];
    getPastMeetings: () => Meeting[];
    refetch: () => Promise<void>;
}

export function useMeetings(): UseMeetingsReturn {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMeetings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('meetings')
                .select('*')
                .order('date', { ascending: true })
                .order('time', { ascending: true });

            if (fetchError) {
                throw fetchError;
            }

            setMeetings(data || []);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Toplantılar yüklenirken hata oluştu';
            setError(errorMessage);
            console.error('Fetch meetings error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeetings();
    }, [fetchMeetings]);

    const addMeeting = async (meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const { error: insertError } = await supabase
                .from('meetings')
                .insert([meeting]);

            if (insertError) {
                throw insertError;
            }

            await fetchMeetings();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Toplantı eklenirken hata oluştu';
            console.error('Add meeting error:', err);
            return { success: false, error: errorMessage };
        }
    };

    const deleteMeeting = async (id: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('meetings')
                .delete()
                .eq('id', id);

            if (deleteError) {
                throw deleteError;
            }

            await fetchMeetings();
            return { success: true };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Toplantı silinirken hata oluştu';
            console.error('Delete meeting error:', err);
            return { success: false, error: errorMessage };
        }
    };

    const getUpcomingMeetings = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return meetings.filter(meeting => {
            const meetingDate = new Date(meeting.date);
            meetingDate.setHours(0, 0, 0, 0);
            return meetingDate >= today;
        });
    }, [meetings]);

    const getPastMeetings = useCallback(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return meetings.filter(meeting => {
            const meetingDate = new Date(meeting.date);
            meetingDate.setHours(0, 0, 0, 0);
            return meetingDate < today;
        }).reverse(); // Most recent first
    }, [meetings]);

    return {
        meetings,
        loading,
        error,
        addMeeting,
        deleteMeeting,
        getUpcomingMeetings,
        getPastMeetings,
        refetch: fetchMeetings,
    };
}
