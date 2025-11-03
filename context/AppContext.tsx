import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useState } from 'react';
import { AppState, AppAction, AttendanceStatus, Group, Evaluation } from '../types';
import { GROUP_COLORS } from '../constants';
import { getState, saveState } from '../services/dbService';

const today = new Date();
const nextMonth = new Date();
nextMonth.setMonth(today.getMonth() + 1);
const fourMonthsLater = new Date();
fourMonthsLater.setMonth(today.getMonth() + 4);

const defaultState: AppState = {
  groups: [],
  attendance: {},
  evaluations: {},
  grades: {},
  calendarEvents: [],
  settings: {
    semesterStart: today.toISOString().split('T')[0],
    firstPartialEnd: nextMonth.toISOString().split('T')[0],
    semesterEnd: fourMonthsLater.toISOString().split('T')[0],
    showMatricula: true,
    theme: 'light',
    lowAttendanceThreshold: 80,
    googleCalendarUrl: '',
    googleCalendarColor: 'amber',
    professorName: 'Nombre del Profesor',
  },
  activeView: 'dashboard',
  selectedGroupId: null,
  toasts: [],
  dashboardLayouts: {},
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_STATE': {
        const loadedState = action.payload || {};
        
        // Data migration: Ensure all groups have a color property for backward compatibility.
        const loadedGroups: Group[] = loadedState.groups || [];
        const migratedGroups = loadedGroups.map((group, index) => ({
            ...group,
            color: group.color || GROUP_COLORS[index % GROUP_COLORS.length].name,
        }));

        // Data migration: Ensure all evaluations have a partial property.
        const loadedEvaluations = loadedState.evaluations || {};
        const migratedEvaluations: AppState['evaluations'] = {};
        Object.keys(loadedEvaluations).forEach(groupId => {
            migratedEvaluations[groupId] = (loadedEvaluations[groupId] || []).map((ev: Evaluation) => ({
                ...ev,
                partial: ev.partial || 1, // Default existing evals to partial 1
            }));
        });

        return {
            ...defaultState,
            ...loadedState,
            groups: migratedGroups,
            attendance: loadedState.attendance || defaultState.attendance,
            evaluations: migratedEvaluations,
            grades: loadedState.grades || defaultState.grades,
            calendarEvents: loadedState.calendarEvents || defaultState.calendarEvents,
            dashboardLayouts: loadedState.dashboardLayouts || defaultState.dashboardLayouts,
            toasts: [], // Do not persist toasts
            settings: {
                ...defaultState.settings,
                ...(loadedState.settings || {}),
            },
        };
    }
    case 'SET_VIEW':
      return { ...state, activeView: action.payload };
    case 'SET_SELECTED_GROUP':
      return { ...state, selectedGroupId: action.payload };
    case 'SAVE_GROUP': {
      const existingGroup = state.groups.find(g => g.id === action.payload.id);
      if (existingGroup) {
        return {
          ...state,
          groups: state.groups.map(g => g.id === action.payload.id ? action.payload : g),
        };
      }
      // Assign a color to a new group
      const newGroup = {
        ...action.payload,
        color: action.payload.color || GROUP_COLORS[state.groups.length % GROUP_COLORS.length].name,
      };
      return { ...state, groups: [...state.groups, newGroup] };
    }
    case 'DELETE_GROUP': {
        const newGroups = state.groups.filter(g => g.id !== action.payload);
        const newAttendance = {...state.attendance};
        delete newAttendance[action.payload];
        const newEvaluations = {...state.evaluations};
        delete newEvaluations[action.payload];
        const newGrades = {...state.grades};
        delete newGrades[action.payload];
        return {
            ...state,
            groups: newGroups,
            attendance: newAttendance,
            evaluations: newEvaluations,
            grades: newGrades,
            selectedGroupId: state.selectedGroupId === action.payload ? null : state.selectedGroupId,
        };
    }
    case 'SAVE_STUDENT': {
      const { groupId, student } = action.payload;
      return {
        ...state,
        groups: state.groups.map(g => {
          if (g.id === groupId) {
            const studentExists = g.students.some(s => s.id === student.id);
            if (studentExists) {
              return { ...g, students: g.students.map(s => s.id === student.id ? student : s) };
            }
            return { ...g, students: [...g.students, student] };
          }
          return g;
        }),
      };
    }
    case 'BULK_ADD_STUDENTS': {
        const { groupId, students } = action.payload;
        return {
            ...state,
            groups: state.groups.map(g => {
                if (g.id === groupId) {
                    return { ...g, students: [...g.students, ...students] };
                }
                return g;
            }),
        };
    }
    case 'DELETE_STUDENT': {
        const { groupId, studentId } = action.payload;
        const newGrades = {...state.grades};
        if(newGrades[groupId]) {
            delete newGrades[groupId][studentId];
        }
        return {
            ...state,
            grades: newGrades,
            groups: state.groups.map(g => {
                if (g.id === groupId) {
                    return { ...g, students: g.students.filter(s => s.id !== studentId) };
                }
                return g;
            }),
        };
    }
    case 'UPDATE_ATTENDANCE': {
        const { groupId, studentId, date, status } = action.payload;
        const groupAttendance = state.attendance[groupId] || {};
        const studentAttendance = groupAttendance[studentId] || {};
        return {
            ...state,
            attendance: {
                ...state.attendance,
                [groupId]: {
                    ...groupAttendance,
                    [studentId]: {
                        ...studentAttendance,
                        [date]: status,
                    },
                },
            },
        };
    }
    case 'QUICK_ATTENDANCE': {
        const { groupId, date } = action.payload;
        const group = state.groups.find(g => g.id === groupId);
        if (!group) return state;

        const updatedAttendance = { ...state.attendance[groupId] };
        group.students.forEach(student => {
            const currentStatus = updatedAttendance[student.id]?.[date];
            if (!currentStatus || currentStatus === AttendanceStatus.Pending) {
                if (!updatedAttendance[student.id]) {
                    updatedAttendance[student.id] = {};
                }
                updatedAttendance[student.id][date] = AttendanceStatus.Present;
            }
        });

        return {
            ...state,
            attendance: {
                ...state.attendance,
                [groupId]: updatedAttendance
            }
        };
    }
    case 'SAVE_EVALUATION': {
        const { groupId, evaluation } = action.payload;
        const groupEvaluations = state.evaluations[groupId] || [];
        const evalExists = groupEvaluations.some(e => e.id === evaluation.id);
        const newEvaluations = evalExists
            ? groupEvaluations.map(e => e.id === evaluation.id ? evaluation : e)
            : [...groupEvaluations, evaluation];
        
        return {
            ...state,
            evaluations: {
                ...state.evaluations,
                [groupId]: newEvaluations,
            },
        };
    }
    case 'DELETE_EVALUATION': {
        const { groupId, evaluationId } = action.payload;
        const newGroupEvaluations = (state.evaluations[groupId] || []).filter(e => e.id !== evaluationId);
        
        const newGrades = JSON.parse(JSON.stringify(state.grades));
        if (newGrades[groupId]) {
            Object.keys(newGrades[groupId]).forEach(studentId => {
                if(newGrades[groupId][studentId][evaluationId] !== undefined) {
                    delete newGrades[groupId][studentId][evaluationId];
                }
            });
        }

        return {
            ...state,
            evaluations: {
                ...state.evaluations,
                [groupId]: newGroupEvaluations
            },
            grades: newGrades,
        };
    }
    case 'UPDATE_GRADE': {
        const { groupId, studentId, evaluationId, score } = action.payload;
        const newGrades = JSON.parse(JSON.stringify(state.grades));
        
        if (!newGrades[groupId]) newGrades[groupId] = {};
        if (!newGrades[groupId][studentId]) newGrades[groupId][studentId] = {};
        
        if (score === null || score === undefined || isNaN(score)) {
            delete newGrades[groupId][studentId][evaluationId];
        } else {
            newGrades[groupId][studentId][evaluationId] = score;
        }

        return { ...state, grades: newGrades };
    }
    case 'UPDATE_SETTINGS':
        return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, { ...action.payload, id: Date.now() }] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) };
    case 'SAVE_EVENT': {
        const eventExists = state.calendarEvents.some(e => e.id === action.payload.id);
        const newEvents = eventExists
            ? state.calendarEvents.map(e => e.id === action.payload.id ? action.payload : e)
            : [...state.calendarEvents, action.payload];
        return { ...state, calendarEvents: newEvents };
    }
    case 'DELETE_EVENT': {
        return { ...state, calendarEvents: state.calendarEvents.filter(e => e.id !== action.payload) };
    }
    case 'SAVE_DASHBOARD_LAYOUT':
        return { ...state, dashboardLayouts: action.payload };
    default:
      return state;
  }
};

