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
    [AttendanceStatus.Pending]: { symbol: '-', color: 'bg-slate-200/60 text-slate-500', key: ' ' },
    [AttendanceStatus.Present]: { symbol: 'P', color: 'bg-iaev-green-light text-iaev-green-dark font-bold', key: 'p' },
    [AttendanceStatus.Absent]: { symbol: 'A', color: 'bg-iaev-red-light text-iaev-red-dark font-bold', key: 'a' },
    [AttendanceStatus.Late]: { symbol: 'R', color: 'bg-iaev-yellow-light text-iaev-yellow-dark font-bold', key: 'r' },
    [AttendanceStatus.Justified]: { symbol: 'J', color: 'bg-iaev-blue-light text-iaev-blue-darker font-bold', key: 'j' },
    [AttendanceStatus.Exchange]: { symbol: 'I', color: 'bg-iaev-teal-light text-iaev-teal-dark font-bold', key: 'i' },
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
    { name: 'iaev-blue', bg: 'bg-iaev-blue', text: 'text-white', calendar: 'bg-iaev-blue-light text-iaev-blue-darker' },
    { name: 'iaev-teal', bg: 'bg-iaev-teal', text: 'text-white', calendar: 'bg-iaev-teal-light text-iaev-teal-dark' },
    { name: 'iaev-yellow', bg: 'bg-iaev-yellow', text: 'text-black', calendar: 'bg-iaev-yellow-light text-iaev-yellow-dark' },
    { name: 'iaev-red', bg: 'bg-iaev-red', text: 'text-white', calendar: 'bg-iaev-red-light text-iaev-red-dark' },
    { name: 'iaev-green', bg: 'bg-iaev-green', text: 'text-white', calendar: 'bg-iaev-green-light text-iaev-green-dark' },
    { name: 'fuchsia', bg: 'bg-fuchsia-500', text: 'text-white', calendar: 'bg-fuchsia-200 dark:bg-fuchsia-900/50 text-fuchsia-800 dark:text-fuchsia-200' },
    { name: 'rose', bg: 'bg-rose-500', text: 'text-white', calendar: 'bg-rose-200 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200' },
    { name: 'slate', bg: 'bg-slate-500', text: 'text-white', calendar: 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100' },
];

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