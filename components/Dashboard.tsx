import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Icon from './icons/Icon';
import { CalendarEvent, DayOfWeek, Group, AttendanceStatus, Layouts } from '../types';
import FridayCelebration from './FridayCelebration';
import BirthdayCelebration from './BirthdayCelebration';
import { getClassDates } from '../services/dateUtils';
import { MOTIVATIONAL_QUOTES, GROUP_COLORS, PROFESSOR_BIRTHDAYS } from '../constants';
import { fetchGoogleCalendarEvents } from '../services/calendarService';
import Modal from './common/Modal';
import Button from './common/Button';
import AttendanceTaker from './AttendanceTaker';
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Define default layouts for different breakpoints
const defaultLayouts: Layouts = {
  lg: [
    { i: 'stat-groups', x: 0, y: 0, w: 1, h: 1 },
    { i: 'stat-students', x: 1, y: 0, w: 1, h: 1 },
    { i: 'stat-attendance', x: 2, y: 0, w: 2, h: 1 },
    { i: 'upcoming-events', x: 0, y: 1, w: 2, h: 2 },
    { i: 'quick-actions', x: 2, y: 1, w: 2, h: 1 },
    { i: 'reminders', x: 2, y: 2, w: 2, h: 1 },
    { i: 'daily-quote', x: 0, y: 3, w: 4, h: 1 },
  ],
  md: [
    { i: 'stat-groups', x: 0, y: 0, w: 1, h: 1 },
    { i: 'stat-students', x: 1, y: 0, w: 1, h: 1 },
    { i: 'stat-attendance', x: 0, y: 1, w: 2, h: 1 },
    { i: 'upcoming-events', x: 0, y: 2, w: 2, h: 2 },
    { i: 'quick-actions', x: 0, y: 4, w: 2, h: 1 },
    { i: 'reminders', x: 0, y: 5, w: 2, h: 1 },
    { i: 'daily-quote', x: 0, y: 6, w: 2, h: 1 },
  ],
};


