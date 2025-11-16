import { AppState, AppAction, Group, DayOfWeek, Settings } from '../types';
import { Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchHorarioCompleto } from './horarioService';
import { GROUP_COLORS } from '../constants';

const checkSettings = (settings: AppState['settings'], dispatch: Dispatch<AppAction>): boolean => {
    const { apiUrl, apiKey, professorName } = settings;
    if (!apiUrl || !apiKey || !professorName || professorName === 'Nombre del Profesor') {
        dispatch({
            type: 'ADD_TOAST',
            payload: { message: 'Por favor, configura la URL, API Key y tu nombre de profesor en Configuración.', type: 'error' }
        });
        return false;
    }
    return true;
};

export const syncAttendanceData = async (state: AppState, dispatch: Dispatch<AppAction>) => {
    if (!checkSettings(state.settings, dispatch)) return;

    const { settings, attendance, groups } = state;
    const { apiUrl, apiKey, professorName } = settings;

    dispatch({ type: 'ADD_TOAST', payload: { message: 'Comparando datos con el servidor...', type: 'info' } });

    try {
        // 1. Obtener los registros existentes del servidor
        const fetchUrl = new URL(apiUrl);
        fetchUrl.searchParams.append('profesor_nombre', professorName);

        const serverResponse = await fetch(fetchUrl.toString(), {
            method: 'GET',
            headers: { 'X-API-KEY': apiKey },
        });

        if (!serverResponse.ok) {
            const errorData = await serverResponse.json().catch(() => ({ message: serverResponse.statusText }));
            throw new Error(`Error al obtener datos del servidor: ${errorData.message}`);
        }
        
        const serverRecords: any[] = await serverResponse.json();
        
        // 2. Crear un mapa para una búsqueda eficiente
        const serverRecordsMap = new Map<string, string>(); // Key: 'alumno_id-fecha', Value: 'status'
        serverRecords.forEach(rec => {
            if (rec.alumno_id && rec.fecha) {
                serverRecordsMap.set(`${rec.alumno_id}-${rec.fecha}`, rec.status);
            }
        });

        // 3. Comparar y encontrar diferencias
        const recordsToSync: any[] = [];
        const groupsMap = new Map(groups.map(g => [g.id, g]));

        for (const [groupId, studentAttendances] of Object.entries(attendance)) {
            const group = groupsMap.get(groupId);
            if (!group) continue;
            const studentsMap = new Map(group.students.map(s => [s.id, s]));

            for (const [studentId, dateAttendances] of Object.entries(studentAttendances)) {
                const student = studentsMap.get(studentId);
                if (!student) continue;

                for (const [date, localStatus] of Object.entries(dateAttendances)) {
                    const key = `${studentId}-${date}`;
                    const serverStatus = serverRecordsMap.get(key);

                    // Sincronizar si el registro es nuevo O si el estado ha cambiado
                    if (!serverStatus || serverStatus !== localStatus) {
                        recordsToSync.push({
                            profesor_nombre: professorName,
                            materia_nombre: group.subject,
                            grupo_id: groupId,
                            grupo_nombre: group.name,
                            alumno_id: studentId,
                            alumno_nombre: student.name,
                            fecha: date,
                            status: localStatus,
                        });
                    }
                }
            }
        }

        // 4. Enviar solo las diferencias
        if (recordsToSync.length === 0) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Tus datos ya están actualizados.', type: 'info' } });
            return;
        }

        dispatch({ type: 'ADD_TOAST', payload: { message: `Subiendo ${recordsToSync.length} registros nuevos o modificados...`, type: 'info' } });

        const syncResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
            body: JSON.stringify(recordsToSync),
        });
        
        const responseData = await syncResponse.json();

        if (syncResponse.ok) {
            dispatch({
                type: 'ADD_TOAST',
                payload: { message: `Sincronización completa. (${responseData.registros_procesados} registros)`, type: 'success' }
            });
        } else {
             throw new Error(responseData.message || `Error del servidor: ${syncResponse.statusText}`);
        }

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error de red al sincronizar.';
        dispatch({ type: 'ADD_TOAST', payload: { message: msg, type: 'error' } });
    }
};

