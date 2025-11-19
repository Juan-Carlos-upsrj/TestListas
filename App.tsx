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
import UpdateNotification from './components/UpdateNotification';
import { PROFESSOR_BIRTHDAYS } from './constants';
import { motion } from 'framer-motion';
import Icon from './components/icons/Icon';
import BackgroundShapesV2 from './components/common/BackgroundShapesV2';

const App: React.FC = () => {
  const { state } = useContext(AppContext);
  const { settings } = state;
  const [isFriday, setIsFriday] = useState(false);
  const [isBirthday, setIsBirthday] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Theme management
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-classic', 'theme-custom');
    root.style.cssText = '';

    if (settings.theme === 'dark') {
      root.classList.add('dark');
    }
    root.classList.add('theme-classic');

  }, [settings.theme]);


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
    const timer = setInterval(checkDate, 60000);
    return () => clearInterval(timer);
  }, []);

  // Update listeners
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onUpdateDownloaded(() => {
        setUpdateAvailable(true);
      });
    }
  }, []);

  const handleUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.restartApp();
    }
  };


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
    <div className="flex h-screen bg-background text-text-primary font-sans relative">
      {(settings.theme === 'classic' || settings.theme === 'dark') && <BackgroundShapesV2 />}
      
      {updateAvailable && <UpdateNotification onUpdate={handleUpdate} />}
      
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
            <div className="flex items-center p-4 bg-surface/80 backdrop-blur-sm border-b border-border-color">
              <h1 className="text-2xl font-bold text-primary">
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