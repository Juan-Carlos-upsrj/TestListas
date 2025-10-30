import React, { useState, useMemo, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { CalendarEvent } from '../types';
import { getClassDates } from '../services/dateUtils';
import { fetchGoogleCalendarEvents } from '../services/calendarService';
import Icon from './icons/Icon';
import EventModal from './EventModal';

const CalendarView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, settings, calendarEvents } = state;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isEventModalOpen, setEventModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [gcalEvents, setGcalEvents] = useState<CalendarEvent[]>([]);
    const [isLoadingGcal, setIsLoadingGcal] = useState(false);
    const [errorGcal, setErrorGcal] = useState<string | null>(null);

    // Fetch Google Calendar events
    useEffect(() => {
        const fetchEvents = async () => {
            if (settings.googleCalendarUrl) {
                setIsLoadingGcal(true);
                setErrorGcal(null);
                try {
                    const events = await fetchGoogleCalendarEvents(settings.googleCalendarUrl);
                    setGcalEvents(events);
                    if (events.length > 0) {
                        dispatch({ type: 'ADD_TOAST', payload: { message: 'Calendario de Google sincronizado.', type: 'info' } });
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error al sincronizar Google Calendar.';
                    setErrorGcal(errorMessage);
                    dispatch({ type: 'ADD_TOAST', payload: { message: errorMessage, type: 'error' } });
                } finally {
                    setIsLoadingGcal(false);
                }
            } else {
                setGcalEvents([]);
                setErrorGcal(null);
            }
        };
        fetchEvents();
    }, [settings.googleCalendarUrl, dispatch]);

    const allEventsByDate = useMemo(() => {
        const events: { [date: string]: CalendarEvent[] } = {};

        const addEvent = (event: CalendarEvent) => {
            if (!events[event.date]) {
                events[event.date] = [];
            }
            // Avoid duplicates from gcal
            if (events[event.date].some(e => e.id === event.id)) return;
            events[event.date].push(event);
        };
        
        // Add class days from groups
        groups.forEach(group => {
            const classDates = getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
            classDates.forEach(date => {
                addEvent({
                    id: `class-${group.id}-${date}`,
                    date,
                    title: `Clase: ${group.name}`,
                    type: 'class',
                    color: 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                });
            });
        });

        // Add saved calendar events
        calendarEvents.forEach(event => addEvent(event));
        
        // Add Google Calendar events
        gcalEvents.forEach(event => addEvent(event));

        // Sort events within each day
        Object.values(events).forEach(dayEvents => {
            dayEvents.sort((a, b) => a.title.localeCompare(b.title));
        });

        return events;
    }, [groups, settings.semesterStart, settings.semesterEnd, calendarEvents, gcalEvents]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);
        setEventModalOpen(true);
    };

    const renderCalendarGrid = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const startDayOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const cells = [];
        for (let i = 0; i < startDayOffset; i++) {
            cells.push(<div key={`blank-${i}`} className="border-r border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"></div>);
        }

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayEvents = allEventsByDate[dateStr] || [];
            const isToday = dateStr === todayStr;

            cells.push(
                <div 
                    key={day} 
                    className="relative border-r border-b dark:border-slate-700 p-2 min-h-[120px] flex flex-col cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/50"
                    onClick={() => handleDateClick(day)}
                >
                    <span className={`text-sm font-semibold ${isToday ? 'bg-indigo-500 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day}
                    </span>
                    <div className="mt-1 space-y-1 overflow-y-auto flex-grow">
                        {dayEvents.slice(0, 3).map(event => (
                            <div key={event.id} className={`text-xs px-1.5 py-0.5 rounded-md ${event.color} truncate`}>
                                {event.title}
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-xs text-slate-500 font-semibold mt-1">
                                +{dayEvents.length - 3} más
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return cells;
    };
    
    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Calendario Académico</h1>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icon name="arrow-left" /></button>
                    <h2 className="text-xl font-semibold w-48 text-center">{currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Icon name="arrow-right" /></button>
                </div>
            </div>
            
            {(isLoadingGcal || errorGcal) && (
                 <div className={`text-center p-3 mb-4 rounded-md text-sm ${errorGcal ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-200' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200'}`}>
                    {isLoadingGcal ? 'Sincronizando con Google Calendar...' : errorGcal}
                 </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <div className="grid grid-cols-7">
                    {weekDays.map(day => (
                        <div key={day} className="p-3 text-center font-bold border-b-2 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50">{day}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 border-l dark:border-slate-700">
                    {renderCalendarGrid()}
                </div>
            </div>
            
            {selectedDate && (
                <EventModal 
                    isOpen={isEventModalOpen} 
                    onClose={() => setEventModalOpen(false)} 
                    date={selectedDate}
                    events={allEventsByDate[selectedDate.toISOString().split('T')[0]] || []}
                />
            )}
        </div>
    );
};

export default CalendarView;
