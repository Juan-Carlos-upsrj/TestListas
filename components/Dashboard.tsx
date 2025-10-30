
import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import Icon from './icons/Icon';
import { motion } from 'framer-motion';
import { CalendarEvent, DayOfWeek } from '../types';
import FridayCelebration from './FridayCelebration';
import BirthdayCelebration from './BirthdayCelebration';
import { getClassDates } from '../services/dateUtils';
import { MOTIVATIONAL_QUOTES } from '../constants';

const Dashboard: React.FC = () => {
    const { state } = useContext(AppContext);
    const { groups, settings, calendarEvents, attendance } = state;

    const [isFriday, setIsFriday] = useState(false);
    // Assuming a professor's info could be added. For now, a placeholder.
    const professor = { name: 'Profesor', birthdate: '1990-10-26' }; // Example birthdate
    const [birthdayPerson, setBirthdayPerson] = useState<string | null>(null);

    useEffect(() => {
        const today = new Date();
        // Check for Friday
        if (today.getDay() === 5) {
            setIsFriday(true);
        }

        // Check for Birthdays
        const todayStr = (today.getMonth() + 1).toString().padStart(2, '0') + '-' + today.getDate().toString().padStart(2, '0');
        
        if (professor.birthdate.substring(5) === todayStr) {
            setBirthdayPerson(professor.name);
            return; // Only show one birthday at a time, professor takes precedence
        }
        
        for (const group of groups) {
            for (const student of group.students) {
                // Assuming student object might have a birthdate. The type doesn't, so I'll just check the professor for now.
                // If student type had `birthdate: string;`, this would be the place to check it.
            }
        }

    }, [groups, professor]);


    const stats = useMemo(() => {
        const totalStudents = groups.reduce((acc, group) => acc + group.students.length, 0);
        return {
            totalGroups: groups.length,
            totalStudents: totalStudents,
        };
    }, [groups]);

    const upcomingEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const allEvents: CalendarEvent[] = [...calendarEvents];

        // Add class days as events
        state.groups.forEach(group => {
            const classDates = getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
            classDates.forEach(date => {
                allEvents.push({
                    id: `class-${group.id}-${date}`,
                    date,
                    title: `Clase: ${group.name}`,
                    type: 'class',
                    color: 'bg-blue-200'
                });
            });
        });
        
        return allEvents
            .map(event => ({ ...event, eventDate: new Date(event.date + 'T00:00:00') }))
            .filter(event => event.eventDate >= today && event.eventDate <= nextWeek)
            .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime())
            .slice(0, 5);
    }, [calendarEvents, groups, settings]);
    
    const attendanceToday = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        let studentsWithClassToday = 0;
        let presentToday = 0;

        const todayDayOfWeek = new Date(todayStr + 'T00:00:00').getDay(); // 0=Sun, 1=Mon...
        const dayMap: { [key in DayOfWeek]: number } = {
            'Lunes': 1,
            'Martes': 2,
            'Miércoles': 3,
            'Jueves': 4,
            'Viernes': 5,
            'Sábado': 6
        };
        
        groups.forEach(group => {
            const hasClassToday = group.classDays.some(day => dayMap[day] === todayDayOfWeek);
            if (hasClassToday) {
                studentsWithClassToday += group.students.length;
                group.students.forEach(student => {
                    const status = attendance[group.id]?.[student.id]?.[todayStr];
                    if (status === 'Presente') {
                        presentToday++;
                    }
                });
            }
        });

        if (studentsWithClassToday === 0) return null;

        const percentage = (presentToday / studentsWithClassToday) * 100;
        return {
            total: studentsWithClassToday,
            present: presentToday,
            percentage: isNaN(percentage) ? 0 : percentage.toFixed(0),
        };

    }, [groups, attendance]);

    const dailyQuote = useMemo(() => {
        // Get a quote based on the day of the year, so it changes daily but is consistent.
        const start = new Date(new Date().getFullYear(), 0, 0);
        const diff = (new Date().getTime() - start.getTime()) + ((start.getTimezoneOffset() - new Date().getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    }, []);


    return (
        <div>
            <FridayCelebration show={isFriday} />
            <BirthdayCelebration name={birthdayPerson || ''} show={!!birthdayPerson} />
            <h1 className="text-3xl font-bold mb-6">Inicio</h1>
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ staggerChildren: 0.1 }}
            >
                {/* Stat Cards */}
                <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-full">
                        <Icon name="users" className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">Grupos Activos</p>
                        <p className="text-2xl font-bold">{stats.totalGroups}</p>
                    </div>
                </motion.div>
                <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center gap-4">
                     <div className="bg-green-100 dark:bg-green-500/20 p-3 rounded-full">
                        <Icon name="graduation-cap" className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-slate-500 dark:text-slate-400">Total de Alumnos</p>
                        <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    </div>
                </motion.div>
                 <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg col-span-1 sm:col-span-2 flex items-center gap-4">
                     <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-full">
                        <Icon name="check-square" className="w-6 h-6 text-blue-500" />
                    </div>
                    {attendanceToday ? (
                        <div className="flex-grow">
                            <div className="flex justify-between items-center">
                                <p className="text-slate-500 dark:text-slate-400">Asistencia de Hoy</p>
                                <p className="font-bold text-lg">{attendanceToday.percentage}%</p>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700 mt-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${attendanceToday.percentage}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 text-right">{attendanceToday.present} de {attendanceToday.total} alumnos presentes</p>
                        </div>
                    ) : (
                        <div>
                            <p className="text-slate-500 dark:text-slate-400">Asistencia de Hoy</p>
                            <p className="text-lg font-semibold">No hay clases programadas.</p>
                        </div>
                    )}
                </motion.div>

                {/* Upcoming Events */}
                <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg lg:col-span-2">
                    <h2 className="text-xl font-bold mb-4">Próximos 7 Días</h2>
                    {upcomingEvents.length > 0 ? (
                        <ul className="space-y-3">
                            {upcomingEvents.map(event => (
                                <li key={event.id} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <p className="font-bold text-indigo-500">{event.eventDate.toLocaleDateString('es-MX', { month: 'short' })}</p>
                                        <p className="text-2xl font-bold">{event.eventDate.getDate()}</p>
                                    </div>
                                    <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-4 py-1 flex-grow">
                                         <p className="font-semibold">{event.title}</p>
                                         <p className="text-sm text-slate-500">{event.eventDate.toLocaleDateString('es-MX', { weekday: 'long' })}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center py-8 text-slate-500">No hay eventos próximos.</p>
                    )}
                </motion.div>
                
                 {/* Quick Quote */}
                 <motion.div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg lg:col-span-2 flex flex-col justify-center items-center text-center">
                    {dailyQuote.image ? (
                        <img src={dailyQuote.image} alt={dailyQuote.author} className="w-16 h-16 rounded-full mb-4 object-cover border-2 border-slate-200 dark:border-slate-700" />
                    ) : (
                        <Icon name={dailyQuote.icon || 'quote'} className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4"/>
                    )}
                    <p className="text-lg italic text-slate-600 dark:text-slate-300">"{dailyQuote.text}"</p>
                    <p className="mt-2 font-semibold">- {dailyQuote.author}</p>
                </motion.div>

            </motion.div>
        </div>
    );
};

export default Dashboard;