const Dashboard: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, settings, calendarEvents, attendance, dashboardLayouts } = state;

    const [isFriday, setIsFriday] = useState(false);
    const [birthdayPerson, setBirthdayPerson] = useState<string | null>(null);
    const [gcalEvents, setGcalEvents] = useState<CalendarEvent[]>([]);
    
    // State for Quick Attendance Taker
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [groupForTaker, setGroupForTaker] = useState<Group | null>(null);
    const [isMultiGroupModalOpen, setMultiGroupModalOpen] = useState(false);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayDayOfWeek = today.getDay(); // Sunday=0, Monday=1, etc.

    useEffect(() => {
        if (today.getDay() === 5) {
            setIsFriday(true);
        }
        const todayBirthdateStr = (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
        const birthdayProf = PROFESSOR_BIRTHDAYS.find(p => p.birthdate === todayBirthdateStr);
        if (birthdayProf) {
            setBirthdayPerson(birthdayProf.name);
        }
    }, [today]);

    useEffect(() => {
        const fetchEvents = async () => {
            if (settings.googleCalendarUrl) {
                try {
                    const gcalColorName = settings.googleCalendarColor || 'amber';
                    const gcalColor = GROUP_COLORS.find(c => c.name === gcalColorName) || GROUP_COLORS.find(c => c.name === 'amber')!;
                    const events = await fetchGoogleCalendarEvents(settings.googleCalendarUrl, gcalColor.calendar);
                    setGcalEvents(events);
                } catch (error) {
                    console.error("Failed to fetch Google Calendar events for dashboard", error);
                }
            } else {
                setGcalEvents([]);
            }
        };
        fetchEvents();
    }, [settings.googleCalendarUrl, settings.googleCalendarColor]);
    
    const onLayoutChange = (_layout: any, allLayouts: Layouts) => {
        dispatch({ type: 'SAVE_DASHBOARD_LAYOUT', payload: allLayouts });
    };

    const stats = useMemo(() => ({
        totalGroups: groups.length,
        totalStudents: groups.reduce((acc, group) => acc + group.students.length, 0),
    }), [groups]);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const allEvents: CalendarEvent[] = [...calendarEvents, ...gcalEvents];
        groups.forEach(group => {
            const classDates = getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
            classDates.forEach(date => {
                allEvents.push({
                    id: `class-${group.id}-${date}`, date, title: `Clase: ${group.name}`, type: 'class', color: 'bg-blue-200'
                });
            });
        });
        
        return allEvents
            .map(event => ({ ...event, eventDate: new Date(event.date + 'T00:00:00') }))
            .filter(event => event.eventDate >= today && event.eventDate <= nextWeek)
            .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
            .slice(0, 5);
    }, [calendarEvents, groups, settings, gcalEvents]);
    
    const attendanceToday = useMemo(() => {
        let studentsWithClassToday = 0;
        let presentToday = 0;
        const dayMap: { [key in DayOfWeek]: number } = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
        
        groups.forEach(group => {
            const hasClassToday = group.classDays.some(day => dayMap[day] === todayDayOfWeek);
            if (hasClassToday) {
                studentsWithClassToday += group.students.length;
                group.students.forEach(student => {
                    const status = attendance[group.id]?.[student.id]?.[todayStr];
                    if (status === 'Presente') presentToday++;
                });
            }
        });

        if (studentsWithClassToday === 0) return null;
        const percentage = (presentToday / studentsWithClassToday) * 100;
        return { total: studentsWithClassToday, present: presentToday, percentage: isNaN(percentage) ? 0 : percentage.toFixed(0) };
    }, [groups, attendance, todayStr, todayDayOfWeek]);

    const dailyQuote = useMemo(() => {
        const start = new Date(new Date().getFullYear(), 0, 0);
        const diff = (new Date().getTime() - start.getTime()) + ((start.getTimezoneOffset() - new Date().getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    }, []);

    const nextGcalEvent = useMemo(() => {
        if (gcalEvents.length === 0) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return gcalEvents
            .map(event => ({ ...event, eventDate: new Date(event.date + 'T00:00:00') }))
            .filter(event => event.eventDate >= today)
            .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())[0];
    }, [gcalEvents]);

    const groupsWithClassToday = useMemo(() => {
        const dayMap: { [key in DayOfWeek]: number } = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
        return groups.filter(group => group.classDays.some(day => dayMap[day] === todayDayOfWeek));
    }, [groups, todayDayOfWeek]);

    const handleQuickAttendanceClick = () => {
        if (groupsWithClassToday.length === 1) {
            setGroupForTaker(groupsWithClassToday[0]);
            setTakerOpen(true);
        } else if (groupsWithClassToday.length > 1) {
            setMultiGroupModalOpen(true);
        }
    };
    
    const handleSelectGroupForTaker = (group: Group) => {
        setGroupForTaker(group);
        setMultiGroupModalOpen(false);
        setTakerOpen(true);
    };

    const handleTakerStatusChange = (studentId: string, status: AttendanceStatus) => {
        if (groupForTaker) {
            dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: groupForTaker.id, studentId, date: todayStr, status } });
        }
    };

    const layouts = Object.keys(dashboardLayouts).length > 0 ? dashboardLayouts : defaultLayouts;

    return (
        <div>
            <FridayCelebration show={isFriday} />
            <BirthdayCelebration name={birthdayPerson || ''} show={!!birthdayPerson} />
            <h1 className="text-3xl font-bold mb-6">Inicio</h1>
            
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 4, md: 2, sm: 1, xs: 1, xxs: 1 }}
                rowHeight={120}
                onLayoutChange={onLayoutChange}
            >
                {/* Stat Cards */}
                <div key="stat-groups" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-full"><Icon name="users" className="w-6 h-6 text-indigo-500" /></div>
                    <div><p className="text-slate-500 dark:text-slate-400">Grupos Activos</p><p className="text-2xl font-bold">{stats.totalGroups}</p></div>
                </div>
                <div key="stat-students" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                     <div className="bg-green-100 dark:bg-green-500/20 p-3 rounded-full"><Icon name="graduation-cap" className="w-6 h-6 text-green-500" /></div>
                    <div><p className="text-slate-500 dark:text-slate-400">Total de Alumnos</p><p className="text-2xl font-bold">{stats.totalStudents}</p></div>
                </div>
                <div key="stat-attendance" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                     <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-full"><Icon name="check-square" className="w-6 h-6 text-blue-500" /></div>
                    {attendanceToday ? (
                        <div className="flex-grow">
                            <div className="flex justify-between items-center"><p className="text-slate-500 dark:text-slate-400">Asistencia de Hoy</p><p className="font-bold text-lg">{attendanceToday.percentage}%</p></div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mt-2"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${attendanceToday.percentage}%` }}></div></div>
                            <p className="text-xs text-slate-400 mt-1 text-right">{attendanceToday.present} de {attendanceToday.total} alumnos presentes</p>
                        </div>
                    ) : (
                        <div><p className="text-slate-500 dark:text-slate-400">Asistencia de Hoy</p><p className="text-lg font-semibold">No hay clases programadas.</p></div>
                    )}
                </div>

                {/* Upcoming Events */}
                <div key="upcoming-events" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col">
                    <h2 className="text-xl font-bold mb-4">Próximos 7 Días</h2>
                    <div className="overflow-y-auto flex-grow">
                        {upcomingEvents.length > 0 ? (
                            <ul className="space-y-3">
                                {upcomingEvents.map(event => (
                                    <li key={event.id} className="flex items-start gap-4">
                                        <div className="flex flex-col items-center"><p className="font-bold text-indigo-500">{event.eventDate.toLocaleDateString('es-MX', { month: 'short' })}</p><p className="text-2xl font-bold">{event.eventDate.getDate()}</p></div>
                                        <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1 flex-grow"><p className="font-semibold">{event.title}</p><p className="text-sm text-slate-500">{event.eventDate.toLocaleDateString('es-MX', { weekday: 'long' })}</p></div>
                                    </li>
                                ))}
                            </ul>
                        ) : ( <p className="text-center py-8 text-slate-500">No hay eventos próximos.</p> )}
                    </div>
                </div>
                
                <div key="quick-actions" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Acciones Rápidas</h2>
                    <Button onClick={handleQuickAttendanceClick} disabled={groupsWithClassToday.length === 0} className="w-full">
                        <Icon name="list-checks" /> Pase de Lista Hoy
                    </Button>
                     {groupsWithClassToday.length === 0 && <p className="text-xs text-slate-400 text-center mt-2">No hay grupos con clase hoy.</p>}
                </div>
                
                <div key="reminders" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Recordatorios</h2>
                    {nextGcalEvent ? (
                        <div className="flex items-start gap-3 p-3 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                            <Icon name="bell" className="w-5 h-5 text-orange-600 dark:text-orange-300 mt-1 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-100">{nextGcalEvent.title}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{nextGcalEvent.eventDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                        </div>
                    ) : (<p className="text-center py-4 text-slate-500">No hay recordatorios de Google Calendar.</p>)}
                </div>

                <div key="daily-quote" className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                    {dailyQuote.image ? (
                        <img src={dailyQuote.image} alt={dailyQuote.author} className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700" />
                    ) : ( <Icon name={dailyQuote.icon || 'quote'} className="w-10 h-10 text-slate-300 dark:text-slate-600 flex-shrink-0"/> )}
                    <div>
                        <p className="text-sm italic text-slate-600 dark:text-slate-300">"{dailyQuote.text}"</p>
                        <p className="mt-1 text-xs font-semibold text-right w-full">- {dailyQuote.author}</p>
                    </div>
                </div>

            </ResponsiveGridLayout>

            {/* Modals for Attendance Taker */}
            {groupForTaker && (
                <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${groupForTaker.name}`}>
                    <AttendanceTaker 
                        students={groupForTaker.students} 
                        date={todayStr} 
                        groupAttendance={attendance[groupForTaker.id] || {}}
                        onStatusChange={handleTakerStatusChange}
                        onClose={() => setTakerOpen(false)}
                    />
                </Modal>
             )}
             <Modal isOpen={isMultiGroupModalOpen} onClose={() => setMultiGroupModalOpen(false)} title="Seleccionar Grupo" size="sm">
                <div className="space-y-2">
                    <p className="mb-4">Hay clases en varios grupos hoy. ¿Para cuál quieres pasar lista?</p>
                    {groupsWithClassToday.map(g => (
                        <Button key={g.id} variant="secondary" className="w-full justify-start" onClick={() => handleSelectGroupForTaker(g)}>
                            {g.name}
                        </Button>
                    ))}
                </div>
            </Modal>
        </div>
    );
};

export default Dashboard;