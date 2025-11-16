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
  const { groups, selectedGroupId } = state;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleNavClick = (view: View) => {
    dispatch({ type: 'SET_VIEW', payload: view });
  };
  
  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_SELECTED_GROUP', payload: e.target.value });
  };

  return (
    <>
      <aside className="w-64 bg-iaev-surface flex flex-col flex-shrink-0 z-20 border-r border-slate-900/10" aria-label="Barra lateral principal">
        <div className="p-4 border-b border-slate-900/10 flex items-center gap-3">
            <motion.img 
                src="logo.png" 
                alt="IAEV Logo" 
                className="w-10 h-10"
                animate={{ rotate: [0, 7, -7, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-iaev-blue-dark via-iaev-teal-dark to-iaev-blue-darker bg-[length:300%] animate-gradient-x">
                Gestión IAEV
            </h1>
        </div>
        
        {/* Global Group Selector */}
        <div className="p-4 border-b border-slate-900/10">
            <label htmlFor="globalGroupSelector" className="text-sm font-medium text-iaev-text-secondary mb-1 block">Grupo Activo</label>
            <select
                id="globalGroupSelector"
                value={selectedGroupId || ''}
                onChange={handleGroupChange}
                disabled={groups.length === 0}
                className="w-full p-2 border border-slate-300/70 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue disabled:opacity-50"
            >
                <option value="" disabled>{groups.length > 0 ? 'Seleccionar Grupo...' : 'No hay grupos'}</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
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
                  className={`flex items-center gap-3 px-4 py-2.5 my-1 rounded-lg text-base font-semibold transition-all duration-200 relative overflow-hidden ${
                    state.activeView === item.view
                      ? 'bg-iaev-blue-dark text-white shadow-lg shadow-iaev-blue/30'
                      : 'text-iaev-text-primary hover:bg-slate-200/60'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon name={item.icon} className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-900/10">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-iaev-text-primary hover:bg-slate-200/60 transition-colors duration-200"
          >
            <Icon name="settings" className="w-5 h-5" />
            <span className="text-base font-semibold">Configuración</span>
          </button>
        </div>
      </aside>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Sidebar;