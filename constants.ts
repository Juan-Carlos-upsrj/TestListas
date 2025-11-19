import { AttendanceStatus, DayOfWeek, MotivationalQuote, Professor } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Late,
    AttendanceStatus.Justified,
    AttendanceStatus.Exchange,
];

export const STATUS_STYLES: { [key in AttendanceStatus]: { symbol: string; color: string; key: string; } } = {
    [AttendanceStatus.Pending]: { symbol: '-', color: 'bg-slate-200/60 dark:bg-slate-600/60 text-slate-500 dark:text-slate-300', key: ' ' },
    [AttendanceStatus.Present]: { symbol: 'P', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold', key: 'p' },
    [AttendanceStatus.Absent]: { symbol: 'A', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-bold', key: 'a' },
    [AttendanceStatus.Late]: { symbol: 'R', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold', key: 'r' },
    [AttendanceStatus.Justified]: { symbol: 'J', color: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 font-bold', key: 'j' },
    [AttendanceStatus.Exchange]: { symbol: 'I', color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold', key: 'i' },
};

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
    {
        text: "Respiro angustia, exhalo tranquilidad",
        author: "Elia",
        icon: "graduation-cap"
    },
    {
        text: "Sipoooooooo",
        author: "Mely",
        image: "/images/benjamin-franklin.jpg" 
    },
    {
        text: "No pues miaw",
        author: "German",
        icon: "book-marked"
    },
    {
        text: "Ay que triste",
        author: "Yeici",
        icon: "pie-chart"
    }
];

// Updated colors to ensure high contrast (Darker backgrounds for white text)
export const GROUP_COLORS = [
    { name: 'blue', bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-600', calendar: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' },
    { name: 'teal', bg: 'bg-teal-600', text: 'text-white', ring: 'ring-teal-600', calendar: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200' },
    { name: 'amber', bg: 'bg-amber-600', text: 'text-white', ring: 'ring-amber-600', calendar: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200' },
    { name: 'red', bg: 'bg-red-600', text: 'text-white', ring: 'ring-red-600', calendar: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200' },
    { name: 'green', bg: 'bg-green-600', text: 'text-white', ring: 'ring-green-600', calendar: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' },
    { name: 'fuchsia', bg: 'bg-fuchsia-600', text: 'text-white', ring: 'ring-fuchsia-600', calendar: 'bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-200' },
    { name: 'rose', bg: 'bg-rose-600', text: 'text-white', ring: 'ring-rose-600', calendar: 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200' },
    { name: 'indigo', bg: 'bg-indigo-600', text: 'text-white', ring: 'ring-indigo-600', calendar: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200' },
];

export const CUSTOM_EVENT_COLOR = 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200';

export const PROFESSOR_BIRTHDAYS: Professor[] = [
    { name: 'Prof. Victor', birthdate: '02-04' },
    { name: 'Profa. Aziz', birthdate: '04-04' },
    { name: 'Prof. Isai', birthdate: '05-03' },
    { name: 'Prof. Mely', birthdate: '06-19' },
    { name: 'Profa. Yeici', birthdate: '07-03' },
    { name: 'Prof. Carmi', birthdate: '07-18' },
    { name: 'Prof. Andy', birthdate: '08-29' },
    { name: 'Prof. Germán', birthdate: '09-24' },
    { name: 'Prof. Paco', birthdate: '10-21' },
    { name: 'Prof. Elia', birthdate: '12-09' },
    { name: 'Prof. Test', birthdate: '10-30' },
];