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
    [AttendanceStatus.Present]: { symbol: 'P', color: 'bg-accent-green-light dark:bg-accent-green/20 text-accent-green-dark dark:text-green-300 font-bold', key: 'p' },
    [AttendanceStatus.Absent]: { symbol: 'A', color: 'bg-accent-red-light dark:bg-accent-red/20 text-accent-red dark:text-red-300 font-bold', key: 'a' },
    [AttendanceStatus.Late]: { symbol: 'R', color: 'bg-accent-yellow-light dark:bg-accent-yellow/20 text-accent-yellow-dark dark:text-yellow-300 font-bold', key: 'r' },
    [AttendanceStatus.Justified]: { symbol: 'J', color: 'bg-accent-blue-light dark:bg-accent-blue/20 text-accent-blue dark:text-blue-300 font-bold', key: 'j' },
    [AttendanceStatus.Exchange]: { symbol: 'I', color: 'bg-accent-teal-light dark:bg-accent-teal/20 text-accent-teal dark:text-teal-300 font-bold', key: 'i' },
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
        image: "/images/benjamin-franklin.jpg" // Para usar esta imagen, crea una carpeta 'public/images' y guarda el archivo ahí.
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

export const GROUP_COLORS = [
    { name: 'blue', bg: 'bg-blue-600', text: 'text-white', calendar: 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200' },
    { name: 'teal', bg: 'bg-teal-500', text: 'text-white', calendar: 'bg-teal-200 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200' },
    { name: 'yellow', bg: 'bg-yellow-500', text: 'text-black', calendar: 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200' },
    { name: 'red', bg: 'bg-red-500', text: 'text-white', calendar: 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200' },
    { name: 'green', bg: 'bg-green-500', text: 'text-white', calendar: 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200' },
    { name: 'fuchsia', bg: 'bg-fuchsia-500', text: 'text-white', calendar: 'bg-fuchsia-200 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-200' },
    { name: 'rose', bg: 'bg-rose-500', text: 'text-white', calendar: 'bg-rose-200 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200' },
    { name: 'slate', bg: 'bg-slate-500', text: 'text-white', calendar: 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100' },
];

export const CUSTOM_EVENT_COLOR = 'bg-cyan-200 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200';

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