export interface Student {
  id: string;
  name: string;
  matricula: string;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado';

export interface Group {
  id: string;
  name: string;
  subject: string;
  classDays: DayOfWeek[];
  students: Student[];
}

export enum AttendanceStatus {
  Pending = 'Pendiente',
  Present = 'Presente',
  Absent = 'Ausente',
  Late = 'Retardo',
  Justified = 'Justificado',
  Exchange = 'Intercambio',
}

export interface Evaluation {
  id: string;
  name: string;
  maxScore: number;
}

export interface Settings {
  semesterStart: string;
  firstPartialEnd: string;
  semesterEnd: string;
  showMatricula: boolean;
  theme: 'light' | 'dark';
  lowAttendanceThreshold: number;
}

export type ActiveView = 'dashboard' | 'groups' | 'attendance' | 'grades' | 'reports';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface AppState {
  groups: Group[];
  attendance: {
    [groupId: string]: {
      [studentId: string]: {
        [date: string]: AttendanceStatus;
      };
    };
  };
  evaluations: {
    [groupId: string]: Evaluation[];
  };
  grades: {
    [groupId: string]: {
      [studentId: string]: {
        [evaluationId: string]: number;
      };
    };
  };
  settings: Settings;
  activeView: ActiveView;
  selectedGroupId: string | null;
  toasts: Toast[];
}

export type AppAction =
  | { type: 'SET_INITIAL_STATE'; payload: AppState }
  | { type: 'SET_VIEW'; payload: ActiveView }
  | { type: 'SET_SELECTED_GROUP'; payload: string | null }
  | { type: 'SAVE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'SAVE_STUDENT'; payload: { groupId: string; student: Student } }
  | { type: 'BULK_ADD_STUDENTS', payload: { groupId: string, students: Student[] } }
  | { type: 'DELETE_STUDENT'; payload: { groupId: string; studentId: string } }
  | { type: 'UPDATE_ATTENDANCE'; payload: { groupId: string; studentId: string; date: string; status: AttendanceStatus } }
  | { type: 'QUICK_ATTENDANCE'; payload: { groupId: string; date: string } }
  | { type: 'SAVE_EVALUATION'; payload: { groupId: string; evaluation: Evaluation } }
  | { type: 'DELETE_EVALUATION'; payload: { groupId: string; evaluationId: string } }
  | { type: 'UPDATE_GRADE'; payload: { groupId: string; studentId: string; evaluationId: string; score: number | null } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'ADD_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'REMOVE_TOAST'; payload: number };

export interface Professor {
    name: string;
    birthdate: string;
}