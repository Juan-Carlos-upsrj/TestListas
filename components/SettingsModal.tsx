import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings, Group, Student } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import { GROUP_COLORS } from '../constants';
import { exportBackup, importBackup } from '../services/backupService';
import Icon from './icons/Icon';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useContext(AppContext);
    const [settings, setSettings] = useState<Settings>(state.settings);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleExport = () => {
        exportBackup(state);
        dispatch({ type: 'ADD_TOAST', payload: { message: 'Exportando datos...', type: 'info' } });
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (window.confirm('¿Estás seguro de que quieres importar este archivo? Todos los datos actuales se reemplazarán.')) {
                try {
                    const importedData = await importBackup(file);
                    dispatch({ type: 'SET_INITIAL_STATE', payload: importedData });
                    dispatch({ type: 'ADD_TOAST', payload: { message: 'Datos importados con éxito.', type: 'success' } });
                    onClose();
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al importar.';
                    dispatch({ type: 'ADD_TOAST', payload: { message: errorMessage, type: 'error' } });
                }
            }
        }
        // Reset file input value to allow re-uploading the same file
        if(fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleSyncData = async () => {
        const { apiUrl, apiKey, professorName } = settings;

        if (!apiUrl || !apiKey || !professorName || professorName === 'Nombre del Profesor') {
            dispatch({
                type: 'ADD_TOAST',
                payload: { message: 'Por favor, configura la URL, API Key y tu nombre de profesor antes de sincronizar.', type: 'error' }
            });
            return;
        }

        dispatch({ type: 'ADD_TOAST', payload: { message: 'Sincronizando datos...', type: 'info' } });

        const payload: any[] = [];
        // FIX: Filter groups to ensure they are valid objects with an 'id' before creating the map.
        // This prevents type errors if the state contains corrupted data (e.g., an empty object `{}`).
        const groupsMap = new Map(state.groups.filter(g => g && g.id).map(g => [g.id, g]));

        // FIX: Replaced nested for...of loops with .forEach to resolve complex type inference issues.
        // The original loops with Object.keys() were causing TypeScript to incorrectly infer 'group'
        // and 'student' as 'unknown' within the nested scopes. The .forEach() approach creates
        // clearer closures, helping the type checker correctly trace the types through the nested data structure.
        Object.keys(state.attendance).forEach(groupId => {
            const group: Group | undefined = groupsMap.get(groupId);
            if (!group) return;
            
            const studentAttendances = state.attendance[groupId];
            const studentsMap = new Map(group.students.map(s => [s.id, s]));
            
            Object.keys(studentAttendances).forEach(studentId => {
                const student: Student | undefined = studentsMap.get(studentId);
                if (!student) return;

                const dateAttendances = studentAttendances[studentId];
                Object.keys(dateAttendances).forEach(date => {
                    const status = dateAttendances[date];
                    payload.push({
                        profesor_nombre: settings.professorName,
                        materia_nombre: group.subject,
                        grupo_id: groupId,
                        grupo_nombre: group.name,
                        alumno_id: studentId,
                        alumno_nombre: student.name,
                        fecha: date,
                        status: status,
                    });
                });
            });
        });

        if (payload.length === 0) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'No hay datos de asistencia para sincronizar.', type: 'info' } });
            return;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiKey,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                dispatch({
                    type: 'ADD_TOAST',
                    payload: { message: `Datos sincronizados. (${data.registros_procesados} registros)`, type: 'success' }
                });
            } else {
                dispatch({
                    type: 'ADD_TOAST',
                    payload: { message: `Error del servidor: ${data.message || response.statusText}`, type: 'error' }
                });
            }
        } catch (error) {
            dispatch({
                type: 'ADD_TOAST',
                payload: { message: 'Error de red al sincronizar.', type: 'error' }
            });
        }
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
                    <legend className="px-2 font-semibold">Información del Docente</legend>
                    <div>
                        <label htmlFor="professorName" className="block text-sm font-medium">Nombre del Profesor/a</label>
                        <input
                            type="text"
                            id="professorName"
                            name="professorName"
                            value={settings.professorName}
                            onChange={handleChange}
                            placeholder="Ej. Prof. Juan Pérez"
                            className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">Este nombre aparecerá en los reportes generados.</p>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-lg dark:border-slate-600">
                    <legend className="px-2 font-semibold">Integración de Calendario</legend>
                    <div className="space-y-4">
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
                         <div>
                            <label className="block text-sm font-medium mb-2">Color para Eventos de Google Calendar</label>
                            <div className="flex flex-wrap gap-3">
                                {GROUP_COLORS.map(c => (
                                    <button
                                        type="button"
                                        key={c.name}
                                        onClick={() => setSettings(s => ({ ...s, googleCalendarColor: c.name }))}
                                        title={c.name}
                                        className={`w-8 h-8 rounded-full ${c.bg} transition-transform transform hover:scale-110 focus:outline-none ${settings.googleCalendarColor === c.name ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </fieldset>

                <fieldset className="border p-4 rounded-lg dark:border-slate-600">
                    <legend className="px-2 font-semibold">Sincronización con Servidor</legend>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="apiUrl" className="block text-sm font-medium">URL del API de Sincronización</label>
                            <input
                                type="url"
                                id="apiUrl"
                                name="apiUrl"
                                value={settings.apiUrl}
                                onChange={handleChange}
                                placeholder="https://api.ejemplo.com/asistencia"
                                className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium">Clave de API Secreta</label>
                            <input
                                type="password"
                                id="apiKey"
                                name="apiKey"
                                value={settings.apiKey}
                                onChange={handleChange}
                                placeholder="••••••••••••••••"
                                className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
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

                 <fieldset className="border p-4 rounded-lg dark:border-slate-600">
                    <legend className="px-2 font-semibold">Copia de Seguridad y Restauración</legend>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button variant="secondary" onClick={handleExport} className="w-full">
                            <Icon name="download-cloud" /> Exportar Datos
                        </Button>
                        <Button variant="secondary" onClick={handleImportClick} className="w-full">
                            <Icon name="upload-cloud" /> Importar Datos
                        </Button>
                        <Button variant="secondary" onClick={handleSyncData} className="w-full">
                            <Icon name="upload-cloud" /> Sincronizar Datos
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Guarda todos tus datos en un archivo seguro o restáuralos desde una copia anterior.
                        <strong className="dark:text-amber-300 text-amber-600"> Importante:</strong> Importar datos reemplazará toda la información actual.
                    </p>
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