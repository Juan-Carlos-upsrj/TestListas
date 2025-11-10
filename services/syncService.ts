import { AppState, AppAction, Group, DayOfWeek } from '../types';
import { Dispatch } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { fetchHorarioCompleto } from './horarioService';
import { GROUP_COLORS } from '../constants';

export const syncAttendanceData = async (state: AppState, dispatch: Dispatch<AppAction>) => {
    const { settings, attendance, groups } = state;
    const { apiUrl, apiKey, professorName } = settings;

    if (!apiUrl || !apiKey || !professorName || professorName === 'Nombre del Profesor') {
        dispatch({
            type: 'ADD_TOAST',
            payload: { message: 'Por favor, configura la URL, API Key y tu nombre de profesor en Configuración.', type: 'error' }
        });
        return;
    }

    dispatch({ type: 'ADD_TOAST', payload: { message: 'Sincronizando asistencias...', type: 'info' } });

    const payload: any[] = [];
    const groupsMap = new Map(groups.filter(g => g && g.id).map(g => [g.id, g]));

    for (const [groupId, studentAttendances] of Object.entries(attendance)) {
        const group = groupsMap.get(groupId);
        if (!group) continue;

        const studentsMap = new Map((group.students || []).filter(s => s && s.id).map(s => [s.id, s]));

        for (const [studentId, dateAttendances] of Object.entries(studentAttendances)) {
            const student = studentsMap.get(studentId);
            if (!student) continue;

            for (const [date, status] of Object.entries(dateAttendances)) {
                payload.push({
                    profesor_nombre: professorName,
                    materia_nombre: group.subject,
                    grupo_id: groupId,
                    grupo_nombre: group.name,
                    alumno_id: studentId,
                    alumno_nombre: student.name,
                    fecha: date,
                    status: status,
                });
            }
        }
    }

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
                payload: { message: `Asistencias sincronizadas. (${data.registros_procesados} registros)`, type: 'success' }
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