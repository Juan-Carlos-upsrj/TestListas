import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupManagement from './components/GroupManagement';
import AttendanceView from './components/AttendanceView';
import ReportsView from './components/ReportsView';
import GradesView from './components/GradesView';
import ToastContainer from './components/ToastContainer';
import CalendarView from './components/CalendarView';
import { PROFESSOR_BIRTHDAYS } from './constants';
import { motion } from 'framer-motion';
import Icon from './components/icons/Icon';

const BackgroundShapes: React.FC = () => (
  <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    <div className="absolute -top-32 -left-32 w-80 h-80 bg-iaev-red/25 rounded-full filter blur-3xl opacity-60 animate-float"></div>
    <div className="absolute top-10 left-0 w-96 h-80 bg-iaev-blue/25 rounded-[50%_60%_40%_70%_/_60%_50%_70%_40%] filter blur-3xl opacity-50 -rotate-12 animate-pulse"></div>
    <div className="absolute bottom-[-20rem] left-[-10rem] w-[40rem] h-[40rem] bg-iaev-teal/25 rounded-full filter blur-3xl opacity-60 animate-float [animation-delay:-3s]"></div>
    <div className="absolute top-[-15rem] right-[-15rem] w-[40rem] h-[40rem] bg-iaev-yellow/25 rounded-full filter blur-3xl opacity-70 animate-pulse [animation-delay:-5s]"></div>
    <div className="absolute top-1/2 right-10 w-24 h-24 bg-iaev-red/25 rounded-full filter blur-2xl opacity-60 animate-float [animation-delay:-2s]"></div>
    <div className="absolute bottom-10 right-20 w-96 h-80 bg-purple-500/15 rounded-[60%_40%_70%_30%_/_40%_70%_30%_60%] filter blur-3xl opacity-60 -rotate-45 animate-pulse [animation-delay:-1s]"></div>
  </div>
);


const App: React.FC = () => {
  const { state } = useContext(AppContext);
  const [isFriday, setIsFriday] = useState(false);
  const [isBirthday, setIsBirthday] = useState(false);

  useEffect(() => {
    const checkDate = () => {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const todayStr = `${month}-${day}`;
      const birthday = PROFESSOR_BIRTHDAYS.find(p => p.birthdate === todayStr);
      setIsBirthday(!!birthday);
      setIsFriday(today.getDay() === 5);
    };

    checkDate();
    const timer = setInterval(checkDate, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);


  const renderView = () => {
    switch (state.activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'groups':
        return <GroupManagement />;
      case 'attendance':
        return <AttendanceView />;
      case 'calendar':
        return <CalendarView />;
      case 'grades':
        return <GradesView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <Dashboard />;
    }
  };
  
  const viewTitles: { [key in typeof state.activeView]: string } = {
    dashboard: 'Inicio',
    groups: 'Grupos',
    attendance: 'Asistencia',
    calendar: 'Calendario',
    grades: 'Calificaciones',
    reports: 'Reportes',
  };

  const showFridayBanner = isFriday && !isBirthday;

  return (
    <div className="flex h-screen bg-iaev-background text-iaev-text-primary font-sans relative">
      <BackgroundShapes />
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        <header className="flex-shrink-0">
          {showFridayBanner ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
            >
              <Icon name="cake" className="w-8 h-8 mr-4 animate-pulse" />
              <div>
                <p className="font-bold text-lg">¡Es viernes!</p>
                <p>¡Ya casi es momento de descansar, suerte en el día!</p>
              </div>
            </motion.div>
          ) : (
            <div className="flex items-center p-4 bg-iaev-surface/80 backdrop-blur-sm border-b border-slate-900/10">
              <h1 className="text-2xl font-bold text-iaev-blue-darker">
                {viewTitles[state.activeView]}
              </h1>
            </div>
          )}
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {renderView()}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
};

export default App;