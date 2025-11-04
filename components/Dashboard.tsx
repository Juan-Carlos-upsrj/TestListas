
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { AppContext } from '../context/AppContext';
import Icon from './icons/Icon';
import { MOTIVATIONAL_QUOTES, PROFESSOR_BIRTHDAYS, GROUP_COLORS } from '../constants';
import { CalendarEvent, DayOfWeek, MotivationalQuote, Professor, AttendanceStatus, Group } from '../types';
import { getClassDates } from '../services/dateUtils';
import BirthdayCelebration from './BirthdayCelebration';
import FridayCelebration from './FridayCelebration';
import Modal from './common/Modal';
import AttendanceTaker from './AttendanceTaker';
import Button from './common/Button';

const ReactGridLayout = WidthProvider(Responsive);

// --- Dashboard Widgets ---

const WelcomeWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const date = new Date();
    const formattedDate = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4 rounded-lg flex flex-col justify-center">
            <h2 className="text-2xl font-bold">Bienvenido/a, {state.settings.professorName}</h2>
            <p className="text-indigo-200 text-md capitalize">{formattedDate}</p>
        </div>
    );
};

const StatsWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const totalStudents = useMemo(() => state.groups.reduce((sum, group) => sum + group.students.length, 0), [state.groups]);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 p-4 rounded-lg flex justify-around items-center">
            <div className="text-center">
                <Icon name="users" className="w-8 h-8 mx-auto text-sky-500 mb-1" />
                <p className="text-2xl font-bold">{state.groups.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Grupos</p>
            </div>
            <div className="text-center">
                <Icon name="graduation-cap" className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Alumnos</p>
            </div>
        </div>
    );
};

const TodayScheduleWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const { groups } = state;
    const today = new Date();
    const dayOfWeekIndex = today.getDay(); // Sunday - 0, Monday - 1...

    const dayOfWeekSpanish: { [key: number]: DayOfWeek | 'Domingo' } = {
        0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
    };
    const todayName = dayOfWeekSpanish[dayOfWeekIndex];
    
    const todayClasses = useMemo(() => {
        if (todayName === 'Domingo') return [];
        return groups
            .filter(g => g.classDays.includes(todayName as DayOfWeek))
            .map(g => ({
                ...g,
                colorInfo: GROUP_COLORS.find(c => c.name === g.color) || GROUP_COLORS[0]
            }));
    }, [groups, todayName]);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 p-4 rounded-lg overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Clases de Hoy</h3>
            {todayClasses.length > 0 ? (
                <ul className="space-y-2">
                    {todayClasses.map(group => (
                        <li key={group.id} className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${group.colorInfo.bg} flex-shrink-0`}></span>
                            <div>
                                <p className="font-semibold text-sm">{group.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{group.subject}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-[calc(100%-36px)] text-center text-slate-500">
                    <Icon name="calendar" className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm">No hay clases programadas.</p>
                </div>
            )}
        </div>
    );
};

const UpcomingEventsWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const { calendarEvents, groups, settings } = state;

    const allEvents: CalendarEvent[] = useMemo(() => {
        const events: CalendarEvent[] = [...calendarEvents];
        groups.forEach(group => {
            const classDates = getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
            const groupColor = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];
            classDates.forEach(date => {
                events.push({
                    id: `class-${group.id}-${date}`,
                    date,
                    title: `Clase: ${group.name}`,
                    type: 'class',
                    color: groupColor.calendar
                });
            });
        });
        return events;
    }, [calendarEvents, groups, settings.semesterStart, settings.semesterEnd]);


    const upcoming = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return allEvents
            .filter(event => new Date(event.date + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5);
    }, [allEvents]);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 p-4 rounded-lg overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Próximos Eventos</h3>
            {upcoming.length > 0 ? (
                <ul className="space-y-2">
                    {upcoming.map(event => (
                        <li key={event.id} className="flex items-start gap-3">
                           <div className="flex-shrink-0 w-10 text-center">
                                <p className="font-bold text-xs text-indigo-600 dark:text-indigo-400 capitalize">
                                    {new Date(event.date + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' }).replace('.','')}
                                </p>
                                <p className="font-bold text-md">
                                    {new Date(event.date + 'T00:00:00').getDate()}
                                </p>
                           </div>
                            <div className="flex-grow pt-1">
                                <p className="font-semibold text-xs leading-tight">{event.title}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-[calc(100%-36px)] text-center text-slate-500">
                    <Icon name="calendar" className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm">No hay eventos próximos.</p>
                </div>
            )}
        </div>
    );
};

const TodayAttendanceWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const { groups, attendance } = state;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayOfWeekIndex = today.getDay();

    const dayOfWeekSpanish: { [key: number]: DayOfWeek | 'Domingo' } = {
        0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
    };
    const todayName = dayOfWeekSpanish[dayOfWeekIndex];

    const { totalStudents, presentStudents } = useMemo(() => {
        if (todayName === 'Domingo') {
            return { totalStudents: 0, presentStudents: 0 };
        }
        
        const todayGroups = groups.filter(g => g.classDays.includes(todayName as DayOfWeek));
        
        let total = 0;
        let present = 0;

        for (const group of todayGroups) {
            total += group.students.length;
            for (const student of group.students) {
                const status = attendance[group.id]?.[student.id]?.[todayStr];
                if (status === AttendanceStatus.Present) {
                    present++;
                }
            }
        }
        
        return { totalStudents: total, presentStudents: present };
    }, [groups, attendance, todayName, todayStr]);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 p-4 rounded-lg flex flex-col justify-center items-center text-center">
            <Icon name="check-square" className="w-8 h-8 mx-auto text-teal-500 mb-1" />
            <p className="text-3xl font-bold">{presentStudents}<span className="text-xl font-normal text-slate-500 dark:text-slate-400">/{totalStudents}</span></p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Presentes Hoy</p>
        </div>
    );
};


const MotivationalQuoteWidget: React.FC = () => {
    const [quote] = useState<MotivationalQuote>(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 p-4 rounded-lg flex flex-col justify-center text-center">
            {quote.icon && <Icon name={quote.icon} className="w-6 h-6 mx-auto text-amber-500 mb-2" />}
            <blockquote className="text-md italic">"{quote.text}"</blockquote>
            <cite className="mt-1 text-xs text-slate-500 dark:text-slate-400 not-italic">- {quote.author}</cite>
        </div>
    );
};

const TodayAttendancePassWidget: React.FC<{ onTakeAttendance: (group: Group) => void }> = ({ onTakeAttendance }) => {
    const { state } = useContext(AppContext);
    const { groups } = state;
    const today = new Date();
    const dayOfWeekIndex = today.getDay();

    const dayOfWeekSpanish: { [key: number]: DayOfWeek | 'Domingo' } = {
        0: 'Domingo', 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado'
    };
    const todayName = dayOfWeekSpanish[dayOfWeekIndex];

    const todayClasses = useMemo(() => {
        if (todayName === 'Domingo') return [];
        return groups.filter(g => g.classDays.includes(todayName as DayOfWeek));
    }, [groups, todayName]);

    return (
        <div className="w-full h-full bg-white dark:bg-slate-800 p-4 rounded-lg overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Pase de Lista Hoy</h3>
            {todayClasses.length > 0 ? (
                <ul className="space-y-2">
                    {todayClasses.map(group => (
                        <li key={group.id} className="flex items-center justify-between bg-slate-100 dark:bg-slate-700/50 p-2 rounded-md">
                            <p className="font-semibold text-sm">{group.name}</p>
                            <Button size="sm" onClick={() => onTakeAttendance(group)}>
                                <Icon name="list-checks" className="w-4 h-4" /> Asistencia
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-[calc(100%-36px)] text-center text-slate-500">
                    <Icon name="check-square" className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm">No hay grupos con clase hoy.</p>
                </div>
            )}
        </div>
    );
};


const widgetMap: { [key: string]: React.FC<any> } = {
    welcome: WelcomeWidget,
    stats: StatsWidget,
    todaySchedule: TodayScheduleWidget,
    upcomingEvents: UpcomingEventsWidget,
    todayAttendance: TodayAttendanceWidget,
    quote: MotivationalQuoteWidget,
    todayAttendancePass: TodayAttendancePassWidget,
};

const smLayout = [
    { i: 'welcome', x: 0, y: 0, w: 1, h: 1 },
    { i: 'stats', x: 0, y: 1, w: 1, h: 1 },
    { i: 'todayAttendance', x: 0, y: 2, w: 1, h: 1 },
    { i: 'todaySchedule', x: 0, y: 3, w: 1, h: 3 },
    { i: 'upcomingEvents', x: 0, y: 6, w: 1, h: 3 },
    { i: 'todayAttendancePass', x: 0, y: 9, w: 1, h: 3 },
    { i: 'quote', x: 0, y: 12, w: 1, h: 1 },
];

const dashboardLayouts: Layouts = {
    lg: [
        { i: 'welcome', x: 0, y: 0, w: 2, h: 1 }, { i: 'stats', x: 2, y: 0, w: 1, h: 1 },
        { i: 'todaySchedule', x: 0, y: 1, w: 1, h: 3 }, { i: 'upcomingEvents', x: 1, y: 1, w: 1, h: 3 },
        { i: 'todayAttendance', x: 2, y: 1, w: 1, h: 1 }, { i: 'quote', x: 2, y: 2, w: 1, h: 1 },
        { i: 'todayAttendancePass', x: 0, y: 4, w: 3, h: 3 },
    ],
    md: [
        { i: 'welcome', x: 0, y: 0, w: 2, h: 1 },
        { i: 'stats', x: 0, y: 1, w: 1, h: 1 }, { i: 'todayAttendance', x: 1, y: 1, w: 1, h: 1 },
        { i: 'todaySchedule', x: 0, y: 2, w: 1, h: 3 }, { i: 'upcomingEvents', x: 1, y: 2, w: 1, h: 3 },
        { i: 'todayAttendancePass', x: 0, y: 5, w: 2, h: 3 },
        { i: 'quote', x: 0, y: 8, w: 1, h: 1 },
    ],
    sm: smLayout,
    xs: smLayout,
    xxs: smLayout,
};


const Dashboard: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const [birthdayPerson, setBirthdayPerson] = useState<Professor | null>(null);
    const [isFriday, setIsFriday] = useState(false);
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [groupForAttendance, setGroupForAttendance] = useState<Group | null>(null);
    
    const todayStr = useMemo(() => {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }, []);

    useEffect(() => {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayMMDD = `${month}-${day}`;
        
        const birthdayProf = PROFESSOR_BIRTHDAYS.find(p => p.birthdate === todayMMDD);
        setBirthdayPerson(birthdayProf || null);

        setIsFriday(today.getDay() === 5);
    }, []);
    
    const handleTakeAttendance = (group: Group) => {
        setGroupForAttendance(group);
        setTakerOpen(true);
    };

    const handleTakerStatusChange = (studentId: string, status: AttendanceStatus) => {
        if (groupForAttendance) {
            dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: groupForAttendance.id, studentId, date: todayStr, status } });
        }
    };

    return (
        <div className="relative">
            <BirthdayCelebration name={birthdayPerson?.name || ''} show={!!birthdayPerson} />
            <FridayCelebration show={isFriday && !birthdayPerson} />

            <ReactGridLayout
                layouts={dashboardLayouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 3, md: 2, sm: 1, xs: 1, xxs: 1 }}
                rowHeight={90}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                isDraggable={false}
                isResizable={false}
                className="layout"
            >
                {Object.keys(widgetMap).map(key => (
                    <div key={key} className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
                        {React.createElement(widgetMap[key], {
                            onTakeAttendance: handleTakeAttendance
                        })}
                    </div>
                ))}
            </ReactGridLayout>
            
            {groupForAttendance && (
                <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${groupForAttendance.name}`}>
                    <AttendanceTaker 
                        students={groupForAttendance.students} 
                        date={todayStr} 
                        groupAttendance={state.attendance[groupForAttendance.id] || {}}
                        onStatusChange={handleTakerStatusChange}
                        onClose={() => setTakerOpen(false)}
                    />
                </Modal>
             )}
        </div>
    );
};

export default Dashboard;