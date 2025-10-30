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
