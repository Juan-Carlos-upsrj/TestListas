import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Settings, AppState } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import { GROUP_COLORS } from '../constants';
import { exportBackup, importBackup } from '../services/backupService';
import Icon from './icons/Icon';
import { syncAttendanceData, syncScheduleData, uploadStateToCloud, fetchStateFromCloud } from '../services/syncService';
import ConfirmationModal from './common/ConfirmationModal';


interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { state, dispatch } = useContext(AppContext);
    const [settings, setSettings] = useState<Settings>(state.settings);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCloudConfirmOpen, setCloudConfirmOpen] = useState(false);
    const [cloudDataToLoad, setCloudDataToLoad] = useState<Partial<AppState> | null>(null);

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
    
    const handleUploadCloudBackup = async () => {
        setIsUploading(true);
        await uploadStateToCloud(state, dispatch);
        setIsUploading(false);
    };

    const handleDownloadCloudBackup = async () => {
        setIsDownloading(true);
        try {
            const data = await fetchStateFromCloud(state.settings);
            if (data) {
                setCloudDataToLoad(data);
                setCloudConfirmOpen(true);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido al descargar.';
            dispatch({ type: 'ADD_TOAST', payload: { message: errorMessage, type: 'error' } });
        } finally {
            setIsDownloading(false);
        }
    };

    const executeCloudImport = () => {
        if (cloudDataToLoad) {
            dispatch({ type: 'SET_INITIAL_STATE', payload: cloudDataToLoad });
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Datos descargados y aplicados con éxito.', type: 'success' } });
        }
        setCloudConfirmOpen(false);
        setCloudDataToLoad(null);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Configuración" size="lg">
                <div className="space-y-6">
                    <fieldset className="border p-4 rounded-lg border-slate-200">
                        <legend className="px-2 font-semibold">Periodo del Semestre</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Inicio del Semestre</label>
                                <input type="date" name="semesterStart" value={settings.semesterStart} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Fin del Primer Parcial</label>
                                <input type="date" name="firstPartialEnd" value={settings.firstPartialEnd} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Fin del Semestre</label>
                                <input type="date" name="semesterEnd" value={settings.semesterEnd} onChange={handleChange} className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue" />
                            </div>
                        </div>
                    </fieldset>
                    
                     <fieldset className="border p-4 rounded-lg border-slate-200">
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
                                className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue"
                            />
                            <p className="text-xs text-iaev-text-secondary mt-1">Este nombre aparecerá en los reportes generados y se usará para la sincronización de horarios.</p>
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-lg border-slate-200">
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
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue"
                                />
                                <p className="text-xs text-iaev-text-secondary mt-1">Esto permitirá mostrar los eventos de tu calendario de Google directamente en la aplicación.</p>
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
                                            className={`w-8 h-8 rounded-full ${c.bg} transition-transform transform hover:scale-110 focus:outline-none ${settings.googleCalendarColor === c.name ? 'ring-2 ring-offset-2 ring-iaev-blue ring-offset-iaev-surface' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-lg border-slate-200">
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
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue"
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
                                    className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue"
                                />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset className="border p-4 rounded-lg border-slate-200">
                         <legend className="px-2 font-semibold">Visualización</legend>
                         <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label htmlFor="showMatricula" className="font-medium">Mostrar Columna de Matrícula</label>
                                <input type="checkbox" id="showMatricula" name="showMatricula" checked={settings.showMatricula} onChange={handleChange} className="h-5 w-5 rounded text-iaev-blue focus:ring-iaev-blue" />
                            </div>
                         </div>
                    </fieldset>

                     <fieldset className="border p-4 rounded-lg border-slate-200">
                         <legend className="px-2 font-semibold">Alertas</legend>
                          <div>
                                <label htmlFor="lowAttendanceThreshold" className="block text-sm font-medium">Umbral de Asistencia Baja (%)</label>
                                <input type="number" id="lowAttendanceThreshold" name="lowAttendanceThreshold" value={settings.lowAttendanceThreshold} onChange={handleChange} min="0" max="100" className="mt-1 w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue" />
                                <p className="text-xs text-iaev-text-secondary mt-1">Se marcarán en reportes los alumnos con asistencia por debajo de este porcentaje.</p>
                          </div>
                     </fieldset>

                     <fieldset className="border p-4 rounded-lg border-slate-200">
                        <legend className="px-2 font-semibold">Datos y Sincronización</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="secondary" onClick={handleExport} className="w-full">
                                <Icon name="download-cloud" /> Exportar Respaldo
                            </Button>
                            <Button variant="secondary" onClick={handleImportClick} className="w-full">
                                <Icon name="upload-cloud" /> Importar Respaldo
                            </Button>
                            <Button variant="secondary" onClick={() => syncAttendanceData(state, dispatch)} className="w-full">
                                <Icon name="upload-cloud" /> Subir Asistencias
                            </Button>
                            <Button variant="secondary" onClick={() => syncScheduleData(state, dispatch)} className="w-full !bg-iaev-blue hover:!bg-iaev-blue-dark text-white">
                                <Icon name="download-cloud" /> Actualizar Horario
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json"
                                className="hidden"
                            />
                        </div>
                        <p className="text-xs text-iaev-text-secondary mt-2">
                            <strong className="text-iaev-yellow-dark">Importante:</strong> Importar un respaldo reemplazará toda la información actual. Sincronizar el horario agregará o actualizará grupos sin borrar los existentes.
                        </p>
                    </fieldset>
                    
                    {settings.professorName === 'Juan Carlos S.R' && (
                        <fieldset className="border p-4 rounded-lg border-iaev-yellow">
                            <legend className="px-2 font-semibold text-iaev-yellow-dark">Sincronización Personalizada</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="secondary" onClick={handleUploadCloudBackup} disabled={isUploading || isDownloading} className="w-full">
                                    {isUploading ? 'Subiendo...' : <><Icon name="upload-cloud" /> Subir Copia a la Nube</>}
                                </Button>
                                <Button variant="secondary" onClick={handleDownloadCloudBackup} disabled={isUploading || isDownloading} className="w-full">
                                    {isDownloading ? 'Descargando...' : <><Icon name="download-cloud" /> Descargar Copia de la Nube</>}
                                </Button>
                            </div>
                            <p className="text-xs text-iaev-text-secondary mt-2">
                                <strong className="text-iaev-yellow-dark">Exclusivo:</strong> Estas opciones te permiten guardar y cargar una copia completa de tus datos en la nube para sincronizar entre dispositivos.
                            </p>
                        </fieldset>
                    )}
                </div>
                 <div className="flex justify-end gap-3 mt-8">
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Guardar Cambios</Button>
                </div>
            </Modal>
            <ConfirmationModal
                isOpen={isCloudConfirmOpen}
                onClose={() => setCloudConfirmOpen(false)}
                onConfirm={executeCloudImport}
                title="Confirmar Descarga"
                confirmText="Sí, reemplazar"
                variant="danger"
            >
                <p>
                    Has descargado una copia de seguridad de la nube.
                </p>
                <p className="font-bold mt-2">
                    Esto reemplazará TODOS tus datos locales actuales.
                </p>
                <p className="mt-2">¿Estás seguro de que deseas continuar?</p>
            </ConfirmationModal>
        </>
    );
};

export default SettingsModal;