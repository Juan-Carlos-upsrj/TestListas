import React, { useContext, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupManagement from './components/GroupManagement';
import AttendanceView from './components/AttendanceView';
import ReportsView from './components/ReportsView';
import GradesView from './components/GradesView';
import ToastContainer from './components/ToastContainer';
import CalendarView from './components/CalendarView';

const App: React.FC = () => {
  const { state } = useContext(AppContext);

  useEffect(() => {
    if (state.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings.theme]);

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


  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop Header */}
        <header className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm flex-shrink-0">
          <h1 className="text-2xl font-bold">
            {viewTitles[state.activeView]}
          </h1>
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
