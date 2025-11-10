import React, { useContext, useMemo, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { AppContext } from '../context/AppContext';
import { Group, AttendanceStatus } from '../types';
import Icon from './icons/Icon';
import BirthdayCelebration from './BirthdayCelebration';
import FridayCelebration from './FridayCelebration';
import { PROFESSOR_BIRTHDAYS, GROUP_COLORS } from '../constants';
import Modal from './common/Modal';
import AttendanceTaker from './AttendanceTaker';
import { motion } from 'framer-motion';
import { syncAttendanceData, syncScheduleData } from '../services/syncService';
import Button from './common/Button';

const ResponsiveGridLayout = WidthProvider(Responsive);

// --- Widget Components ---

const WelcomeWidget: React.FC<{ dateString: string }> = ({ dateString }) => {
    const { state } = useContext(AppContext);
    return (
        <>
            <h3 className="font-bold text-xl mb-1">Bienvenido/a, {state.settings.professorName}!</h3>
            <p className="text-slate-500 dark:text-slate-400 capitalize">{dateString}</p>
        </>
    );
};

const StatsWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const totalStudents = state.groups.reduce((sum, group) => sum + group.students.length, 0);
    return (
        <div className="grid grid-cols-2 gap-4 text-center h-full">
            <div className="flex flex-col justify-center">
                <p className="text-3xl font-bold text-indigo-500">{state.groups.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Grupos</p>
            </div>
            <div className="flex flex-col justify-center">
                <p className="text-3xl font-bold text-indigo-500">{totalStudents}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Alumnos</p>
            </div>
        </div>
    );
};

const TodaysClassesWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('es-ES', { weekday: 'long' });
    const todaysClasses = state.groups.filter(g => g.classDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase()));

    if (todaysClasses.length === 0) {
        return <p className="text-slate-500 text-center flex items-center justify-center h-full">No hay clases programadas para hoy.</p>;
    }

    return (
        <ul className="space-y-2 overflow-y-auto h-full pr-2">
            {todaysClasses.map(g => (
                <li key={g.id} className="text-sm p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md truncate">{g.name}</li>
            ))}
        </ul>
    );
};

