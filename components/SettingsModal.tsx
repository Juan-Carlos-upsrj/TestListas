import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useContext(AppContext);
    const [settings, setSettings] = useState<Settings>(state.settings);

    useEffect(() => {
        setSettings(state.settings);
    }, [state.settings, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let finalValue: string | number | boolean = value;
        if (type === 'checkbox') {
            finalValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            finalValue = Number(value);
        }
        
        setSettings(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSave = () => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Configuración guardada.', type: 'success' } });
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuración" size="lg">
            <div className="space-y-6">
                <fieldset className="border p-4 rounded-lg dark:border-slate-600">
                    <legend className="px-2 font-semibold">Periodo del Semestre</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium">Inicio del Semestre</label>
                            <input type="date" name="semesterStart" value={settings.semesterStart} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fin del Primer Parcial</label>
                            <input type="date" name="firstPartialEnd" value={settings.firstPartialEnd} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Fin del Semestre</label>
                            <input type="date" name="semesterEnd" value={settings.semesterEnd} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                        </div>
                    </div>
                </fieldset>
                
                <fieldset className="border p-4 rounded-lg dark:border-slate-600">
                    <legend className="px-2 font-semibold">Integración de Calendario</legend>
                    <div>
                        <label htmlFor="googleCalendarUrl" className="block text-sm font-medium">URL de Google Calendar (formato iCal público)</label>
                        <input
                            type="url"
                            id="googleCalendarUrl"
                            name="googleCalendarUrl"
                            value={settings.googleCalendarUrl}
                            onChange={handleChange}
                            placeholder="Pega aquí la dirección pública en formato iCal"
                            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Esto permitirá mostrar los eventos de tu calendario de Google directamente en la aplicación.</p>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-lg dark:border-slate-600">
                     <legend className="px-2 font-semibold">Visualización</legend>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="theme" className="font-medium">Tema de la Interfaz</label>
                             <div className="flex items-center gap-2">
                                 <span>Claro</span>
                                 <div onClick={() => setSettings(s => ({...s, theme: s.theme === 'light' ? 'dark' : 'light'}))} className={`relative inline-flex items-center h-6 rounded-full w-11 cursor-pointer transition-colors ${settings.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                     <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                                 </div>
                                  <span>Oscuro</span>
                             </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="showMatricula" className="font-medium">Mostrar Columna de Matrícula</label>
                            <input type="checkbox" id="showMatricula" name="showMatricula" checked={settings.showMatricula} onChange={handleChange} className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" />
                        </div>
                     </div>
                </fieldset>

                 <fieldset className="border p-4 rounded-lg dark:border-slate-600">
                     <legend className="px-2 font-semibold">Alertas</legend>
                      <div>
                            <label htmlFor="lowAttendanceThreshold" className="block text-sm font-medium">Umbral de Asistencia Baja (%)</label>
                            <input type="number" id="lowAttendanceThreshold" name="lowAttendanceThreshold" value={settings.lowAttendanceThreshold} onChange={handleChange} min="0" max="100" className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                            <p className="text-xs text-slate-500 mt-1">Se marcarán en reportes los alumnos con asistencia por debajo de este porcentaje.</p>
                      </div>
                 </fieldset>
            </div>
             <div className="flex justify-end gap-3 mt-8">
                <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar Cambios</Button>
            </div>
        </Modal>
    );
};

export default SettingsModal;