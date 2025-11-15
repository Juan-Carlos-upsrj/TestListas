import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GroupManagement from './components/GroupManagement';
import AttendanceView from './components/AttendanceView';
import ReportsView from './components/ReportsView';
import GradesView from './components/GradesView';
import ToastContainer from './components/ToastContainer';
import CalendarView from './components/CalendarView';

const BackgroundShapes: React.FC = () => (
  <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
    {/* Top-left coral circle */}
    <div className="absolute -top-32 -left-32 w-80 h-80 bg-iaev-red/20 rounded-full filter blur-3xl opacity-50"></div>
    {/* Top-left blue shape */}
    <div className="absolute top-10 left-0 w-96 h-80 bg-iaev-blue/20 rounded-[50%_60%_40%_70%_/_60%_50%_70%_40%] filter blur-3xl opacity-40 -rotate-12"></div>
    {/* Bottom-left teal shape */}
    <div className="absolute bottom-[-20rem] left-[-10rem] w-[40rem] h-[40rem] bg-iaev-teal/20 rounded-full filter blur-3xl opacity-50"></div>
    {/* Top-right yellow shape */}
    <div className="absolute top-[-15rem] right-[-15rem] w-[40rem] h-[40rem] bg-iaev-yellow/20 rounded-full filter blur-3xl opacity-60"></div>
     {/* Right-middle red circle */}
    <div className="absolute top-1/2 right-10 w-24 h-24 bg-iaev-red/20 rounded-full filter blur-2xl opacity-50"></div>
  </div>
);


const App: React.FC = () => {
  const { state } = useContext(AppContext);

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
    <div className="flex h-screen bg-iaev-background text-iaev-text-primary font-sans relative">
      <BackgroundShapes />
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden z-10">
        <header className="flex items-center p-4 bg-iaev-surface/80 backdrop-blur-sm border-b border-slate-900/10 flex-shrink-0">
          <h1 className="text-2xl font-bold text-iaev-blue-darker">
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