export const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<AppAction>;
}>({
  state: defaultState,
  dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, defaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const isElectron = !!window.electronAPI;

  // Load data on startup with migration from localStorage/file to IndexedDB
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Try loading from IndexedDB first
        let data = await getState();
        
        // 2. If no data in IndexedDB, try migrating from old storage
        if (!data || Object.keys(data).length === 0) {
          console.log("No data in IndexedDB, attempting migration from old storage...");
          let oldData: AppState | null = null;
          if (isElectron) {
            console.log("Running in Electron, loading data from file...");
            oldData = await window.electronAPI.getData();
          } else {
            console.log("Running in browser, loading data from localStorage...");
            const savedData = localStorage.getItem('appState');
            if (savedData) {
              oldData = JSON.parse(savedData);
            }
          }
          
          if (oldData && Object.keys(oldData).length > 0) {
            console.log("Found old data, migrating to IndexedDB...");
            dispatch({ type: 'SET_INITIAL_STATE', payload: oldData });
            // The state update is async, so we save the `oldData` object directly
            // to ensure the migrated data is what we just loaded.
            await saveState(oldData as AppState);
            console.log("Migration complete.");
            if (!isElectron) {
              localStorage.removeItem('appState'); // Clean up old storage
              console.log("Removed old data from localStorage.");
            }
            data = oldData;
          }
        } else {
           console.log("Successfully loaded data from IndexedDB.");
        }

        if (data && Object.keys(data).length > 0) {
          dispatch({ type: 'SET_INITIAL_STATE', payload: data });
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, [isElectron]);

  // Save data to IndexedDB on state change
  useEffect(() => {
    if (!isLoaded) {
      return; // Don't save until initial data is loaded
    }
    saveState(state);
  }, [state, isLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};