import React, { useContext, useMemo, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { MOTIVATIONAL_QUOTES, PROFESSORS, GRADE_DEADLINES } from '../constants';
import Icon from './icons/Icon';
import { motion } from 'framer-motion';
import { AttendanceStatus, Group } from '../types';
import Modal from './common/Modal';
import AttendanceTaker from './AttendanceTaker';
import FridayCelebration from './FridayCelebration';
import BirthdayCelebration from './BirthdayCelebration';

const dayOfWeekMap: { [key: number]: string } = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

const Dashboard: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const today = useMemo(() => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
  }, []);
  const todayStr = today.toISOString().split('T')[0];
  const currentDayName = dayOfWeekMap[today.getDay()];
  const dailyQuote = useMemo(() => MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)], []);

  const [isTakerOpen, setTakerOpen] = useState(false);
  const [groupForTaker, setGroupForTaker] = useState<Group | null>(null);

  const todayClasses = useMemo(() => {
    return state.groups.filter(group => group.classDays.includes(currentDayName as any));
  }, [state.groups, currentDayName]);

  const futureClasses = useMemo(() => {
      const getClassesForDate = (date: Date) => {
        const dayName = dayOfWeekMap[date.getDay()];
        return state.groups.filter(group => group.classDays.includes(dayName as any));
    };
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowClasses = getClassesForDate(tomorrow);

    let nextAvailable: { date: Date, classes: Group[] } | null = null;
    if (state.groups.length > 0) {
        let nextDate = new Date(tomorrow);
        for (let i = 0; i < 365; i++) { // Search up to a year ahead
            nextDate.setDate(nextDate.getDate() + 1);
            const nextClasses = getClassesForDate(nextDate);
            if (nextClasses.length > 0) {
                nextAvailable = { date: nextDate, classes: nextClasses };
                break;
            }
        }
    }
    
    return { tomorrow: tomorrowClasses, nextAvailable };
  }, [state.groups, today]);

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
        const [month, day] = p.birthdate.split('-').map(Number);
        // month - 1 because Date constructor months are 0-indexed
        const nextBirthday = new Date(today.getFullYear(), month - 1, day);
        if (nextBirthday < today) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        const diffDays = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return { ...p, diffDays, nextBirthday };
    }).filter(p => p.diffDays <= 30).sort((a, b) => a.diffDays - b.diffDays);
  }, [today]);

  const todayBirthdayProf = useMemo(() => upcomingBirthdays.find(p => p.diffDays === 0), [upcomingBirthdays]);
  const [showBirthday, setShowBirthday] = useState(false);
  useEffect(() => {
      if (todayBirthdayProf) {
          setShowBirthday(true);
          const timer = setTimeout(() => setShowBirthday(false), 7000); // Show for 7 seconds
          return () => clearTimeout(timer);
      }
  }, [todayBirthdayProf]);


  const [showFriday, setShowFriday] = useState(false);
  useEffect(() => {
    if (today.getDay() === 5) { // Friday
        setShowFriday(true);
        const timer = setTimeout(() => setShowFriday(false), 6000); // Show for 6 seconds
        return () => clearTimeout(timer);
    }
  }, [today]);

  const upcomingDeadlines = useMemo(() => {
      return Object.entries(GRADE_DEADLINES).map(([name, dateStr]) => {
          const deadline = new Date(dateStr + 'T23:59:59');
          if (deadline < today) return null;
          const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
          return { name, date: deadline, diffDays };
      }).filter(d => d && d.diffDays <= 14).sort((a,b) => a!.diffDays - b!.diffDays);
  }, [today]);

  const handleQuickAttendance = (group: Group) => {
    setGroupForTaker(group);
    setTakerOpen(true);
  }

  const handleTakerStatusChange = (studentId: string, status: AttendanceStatus) => {
      if(groupForTaker) {
          dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: groupForTaker.id, studentId, date: todayStr, status } });
      }
  };

  const ClassCard: React.FC<{group: Group, isInteractive?: boolean}> = ({ group, isInteractive = false }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${isInteractive ? 'bg-slate-50 dark:bg-slate-700/50' : 'bg-slate-100 dark:bg-slate-700/30'}`}>
        <div>
            <p className="font-semibold">{group.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{group.subject}</p>
        </div>
        {isInteractive && (
             <button onClick={() => handleQuickAttendance(group)} className="px-3 py-1.5 text-sm font-semibold text-white bg-green-500 rounded-md hover:bg-green-600 transition-colors">
                Pase Rápido
            </button>
        )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <FridayCelebration show={showFriday} />
      {todayBirthdayProf && <BirthdayCelebration name={todayBirthdayProf.name} show={showBirthday} />}

      <h1 className="text-3xl font-bold mb-6 text-slate-800 dark:text-white">Inicio</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <motion.div className="md:col-span-2 lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg space-y-6"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Icon name="calendar-check" className="text-indigo-500" />
                Clases de Hoy ({today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })})
              </h2>
              {todayClasses.length > 0 ? (
                <ul className="space-y-3">
                  {todayClasses.map(group => <li key={group.id}><ClassCard group={group} isInteractive={true} /></li>)}
                </ul>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No hay clases programadas para hoy.</p>
              )}
            </div>
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Icon name="arrow-right" className="text-slate-500" />
                    Próximas Clases
                </h2>
                {futureClasses.tomorrow.length > 0 ? (
                    <>
                        <h3 className="font-semibold mb-2">Mañana</h3>
                        <ul className="space-y-3">
                            {futureClasses.tomorrow.map(group => <li key={group.id}><ClassCard group={group}/></li>)}
                        </ul>
                    </>
                ) : futureClasses.nextAvailable ? (
                    <>
                        <h3 className="font-semibold mb-2">
                            Próxima clase: {futureClasses.nextAvailable.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                         <ul className="space-y-3">
                            {futureClasses.nextAvailable.classes.map(group => <li key={group.id}><ClassCard group={group}/></li>)}
                        </ul>
                    </>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400">No hay más clases programadas.</p>
                )}
            </div>
        </motion.div>

        <motion.div className="p-6 bg-indigo-500 text-white rounded-xl shadow-lg flex flex-col justify-center items-center text-center"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <Icon name="quote" className="w-12 h-12 opacity-30 mb-2" />
            <p className="text-lg italic">"{dailyQuote}"</p>
        </motion.div>

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
                        const color = percentage >= state.settings.lowAttendanceThreshold ? 'text-green-500' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500';
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
                                <li key={p.name} className={`flex items-center gap-2 p-1 rounded ${p.diffDays === 0 ? 'bg-pink-100 dark:bg-pink-900/50' : ''}`}>
                                    <Icon name="cake" className="w-4 h-4 text-pink-500"/>
                                    {p.name} - {p.nextBirthday.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} 
                                    <span className="font-bold">{p.diffDays === 0 ? "¡Hoy!" : `(en ${p.diffDays} días)`}</span>
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
      {groupForTaker && (
          <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${groupForTaker.name}`}>
              <AttendanceTaker 
                  students={groupForTaker.students}
                  date={todayStr}
                  groupAttendance={state.attendance[groupForTaker.id] || {}}
                  onStatusChange={handleTakerStatusChange}
                  onClose={() => setTakerOpen(false)}
              />
          </Modal>
      )}
    </motion.div>
  );
};

export default Dashboard;