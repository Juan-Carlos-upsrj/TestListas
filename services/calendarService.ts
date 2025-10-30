import iCal from 'ical.js';
import { v4 as uuidv4 } from 'uuid';
import { CalendarEvent } from '../types';

// Helper to parse ICS data into our CalendarEvent format, now with support for recurring events.
const parseIcsData = (icsData: string): CalendarEvent[] => {
    try {
        const jcalData = iCal.parse(icsData);
        const comp = new iCal.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');
        const events: CalendarEvent[] = [];

        // Define a time window to expand recurring events.
        // iCal.Duration does not support 'months', so we use 'weeks' (26 weeks ~ 6 months).
        const now = iCal.Time.now();
        const start = now.clone().subtract(new iCal.Duration({ weeks: 26 }));
        const end = now.clone().add(new iCal.Duration({ weeks: 26 }));

        vevents.forEach((vevent: any) => {
            const event = new iCal.Event(vevent);

            if (event.isRecurring()) {
                const iterator = event.iterator();
                let next;
                let i = 0;
                const MAX_OCCURRENCES = 1000; // Safety break

                while ((next = iterator.next()) && next.compare(end) <= 0 && i < MAX_OCCURRENCES) {
                    if (next.compare(start) >= 0) {
                        const occurrence = event.getOccurrenceDetails(next);
                        const occurrenceStartDate = occurrence.startDate.toJSDate();
                        events.push({
                            id: `gcal-${event.uid}-${occurrence.startDate.toString()}`,
                            date: occurrenceStartDate.toISOString().split('T')[0],
                            title: event.summary,
                            type: 'gcal',
                            color: 'bg-orange-200',
                        });
                    }
                    i++;
                }
            } else {
                // Handle non-recurring events
                const startDate = event.startDate.toJSDate();
                if (startDate >= start.toJSDate() && startDate <= end.toJSDate()) {
                    events.push({
                        id: `gcal-${event.uid || uuidv4()}`,
                        date: startDate.toISOString().split('T')[0],
                        title: event.summary,
                        type: 'gcal',
                        color: 'bg-orange-200',
                    });
                }
            }
        });
        return events;
    } catch (parseError) {
        console.error('Error parsing ICS data:', parseError);
        // Propagate the error to be handled by the caller
        throw new Error('Failed to parse calendar data.');
    }
};


export const fetchGoogleCalendarEvents = async (url: string): Promise<CalendarEvent[]> => {
    if (!url || !url.startsWith('http')) return [];
    
    // Use a CORS proxy to bypass browser security restrictions when fetching the iCal file.
    const proxyUrl = 'https://corsproxy.io/?';
    const fetchUrl = `${proxyUrl}${encodeURIComponent(url)}`;

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const icsData = await response.text();
        return parseIcsData(icsData);
    } catch (error) {
        console.error('Error fetching or parsing iCal data:', error);
        // Throw an error so the UI can catch it and notify the user
        throw new Error('Could not fetch calendar data. Please check the URL and its permissions.');
    }
};