import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { CalendarEvent } from '../types';
import { getClassDates } from '../services/dateUtils';
import Icon from './icons/Icon';
import EventModal from './EventModal';

const CalendarView: React.FC = () => {
    const { state } = useContext(AppContext);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const groupColors = useMemo(() => {
        const colors = ['bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200', 'bg-indigo-200'];
        const mapping: { [groupId: string]: string } = {};
        state.groups.forEach((group, index) => {
            mapping[group.id] = colors[index % colors.length];
        });
        return mapping;
    }, [state.groups]);

    const allEvents = useMemo(() => {
        const events: CalendarEvent[] = [];
        const { semesterStart, semesterEnd, firstPartialEnd } = state.settings;

        // 1. Class Day Events
        state.groups.forEach(group => {
            const classDates = getClassDates(semesterStart, semesterEnd, group.classDays);
            classDates.forEach(date => {
                events.push({
                    id: `class-${group.id}-${date}`,
                    date,
                    title: `${group.name} - Clase`,
                    type: 'class',
                    color: groupColors[group.id],
                    groupId: group.id
                });
            });
        });
        
        // 2. Evaluation Events
        Object.entries(state.evaluations).forEach(([groupId, evals]) => {
            const group = state.groups.find(g => g.id === groupId);
            if (group) {
                 // Assuming evaluations don't have a date, let's distribute them somewhat arbitrarily for demo
                 // A real app would need a date field on the evaluation object.
                 // For now, let's just add them to the start of the semester.
                 evals.forEach(ev => {
                     events.push({
                        id: `eval-${ev.id}`,
                        date: semesterStart,
                        title: `Evaluación: ${ev.name} (${group.name})`,
                        type: 'evaluation',
                        color: 'bg-red-200',
                        groupId
                     });
                 });
            }
        });

        // 3. Deadline Events
        if(firstPartialEnd) events.push({ id: 'deadline-p1', date: firstPartialEnd, title: 'Fin del Primer Parcial', type: 'deadline', color: 'bg-red-300' });
        if(semesterEnd) events.push({ id: 'deadline-end', date: semesterEnd, title: 'Fin del Semestre', type: 'deadline', color: 'bg-red-300' });

        // 4. Custom Events
        events.push(...state.calendarEvents);

        // Group events by date
        const eventsByDate: { [date: string]: CalendarEvent[] } = {};
        events.forEach(event => {
            if (!eventsByDate[event.date]) {
                eventsByDate[event.date] = [];
            }
            eventsByDate[event.date].push(event);
        });

        return eventsByDate;
    }, [state.groups, state.evaluations, state.settings, state.calendarEvents, groupColors]);


    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };
    
    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setIsModalOpen(true);
    };

    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - monthStart.getDay());
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay()));

    const days = [];
    let day = new Date(startDate);

    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Calendario</h1>
                <div className="flex items-center gap-4">
                    <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">&lt;</button>
                    <h2 className="text-xl font-bold text-center w-48">
                        {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                    </h2>
                    <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">&gt;</button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                <div className="grid grid-cols-7 gap-px text-center font-semibold text-sm text-slate-600 dark:text-slate-400 border-b dark:border-slate-700 mb-1">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-px">
                    {days.map(d => {
                        const dateStr = d.toISOString().split('T')[0];
                        const dayEvents = allEvents[dateStr] || [];
                        const isToday = d.getTime() === today.getTime();
                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();

                        return (
                            <div key={d.toString()} onClick={() => handleDayClick(d)} className={`relative min-h-[120px] p-2 border border-transparent hover:border-indigo-400 cursor-pointer transition-colors ${isCurrentMonth ? '' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400'}`}>
                                <span className={`absolute top-2 left-2 flex items-center justify-center w-7 h-7 rounded-full text-sm ${isToday ? 'bg-indigo-500 text-white font-bold' : ''}`}>
                                    {d.getDate()}
                                </span>
                                <div className="mt-8 space-y-1 overflow-y-auto max-h-[80px]">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div key={event.id} className={`px-1.5 py-0.5 text-xs rounded truncate text-slate-800 ${event.color}`}>
                                            {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-slate-500">y {dayEvents.length - 3} más...</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            {selectedDate && (
                <EventModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    date={selectedDate}
                    events={allEvents[selectedDate.toISOString().split('T')[0]] || []}
                />
            )}
        </div>
    );
};

export default CalendarView;