export const syncScheduleData = async (state: AppState, dispatch: Dispatch<AppAction>) => {
    const { settings, groups } = state;
    if (!settings.professorName || settings.professorName === 'Nombre del Profesor') {
        dispatch({
            type: 'ADD_TOAST',
            payload: { message: 'Por favor, configura tu "Nombre del Profesor/a" en Configuración antes de sincronizar.', type: 'error' }
        });
        return;
    }

    dispatch({ type: 'ADD_TOAST', payload: { message: 'Sincronizando horario desde Firebase...', type: 'info' } });

    try {
        const horario = await fetchHorarioCompleto(settings.professorName);

        if (horario.length === 0) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'No se encontraron clases para este profesor.', type: 'info' } });
            return;
        }

        let gruposCreados = 0;
        let gruposActualizados = 0;

        // A teacher can teach multiple subjects to the same group.
        // We need to create a unique group in the app for each combination of [group name + subject name].
        const clasesPorGrupoUnico: { [uniqueName: string]: { subjectName: string; days: string[] } } = {};

        horario.forEach(clase => {
            // The unique key for a class is its group name combined with the subject name.
            const uniqueGroupName = `${clase.groupName} - ${clase.subjectName}`;

            if (!clasesPorGrupoUnico[uniqueGroupName]) {
                clasesPorGrupoUnico[uniqueGroupName] = {
                    subjectName: clase.subjectName,
                    days: [],
                };
            }
            // Add the day to this unique group if it's not already there.
            if (!clasesPorGrupoUnico[uniqueGroupName].days.includes(clase.day)) {
                clasesPorGrupoUnico[uniqueGroupName].days.push(clase.day);
            }
        });
        
        for (const uniqueGroupName of Object.keys(clasesPorGrupoUnico)) {
            const info = clasesPorGrupoUnico[uniqueGroupName];
            const diasDeClase = info.days;
            
            // Check if a group with this exact unique name already exists.
            const grupoExistente = groups.find(g => g.name.toLowerCase() === uniqueGroupName.toLowerCase());

            if (grupoExistente) {
                // If it exists, update its schedule.
                dispatch({
                    type: 'SAVE_GROUP',
                    payload: { ...grupoExistente, classDays: diasDeClase as DayOfWeek[] }
                });
                gruposActualizados++;
            } else {
                // If not, create a new group.
                const nuevoGrupo: Group = {
                    id: uuidv4(),
                    name: uniqueGroupName, // e.g., "6A - Cálculo"
                    subject: info.subjectName,
                    classDays: diasDeClase as DayOfWeek[],
                    students: [],
                    color: GROUP_COLORS[(groups.length + gruposCreados) % GROUP_COLORS.length].name
                };
                dispatch({ type: 'SAVE_GROUP', payload: nuevoGrupo });
                gruposCreados++;
            }
        }

        dispatch({ type: 'ADD_TOAST', payload: { message: `¡Horario sincronizado! ${gruposCreados} grupos creados, ${gruposActualizados} actualizados.`, type: 'success' } });

    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido al sincronizar.';
        dispatch({ type: 'ADD_TOAST', payload: { message: msg, type: 'error' } });
    }
};


// --- Funciones para Sincronización Personalizada ---

export const uploadStateToCloud = async (state: AppState, dispatch: Dispatch<AppAction>) => {
    if (!checkSettings(state.settings, dispatch)) return;
    
    const { settings } = state;
    const { apiUrl, apiKey, professorName } = settings;

    dispatch({ type: 'ADD_TOAST', payload: { message: 'Subiendo copia de seguridad a la nube...', type: 'info' } });

    const stateToSave = { ...state, toasts: [] };
    const payload = {
        profesor_nombre: professorName,
        estado: stateToSave
    };

    try {
        const url = new URL(apiUrl);
        url.searchParams.append('action', 'backup-estado');

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiKey,
            },
            body: JSON.stringify(payload),
        });
        
        const data = await response.json();

        if (response.ok) {
            dispatch({ type: 'ADD_TOAST', payload: { message: 'Copia de seguridad subida con éxito.', type: 'success' } });
        } else {
            throw new Error(data.message || `Error del servidor: ${response.statusText}`);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error de red al subir la copia.';
        dispatch({ type: 'ADD_TOAST', payload: { message: msg, type: 'error' } });
    }
};

export const fetchStateFromCloud = async (settings: Settings): Promise<Partial<AppState> | null> => {
    const { apiUrl, apiKey, professorName } = settings;
    if (!apiUrl || !apiKey || !professorName || professorName === 'Nombre del Profesor') {
        throw new Error('La configuración de API y profesor es necesaria.');
    }

    try {
        const url = new URL(apiUrl);
        url.searchParams.append('action', 'backup-estado');
        url.searchParams.append('profesor_nombre', professorName);
        
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'X-API-KEY': apiKey,
            },
        });

        const data = await response.json();

        if (response.ok) {
            if (data && data.estado) {
                return data.estado as Partial<AppState>;
            }
            throw new Error('No se encontraron datos en la nube para este usuario.');
        } else {
            throw new Error(data.message || `Error del servidor: ${response.statusText}`);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error de red al descargar la copia.';
        throw new Error(msg);
    }
};