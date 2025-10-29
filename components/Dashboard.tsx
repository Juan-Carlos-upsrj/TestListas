
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { MOTIVATIONAL_QUOTES, PROFESSORS, GRADE_DEADLINES } from '../constants';
import Icon from './icons/Icon';
import { motion } from 'framer-motion';
import { AttendanceStatus } from '../types';

const dayOfWeekMap: { [key: number]: string } = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

const Dashboard: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentDayName = dayOfWeekMap[today.getDay()];
  const dailyQuote = useMemo(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], []);

  const todayClasses = useMemo(() => {
    return state.groups.filter(group => group.classDays.includes(currentDayName as any));
  }, [state.groups, currentDayName]);

  const getGroupAttendancePercentage = (groupId: string): number => {
    const groupAttendance = state.attendance[groupId];
    if (!groupAttendance) return 100;

    let totalPresent = 0;
    let totalPossible = 0;

    for (const studentId in groupAttendance) {
        for (const date in groupAttendance[studentId]) {
            const status = groupAttendance[studentId][date];
            if (status !== AttendanceStatus.Exchange && status !== AttendanceStatus.Pending) {
                totalPossible++;
                if (status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified) {
                    totalPresent++;
                }
            }
        }
    }
    return totalPossible > 0 ? (totalPresent / totalPossible) * 100 : 100;
  };

  const upcomingBirthdays = useMemo(() => {
    return PROFESSORS.map(p => {
        const birthDate = new Date(p.birthdate);
        const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if(nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const diffDays = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return { ...p, diffDays, nextBirthday };
    }).filter(p => p.diffDays <= 30).sort((a,b) => a.diffDays - b.diffDays);
  }, []);

  const upcomingDeadlines = useMemo(() => {
      return Object.entries(GRADE_DEADLINES).map(([name, dateStr]) => {
          const deadline = new Date(dateStr + 'T23:59:59');
          if (deadline < today) return null;
          const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
          return { name, date: deadline, diffDays };
      }).filter(d => d && d.diffDays <= 14).sort((a,b) => a!.diffDays - b!.diffDays);
  }, []);

  const handleQuickAttendance = (groupId: string) => {
    dispatch({ type: 'QUICK_ATTENDANCE', payload: { groupId, date: todayStr }});
    dispatch({ type: 'ADD_TOAST', payload: { message: `Asistencia rápida aplicada para el grupo.`, type: 'success' } });
    dispatch({ type: 'SET_SELECTED_GROUP', payload: groupId });
    dispatch({ type: 'SET_VIEW', payload: 'attendance' });
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Inicio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Today's Classes */}
        <motion.div className="md:col-span-2 lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Icon name="calendar-check" className="text-indigo-500" />
            Clases de Hoy ({today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })})
          </h2>
          {todayClasses.length > 0 ? (
            <ul className="space-y-3">
              {todayClasses.map(group => (
                <li key={group.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-semibold">{group.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{group.subject}</p>
                  </div>
                  <button onClick={() => handleQuickAttendance(group.id)} className="px-3 py-1.5 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors">
                    Pase Rápido
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No hay clases programadas para hoy.</p>
          )}
        </motion.div>

        {/* Motivational Quote */}
        <motion.div className="p-6 bg-indigo-500 text-white rounded-xl shadow-lg flex flex-col justify-center items-center text-center"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Icon name="quote" className="w-12 h-12 opacity-30 mb-2" />
            <p className="text-lg italic">"{dailyQuote}"</p>
        </motion.div>

        {/* Attendance Summary */}
        <motion.div className="md:col-span-1 lg:col-span-1 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="pie-chart" className="text-indigo-500"/>
                Resumen de Asistencia
            </h2>
             {state.groups.length > 0 ? (
                 <ul className="space-y-3">
                    {state.groups.map(group => {
                        const percentage = getGroupAttendancePercentage(group.id);
                        const color = percentage >= 80 ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500';
                        return (
                            <li key={group.id} className="flex justify-between items-center">
                                <span>{group.name}</span>
                                <span className={`font-bold ${color}`}>{percentage.toFixed(1)}%</span>
                            </li>
                        );
                    })}
                </ul>
             ) : (
                 <p className="text-slate-500 dark:text-slate-400">No hay grupos para mostrar.</p>
             )}
        </motion.div>
        
        {/* Reminders */}
        <motion.div className="md:col-span-1 lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg"
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="bell" className="text-indigo-500"/>
                Recordatorios
            </h2>
            <div className="space-y-4">
                {upcomingBirthdays.length > 0 && (
                     <div>
                        <h3 className="font-semibold text-amber-500 mb-2">Próximos Cumpleaños</h3>
                        <ul className="space-y-2 text-sm">
                            {upcomingBirthdays.map(p => (
                                <li key={p.name} className="flex items-center gap-2">
                                    <Icon name="cake" className="w-4 h-4 text-pink-500"/>
                                    {p.name} - {p.nextBirthday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} ({p.diffDays === 0 ? "¡Hoy!" : `en ${p.diffDays} días`})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {upcomingDeadlines.length > 0 && (
                     <div>
                        <h3 className="font-semibold text-red-500 mb-2">Fechas Límite</h3>
                         <ul className="space-y-2 text-sm">
                            {upcomingDeadlines.map(d => d && (
                                <li key={d.name} className="flex items-center gap-2">
                                    <Icon name="alert-triangle" className="w-4 h-4 text-red-500"/>
                                    Entrega Calificaciones ({d.name}) - {d.date.toLocaleDateString('es-ES')} ({`en ${d.diffDays} días`})
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                 {upcomingBirthdays.length === 0 && upcomingDeadlines.length === 0 && (
                    <p className="text-slate-500 dark:text-slate-400">No hay recordatorios importantes.</p>
                 )}
            </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
