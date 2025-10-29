import React, { createContext, useReducer, useEffect, ReactNode, Dispatch, useState } from 'react';
import { AppState, AppAction, AttendanceStatus } from '../types';

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
  settings: {
    semesterStart: today.toISOString().split('T')[0],
    firstPartialEnd: nextMonth.toISOString().split('T')[0],
    semesterEnd: fourMonthsLater.toISOString().split('T')[0],
    showMatricula: true,
    theme: 'light',
    lowAttendanceThreshold: 80,
  },
  activeView: 'dashboard',
  selectedGroupId: null,
  toasts: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_INITIAL_STATE':
        // Merge loaded state with default state to ensure all keys are present
        // in case the saved file is from an older version of the app.
        return {
            ...defaultState,
            ...action.payload,
            settings: {
                ...defaultState.settings,
                ...(action.payload.settings || {}),
            },
        };
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
      return { ...state, groups: [...state.groups, action.payload] };
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

  // Load data from file on startup
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await window.electronAPI.getData();
        if (data && Object.keys(data).length > 0) {
          dispatch({ type: 'SET_INITIAL_STATE', payload: data });
        }
      } catch (error) {
        console.error("Failed to load data from file:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []); // Runs only once

  // Save data to file on state change
  useEffect(() => {
    if (!isLoaded) {
      return; // Don't save until initial data is loaded
    }
    window.electronAPI.saveData(state);
  }, [state, isLoaded]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};
