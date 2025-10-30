import iCal from 'ical.js';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent } from '../types';

// Helper to parse ICS data into our CalendarEvent format
const parseIcsData = (icsData: string): CalendarEvent[] => {
    try {
        const jcalData = iCal.parse(icsData);
        const comp = new iCal.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const events: CalendarEvent[] = [];
        vevents.forEach((vevent: any) => {
            const event = new iCal.Event(vevent);
            const startDate = event.startDate.toJSDate();
            
            // This basic implementation handles single and all-day events.
            // A more complex implementation would be needed for recurring events (RRULE).
            events.push({
                id: `gcal-${event.uid || uuidv4()}`,
                date: startDate.toISOString().split('T')[0],
                title: event.summary,
                type: 'gcal', // Distinguish Google Calendar events
                color: 'bg-orange-200',
            });
        });
        return events;
    } catch (parseError) {
        console.error('Error parsing ICS data:', parseError);
        return [];
    }
};

export const fetchGoogleCalendarEvents = async (url: string): Promise<CalendarEvent[]> => {
    if (!url || !url.startsWith('http')) return [];
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const icsData = await response.text();
        return parseIcsData(icsData);
    } catch (error) {
        console.error('Error fetching or parsing iCal data:', error);
        // Return empty array on failure so the app doesn't crash
        return [];
    }
};