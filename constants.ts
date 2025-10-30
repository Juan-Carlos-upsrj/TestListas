import { AttendanceStatus, DayOfWeek, MotivationalQuote } from './types';

export const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
    AttendanceStatus.Present,
    AttendanceStatus.Absent,
    AttendanceStatus.Late,
    AttendanceStatus.Justified,
    AttendanceStatus.Exchange,
];

export const STATUS_STYLES: { [key in AttendanceStatus]: { symbol: string; color: string; key: string; } } = {
    [AttendanceStatus.Pending]: { symbol: '-', color: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300', key: ' ' },
    [AttendanceStatus.Present]: { symbol: 'P', color: 'bg-green-500 text-white', key: 'p' },
    [AttendanceStatus.Absent]: { symbol: 'A', color: 'bg-red-500 text-white', key: 'a' },
    [AttendanceStatus.Late]: { symbol: 'R', color: 'bg-yellow-500 text-white', key: 'r' },
    [AttendanceStatus.Justified]: { symbol: 'J', color: 'bg-blue-500 text-white', key: 'j' },
    [AttendanceStatus.Exchange]: { symbol: 'I', color: 'bg-purple-500 text-white', key: 'i' },
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
    { name: 'indigo', bg: 'bg-indigo-500', text: 'text-white', calendar: 'bg-indigo-200 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200' },
    { name: 'sky', bg: 'bg-sky-500', text: 'text-white', calendar: 'bg-sky-200 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200' },
    { name: 'teal', bg: 'bg-teal-500', text: 'text-white', calendar: 'bg-teal-200 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200' },
    { name: 'emerald', bg: 'bg-emerald-500', text: 'text-white', calendar: 'bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200' },
    { name: 'amber', bg: 'bg-amber-500', text: 'text-white', calendar: 'bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200' },
    { name: 'rose', bg: 'bg-rose-500', text: 'text-white', calendar: 'bg-rose-200 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200' },
    { name: 'fuchsia', bg: 'bg-fuchsia-500', text: 'text-white', calendar: 'bg-fuchsia-200 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-200' },
    { name: 'slate', bg: 'bg-slate-500', text: 'text-white', calendar: 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100' },
];