const UpcomingEventsWidget: React.FC = () => {
    const { state } = useContext(AppContext);
    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sortedEvents = state.gcalEvents
            .filter(event => new Date(event.date + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (sortedEvents.length === 0) return [];

        // Group consecutive events with the same title
        const grouped = sortedEvents.reduce((acc, event) => {
            const lastEvent = acc[acc.length - 1];
            const eventDate = new Date(event.date + 'T00:00:00');
            
            if (lastEvent && lastEvent.title === event.title) {
                const lastEndDate = new Date(lastEvent.endDate + 'T00:00:00');
                const expectedNextDate = new Date(lastEndDate);
                expectedNextDate.setDate(lastEndDate.getDate() + 1);
                
                if (eventDate.getTime() === expectedNextDate.getTime()) {
                    lastEvent.endDate = event.date;
                    return acc;
                }
            }
            
            acc.push({
                id: event.id,
                title: event.title,
                startDate: event.date,
                endDate: event.date,
            });
            return acc;
        }, [] as { id: string; title: string; startDate: string; endDate: string; }[]);
        
        return grouped.slice(0, 3);
    }, [state.gcalEvents]);
    
    if (upcomingEvents.length === 0) {
        return <p className="text-slate-500 text-center flex items-center justify-center h-full">No hay próximos eventos de Google Calendar.</p>;
    }

    return (
        <ul className="space-y-2 overflow-y-auto h-full pr-2">
            {upcomingEvents.map(event => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const startDate = new Date(event.startDate + 'T00:00:00');
                const endDate = new Date(event.endDate + 'T00:00:00');

                // Proximity and coloring logic
                const diffInDays = (d1: Date, d2: Date) => Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
                
                const startDiff = diffInDays(startDate, today);
                const endDiff = diffInDays(endDate, today);
                const isOngoing = startDiff <= 0 && endDiff >= 0;

                let colorClass = 'bg-slate-100 dark:bg-slate-700/50'; // Default
                if (isOngoing && endDiff <= 2) {
                    colorClass = 'bg-red-100 dark:bg-red-900/50 border-l-4 border-red-400'; // Ending soon
                } else if (!isOngoing && startDiff <= 7) {
                    colorClass = 'bg-amber-100 dark:bg-amber-900/50 border-l-4 border-amber-400'; // Approaching
                }

                // Date formatting logic
                let dateString: string;
                if (startDate.getTime() === endDate.getTime()) {
                    dateString = startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                } else {
                    if (startDate.getMonth() === endDate.getMonth()) {
                        dateString = `${startDate.getDate()} - ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`;
                    } else {
                        dateString = `${startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
                    }
                }

                return (
                    <li key={event.id} className={`text-sm p-2 rounded-md transition-colors ${colorClass}`}>
                        <p className="font-semibold truncate">{event.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{dateString}</p>
                    </li>
                );
            })}
        </ul>
    );
};


const AttendanceSummaryWidget: React.FC<{ todayStr: string }> = ({ todayStr }) => {
    const { state } = useContext(AppContext);
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('es-ES', { weekday: 'long' });

    const { present, total } = useMemo(() => {
        let presentCount = 0;
        let totalCount = 0;
        state.groups
            .filter(g => g.classDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase()))
            .forEach(group => {
                group.students.forEach(student => {
                    totalCount++;
                    const status = state.attendance[group.id]?.[student.id]?.[todayStr];
                    if (status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified || status === AttendanceStatus.Exchange) {
                        presentCount++;
                    }
                });
            });
        return { present: presentCount, total: totalCount };
    }, [state.groups, state.attendance, todayStr, dayOfWeek]);

    if (total === 0) {
        return <p className="text-slate-500 text-center flex items-center justify-center h-full">No hay alumnos en clases hoy.</p>;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-4xl font-bold text-indigo-500">
                {present} <span className="text-2xl text-slate-400">/ {total}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Alumnos Presentes Hoy</p>
        </div>
    );
};

const QuickActionsWidget: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);

    const handleSyncAttendance = () => {
        syncAttendanceData(state, dispatch);
    };

    const handleSyncSchedule = () => {
        syncScheduleData(state, dispatch);
    };

    return (
        <div className="flex flex-col gap-3 h-full justify-center">
            <Button onClick={handleSyncAttendance} variant="secondary" className="w-full">
                <Icon name="upload-cloud" className="w-4 h-4" />
                Subir Asistencias
            </Button>
            <Button onClick={handleSyncSchedule} className="w-full !bg-blue-600 hover:!bg-blue-700 text-white">
                <Icon name="download-cloud" className="w-4 h-4" />
                Actualizar Horario
            </Button>
        </div>
    );
};


const TakeAttendanceWidget: React.FC<{ onTakeAttendance: (group: Group) => void }> = ({ onTakeAttendance }) => {
    const { state } = useContext(AppContext);
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('es-ES', { weekday: 'long' });
    const todaysClasses = state.groups.filter(g => g.classDays.some(d => d.toLowerCase() === dayOfWeek.toLowerCase()));

    if (todaysClasses.length === 0) {
        return <p className="text-slate-500 text-center flex items-center justify-center h-full">No hay grupos con clase hoy.</p>;
    }
    
    const baseClasses = 'font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all duration-200 ease-in-out inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
    const sizeClasses = 'py-2 px-4 text-base';

    return (
        <div className="flex flex-wrap gap-3">
            {todaysClasses.map(group => {
                const groupColor = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];
                return (
                     <motion.button
                        key={group.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onTakeAttendance(group)}
                        className={`${baseClasses} ${sizeClasses} ${groupColor.bg} ${groupColor.text} hover:opacity-90`}
                    >
                        <Icon name="list-checks" className="w-4 h-4" />
                        {group.name}
                    </motion.button>
                );
            })}
        </div>
    );
};


const WidgetWrapper: React.FC<{ title: string; children: React.ReactNode; autoHeight?: boolean; }> = ({ title, children, autoHeight = false }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col h-full">
        <h3 className="font-bold mb-3 text-slate-600 dark:text-slate-300">{title}</h3>
        <div className={!autoHeight ? "flex-grow" : ""}>
            {children}
        </div>
    </div>
);


// Main Dashboard Component
const Dashboard: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [attendanceGroup, setAttendanceGroup] = useState<Group | null>(null);

    const [today, setToday] = useState(new Date());
    const [birthdayPerson, setBirthdayPerson] = useState<string | null>(null);
    const [isFriday, setIsFriday] = useState(false);

    React.useEffect(() => {
        const timer = setInterval(() => setToday(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    React.useEffect(() => {
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const todayStr = `${month}-${day}`;
        const birthday = PROFESSOR_BIRTHDAYS.find(p => p.birthdate === todayStr);
        setBirthdayPerson(birthday ? birthday.name : null);
        setIsFriday(today.getDay() === 5);
    }, [today]);

    const dateString = today.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const handleTakeAttendance = (group: Group) => {
        setAttendanceGroup(group);
        setTakerOpen(true);
    };

    const handleTakerStatusChange = (studentId: string, status: AttendanceStatus) => {
        if (attendanceGroup) {
            dispatch({
                type: 'UPDATE_ATTENDANCE',
                payload: { groupId: attendanceGroup.id, studentId, date: todayStr, status }
            });
        }
    };
    
    const layouts = {
        lg: [
            { i: 'welcome', x: 0, y: 0, w: 2, h: 1 },
            { i: 'stats', x: 2, y: 0, w: 1, h: 1 },
            { i: 'todays-classes', x: 0, y: 1, w: 1, h: 2 },
            { i: 'upcoming-events', x: 1, y: 1, w: 1, h: 2 },
            { i: 'attendance-summary', x: 2, y: 1, w: 1, h: 2 },
            { i: 'quick-actions', x: 0, y: 3, w: 1, h: 1 },
            { i: 'take-attendance', x: 1, y: 3, w: 2, h: 1 },
        ]
    };

    return (
        <div>
            <BirthdayCelebration name={birthdayPerson || ''} show={!!birthdayPerson} />
            <FridayCelebration show={isFriday && !birthdayPerson} />
            
            <ResponsiveGridLayout
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 3, md: 3, sm: 2, xs: 1, xxs: 1 }}
                rowHeight={120}
                isDraggable={false}
                isResizable={false}
                margin={[16, 16]}
            >
                <div key="welcome">
                    <WidgetWrapper title=""><WelcomeWidget dateString={dateString} /></WidgetWrapper>
                </div>
                <div key="stats">
                     <WidgetWrapper title=""><StatsWidget /></WidgetWrapper>
                </div>
                <div key="todays-classes">
                     <WidgetWrapper title="Clases de Hoy"><TodaysClassesWidget /></WidgetWrapper>
                </div>
                <div key="upcoming-events">
                     <WidgetWrapper title="Próximos Eventos (GCAL)"><UpcomingEventsWidget /></WidgetWrapper>
                </div>
                <div key="attendance-summary">
                     <WidgetWrapper title="Asistencia de Hoy"><AttendanceSummaryWidget todayStr={todayStr} /></WidgetWrapper>
                </div>
                <div key="quick-actions">
                     <WidgetWrapper title="Acciones Rápidas"><QuickActionsWidget /></WidgetWrapper>
                </div>
                <div key="take-attendance">
                     <WidgetWrapper title="Pase de Lista Hoy" autoHeight><TakeAttendanceWidget onTakeAttendance={handleTakeAttendance} /></WidgetWrapper>
                </div>
            </ResponsiveGridLayout>
            
            {attendanceGroup && (
                 <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${attendanceGroup.name}`}>
                    <AttendanceTaker 
                        students={attendanceGroup.students} 
                        date={todayStr} 
                        groupAttendance={state.attendance[attendanceGroup.id] || {}}
                        onStatusChange={handleTakerStatusChange}
                        onClose={() => setTakerOpen(false)}
                    />
                </Modal>
             )}
        </div>
    );
};

export default Dashboard;