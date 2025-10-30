

import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import SettingsModal from './SettingsModal';
import Icon from './icons/Icon';
import { motion } from 'framer-motion';
import { ActiveView } from '../types';

type View = ActiveView;

const navItems: { view: View; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Inicio', icon: 'home' },
  { view: 'groups', label: 'Grupos', icon: 'users' },
  { view: 'attendance', label: 'Asistencia', icon: 'check-square' },
  { view: 'calendar', label: 'Calendario', icon: 'calendar' },
  { view: 'grades', label: 'Calificaciones', icon: 'graduation-cap' },
  { view: 'reports', label: 'Reportes', icon: 'bar-chart-3' },
];

const Sidebar: React.FC = () => {
  const { state, dispatch } = useContext(AppContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNavClick = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };

  return (
    <>
      <aside className="w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col transition-colors duration-300">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
          <img src="/logo.png" alt="Logo de la Aplicación" className="w-8 h-8" />
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Gestión Académica</h1>
        </div>
        <nav className="flex-grow p-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.view}>
                <motion.a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(item.view);
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 my-1 rounded-lg text-lg font-medium transition-all duration-200 ${
                    state.activeView === item.view
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon name={item.icon} className="w-6 h-6" />
                  <span>{item.label}</span>
                </motion.a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-200"
          >
            <Icon name="settings" className="w-6 h-6" />
            <span className="text-lg font-medium">Configuración</span>
          </button>
        </div>
      </aside>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Sidebar;