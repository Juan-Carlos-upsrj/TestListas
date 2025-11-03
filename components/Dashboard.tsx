

import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Responsive, WidthProvider, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Icon from './icons/Icon';
import { MOTIVATIONAL_QUOTES, PROFESSOR_BIRTHDAYS, DAYS_OF_WEEK } from '../constants';
import { AttendanceStatus } from '../types';
import { getClassDates } from '../services/dateUtils';
import BirthdayCelebration from './BirthdayCelebration';
import FridayCelebration from './FridayCelebration';

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGET_KEYS = ['welcome', 'schedule', 'atRisk', 'quote'];

const Dashboard: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { settings, groups, selectedGroupId, attendance, dashboardLayouts } = state;
    
    // Celebrations state
    const [birthdayCelebration, setBirthdayCelebration] = useState<{ show: boolean; name: string }>({ show: false, name: '' });
    const [fridayCelebration, setFridayCelebration] = useState(false);

    // Memoize date-related calculations to prevent re-creating them on every render.
    // This is crucial to avoid infinite loops in useEffect hooks.
    const { dayOfWeek } = useMemo(() => {
        const today = new Date();
        // In JS getDay(), Sunday is 0, Monday is 1... In our app, Monday is 'Lunes' at index 0.
        const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
        const dayOfWeek = DAYS_OF_WEEK[dayIndex];
        return { dayOfWeek };
    }, []);
    
    // Check for celebrations only once when the component mounts.
    useEffect(() => {
        const today = new Date();
        const todayStrMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // Birthday check
        const birthdayPerson = PROFESSOR_BIRTHDAYS.find(p => p.birthdate === todayStrMonthDay);
        if (birthdayPerson) {
            setBirthdayCelebration({ show: true, name: birthdayPerson.name });
        }

        // Friday check
        if (today.getDay() === 5) { // 5 is Friday
            const lastShown = localStorage.getItem('fridayCelebrationShown');
            if(lastShown !== today.toISOString().split('T')[0]) {
                 setFridayCelebration(true);
                 setTimeout(() => {
                    setFridayCelebration(false);
                    localStorage.setItem('fridayCelebrationShown', today.toISOString().split('T')[0]);
                }, 7000);
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount.


    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    
    const totalStudents = useMemo(() => groups.reduce((acc, group) => acc + group.students.length, 0), [groups]);
    
    const todaysClasses = useMemo(() => groups.filter(g => g.classDays.includes(dayOfWeek)), [groups, dayOfWeek]);

    const atRiskStudents = useMemo(() => {
        if (!selectedGroup) return [];
        
        const groupClassDates = getClassDates(settings.semesterStart, settings.semesterEnd, selectedGroup.classDays);
        const groupAttendance = attendance[selectedGroup.id] || {};

        return selectedGroup.students.map(student => {
            const studentAttendance = groupAttendance[student.id] || {};
            let present = 0;
            let total = 0;
            
            groupClassDates.forEach(date => {
                const status = studentAttendance[date];
                if(status && status !== AttendanceStatus.Pending) {
                    total++;
                    if(status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified || status === AttendanceStatus.Exchange) {
                        present++;
                    }
                }
            });
            
            const percentage = total > 0 ? (present / total) * 100 : 100;
            return { student, percentage };
        }).filter(item => item.percentage < settings.lowAttendanceThreshold)
          .sort((a,b) => a.percentage - b.percentage);

    }, [selectedGroup, attendance, settings.semesterStart, settings.semesterEnd, settings.lowAttendanceThreshold]);
    
    const quote = useMemo(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], []);

    const onLayoutChange = (_: any, layouts: Layouts) => {
        dispatch({ type: 'SAVE_DASHBOARD_LAYOUT', payload: layouts });
    };
    
    const defaultLayouts: Layouts = useMemo(() => ({
        lg: [
            { i: 'welcome', x: 0, y: 0, w: 8, h: 2, minW: 4, minH: 2 },
            { i: 'schedule', x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'atRisk', x: 0, y: 2, w: 8, h: 2, minW: 4, minH: 2 },
            { i: 'quote', x: 8, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
        ],
         md: [
            { i: 'welcome', x: 0, y: 0, w: 6, h: 2, minW: 4, minH: 2 },
            { i: 'schedule', x: 6, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'atRisk', x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
            { i: 'quote', x: 6, y: 4, w: 4, h: 2, minW: 3, minH: 2 },
        ],
        sm: [
            { i: 'welcome', x: 0, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
            { i: 'schedule', x: 0, y: 2, w: 3, h: 4, minW: 3, minH: 3 },
            { i: 'atRisk', x: 0, y: 6, w: 6, h: 2, minW: 3, minH: 2 },
            { i: 'quote', x: 3, y: 2, w: 3, h: 4, minW: 3, minH: 2 },
        ],
        xs: [
            { i: 'welcome', x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
            { i: 'schedule', x: 0, y: 2, w: 4, h: 3, minW: 2, minH: 3 },
            { i: 'atRisk', x: 0, y: 5, w: 4, h: 2, minW: 2, minH: 2 },
            { i: 'quote', x: 0, y: 7, w: 4, h: 2, minW: 2, minH: 2 },
        ],
        xxs: [
            { i: 'welcome', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
            { i: 'schedule', x: 0, y: 2, w: 2, h: 3, minW: 2, minH: 3 },
            { i: 'atRisk', x: 0, y: 5, w: 2, h: 2, minW: 2, minH: 2 },
            { i: 'quote', x: 0, y: 7, w: 2, h: 2, minW: 2, minH: 2 },
        ],
    }), []);

    const layouts = useMemo(() => {
        if (!dashboardLayouts || Object.keys(dashboardLayouts).length === 0) {
            return defaultLayouts;
        }

        const sanitizedLayouts: Layouts = {};
        for (const breakpoint of Object.keys(defaultLayouts)) {
            const savedLayout = dashboardLayouts[breakpoint] || [];
            const defaultBreakpointLayout = defaultLayouts[breakpoint] || [];

            // 1. Filter out layouts for widgets that no longer exist in the code.
            const filteredLayout = savedLayout.filter(item => WIDGET_KEYS.includes(item.i));
            
            // 2. Find which widgets are defined in the code but are missing from the saved layout.
            const existingKeys = filteredLayout.map(item => item.i);
            const missingKeys = WIDGET_KEYS.filter(key => !existingKeys.includes(key));
            
            // 3. Get the default layout settings for the missing widgets.
            const newItems = defaultBreakpointLayout.filter(item => missingKeys.includes(item.i));

            // 4. Combine the filtered saved layout with the new widget layouts.
            sanitizedLayouts[breakpoint] = [...filteredLayout, ...newItems];
        }
        return sanitizedLayouts;
    }, [dashboardLayouts, defaultLayouts]);

    return (
        <div className="relative">
             <BirthdayCelebration show={birthdayCelebration.show} name={birthdayCelebration.name} />
             <FridayCelebration show={fridayCelebration} />
            
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                onLayoutChange={onLayoutChange}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={100}
                draggableHandle=".drag-handle"
            >
                <div key="welcome" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                    <div className="drag-handle cursor-move w-full flex justify-between items-center text-slate-400 dark:text-slate-500 mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Bienvenido/a</h3>
                        {/* Using a generic move icon for clarity */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="5 9 2 9 2 5"></polyline><polyline points="19 9 22 9 22 5"></polyline><polyline points="5 15 2 15 2 19"></polyline><polyline points="19 15 22 15 22 19"></polyline></svg>
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Hola, {settings.professorName}</h2>
                        <p className="text-slate-500 dark:text-slate-400">Tienes {groups.length} grupos y un total de {totalStudents} alumnos.</p>
                    </div>
                </div>

                <div key="schedule" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                    <div className="drag-handle cursor-move w-full flex justify-between items-center text-slate-400 dark:text-slate-500 mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Clases de Hoy ({dayOfWeek})</h3>
                         <Icon name="calendar-check" className="w-4 h-4" />
                    </div>
                     <div className="flex-grow overflow-y-auto pr-2">
                        {todaysClasses.length > 0 ? (
                            <ul className="space-y-2">
                                {todaysClasses.map(group => (
                                    <li key={group.id} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                        <p className="font-semibold">{group.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{group.subject}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="h-full flex items-center justify-center text-center text-slate-500">
                                <p>No hay clases programadas para hoy. ¡Disfruta tu día!</p>
                            </div>
                        )}
                    </div>
                </div>

                <div key="atRisk" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                    <div className="drag-handle cursor-move w-full flex justify-between items-center text-slate-400 dark:text-slate-500 mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Alumnos con Asistencia Baja ({selectedGroup?.name || 'Ningún grupo'})</h3>
                         <Icon name="alert-triangle" className="w-4 h-4" />
                    </div>
                     <div className="flex-grow overflow-y-auto pr-2">
                        {!selectedGroup ? (
                             <div className="h-full flex items-center justify-center text-center text-slate-500">
                                <p>Selecciona un grupo para ver este reporte.</p>
                            </div>
                        ) : atRiskStudents.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {atRiskStudents.map(({ student, percentage }) => (
                                    <div key={student.id} className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-center">
                                        <p className="font-semibold text-sm truncate">{student.name}</p>
                                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{percentage.toFixed(0)}%</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="h-full flex items-center justify-center text-center text-slate-500">
                                <p>¡Excelente! Ningún alumno tiene asistencia baja en este grupo.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div key="quote" className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                     <div className="drag-handle cursor-move w-full flex justify-between items-center text-slate-400 dark:text-slate-500 mb-2">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Frase del Día</h3>
                        <Icon name="quote" className="w-4 h-4" />
                    </div>
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        {quote.icon && <Icon name={quote.icon} className="w-8 h-8 text-indigo-400 mb-2"/>}
                        <p className="italic text-lg">"{quote.text}"</p>
                        <p className="font-semibold mt-2">- {quote.author}</p>
                    </div>
                </div>

            </ResponsiveGridLayout>
        </div>
    );
};

export default Dashboard;