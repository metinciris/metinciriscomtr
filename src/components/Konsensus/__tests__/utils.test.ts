import { describe, expect, it } from 'vitest';
import { getEffectiveZoomLink, getMeetingPlatformName, buildGoogleCalendarUrl, buildIcs } from '../utils';
import { Meeting } from '../types';

describe('getEffectiveZoomLink', () => {
    it('returns zoom_link when zoom_link is specified', () => {
        const meeting: Meeting = {
            id: '1',
            title: 'Test Meeting',
            date: '2026-09-01',
            time: '20:00',
            zoom_link: 'https://us02web.zoom.us/j/999888777?pwd=123',
            zoom_id: '999888777',
        };
        expect(getEffectiveZoomLink(meeting)).toBe('https://us02web.zoom.us/j/999888777?pwd=123');
    });

    it('generates https://zoom.us/j/TOPLANTI_ID when zoom_link is missing but zoom_id exists', () => {
        const meeting: Meeting = {
            id: '2',
            title: 'Test Meeting',
            date: '2026-09-01',
            time: '20:00',
            zoom_link: '',
            zoom_id: '81234567890',
        };
        expect(getEffectiveZoomLink(meeting)).toBe('https://zoom.us/j/81234567890');
    });

    it('strips spaces from zoom_id when generating link', () => {
        const meeting: Meeting = {
            id: '3',
            title: 'Test Meeting',
            date: '2026-09-01',
            time: '20:00',
            zoom_link: null,
            zoom_id: '812 3456 7890',
        };
        expect(getEffectiveZoomLink(meeting)).toBe('https://zoom.us/j/81234567890');
    });

    it('returns null when both zoom_link and zoom_id are empty or null', () => {
        const meeting: Meeting = {
            id: '4',
            title: 'Test Meeting',
            date: '2026-09-01',
            time: '20:00',
            zoom_link: '',
            zoom_id: null,
        };
        expect(getEffectiveZoomLink(meeting)).toBeNull();
    });
});

describe('Meeting link platform detection', () => {
    it('detects Teams meeting links (including URL parameters)', () => {
        expect(getMeetingPlatformName('https://teams.microsoft.com/meet/1234567890?p=exampleCode')).toBe('Teams');
        expect(getMeetingPlatformName('https://teams.microsoft.com/l/meetup-join/123')).toBe('Teams');
        expect(getMeetingPlatformName('https://teams.live.com/meet/123')).toBe('Teams');
        expect(getMeetingPlatformName('https://teams.cloud.microsoft/meet/123')).toBe('Teams');
    });

    it('keeps Zoom and old meeting ID links labeled as Zoom', () => {
        expect(getMeetingPlatformName('https://us02web.zoom.us/j/123')).toBe('Zoom');
        expect(getMeetingPlatformName(null)).toBe('Zoom');
        expect(getMeetingPlatformName('not-a-url')).toBe('Zoom');
    });

    it('does not mistake a lookalike domain for Microsoft Teams', () => {
        expect(getMeetingPlatformName('https://teams.microsoft.com.example.org/meet/123')).toBe('Zoom');
    });
});

describe('Teams calendar export', () => {
    const teamsLink = 'https://teams.microsoft.com/meet/1234567890?p=exampleCode';
    const teamsMeeting: Meeting = {
        id: 'teams-test',
        title: 'Teams Patoloji Toplantısı',
        date: '2026-09-01',
        time: '20:00',
        zoom_link: teamsLink,
    };
    const visibleAt = new Date(Date.UTC(2026, 8, 1, 16, 30, 0));
    const hiddenAt = new Date(Date.UTC(2026, 8, 1, 10, 0, 0));

    it('preserves the exact Teams link and labels it correctly in Google Calendar', () => {
        expect(getEffectiveZoomLink(teamsMeeting)).toBe(teamsLink);
        const details = new URL(buildGoogleCalendarUrl(teamsMeeting, visibleAt)).searchParams.get('details');
        expect(details).toContain(`Teams: ${teamsLink}`);
        expect(details).not.toContain('Zoom:');
    });

    it('exports Teams URL and label to ICS', () => {
        const ics = buildIcs(teamsMeeting, visibleAt);
        expect(ics).toContain(`LOCATION:${teamsLink}`);
        expect(ics).toContain(`Teams: ${teamsLink}`);
        expect(ics).not.toContain('Zoom:');
    });

    it('does not reveal a Teams link before the scheduled visibility window', () => {
        expect(buildGoogleCalendarUrl(teamsMeeting, hiddenAt)).not.toContain(encodeURIComponent(teamsLink));
        expect(buildIcs(teamsMeeting, hiddenAt)).not.toContain(teamsLink);
    });
});

describe('Calendar export functions with effective zoom link', () => {
    const meetingWithIdOnly: Meeting = {
        id: '10',
        title: 'Konsensus Toplantısı',
        date: '2026-09-01',
        time: '20:00',
        zoom_link: '',
        zoom_id: '123456789',
    };
    // Mock date to be within 2 hours of meeting start so zoom info is visible
    const mockNow = new Date(Date.UTC(2026, 8, 1, 16, 30, 0)); // 19:30 TSİ

    it('buildGoogleCalendarUrl includes generated zoom link', () => {
        const url = buildGoogleCalendarUrl(meetingWithIdOnly, mockNow);
        expect(url).toContain(encodeURIComponent('https://zoom.us/j/123456789'));
    });

    it('buildIcs includes generated zoom link and LOCATION header', () => {
        const ics = buildIcs(meetingWithIdOnly, mockNow);
        expect(ics).toContain('LOCATION:https://zoom.us/j/123456789');
        expect(ics).toContain('https://zoom.us/j/123456789');
    });
});
