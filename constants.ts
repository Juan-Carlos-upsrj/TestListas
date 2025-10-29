import { AttendanceStatus, DayOfWeek, Professor } from "./types";

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  AttendanceStatus.Present,
  AttendanceStatus.Absent,
  AttendanceStatus.Late,
  AttendanceStatus.Justified,
  AttendanceStatus.Exchange,
];

export const STATUS_STYLES: { [key in AttendanceStatus]: { color: string; symbol: string; key: string } } = {
  [AttendanceStatus.Pending]: { color: 'bg-slate-200 dark:bg-slate-700', symbol: '?', key: 'S' },
  [AttendanceStatus.Present]: { color: 'bg-green-500 text-white', symbol: 'P', key: 'P' },
  [AttendanceStatus.Absent]: { color: 'bg-red-500 text-white', symbol: 'A', key: 'A' },
  [AttendanceStatus.Late]: { color: 'bg-yellow-500 text-white', symbol: 'R', key: 'R' },
  [AttendanceStatus.Justified]: { color: 'bg-blue-500 text-white', symbol: 'J', key: 'J' },
  [AttendanceStatus.Exchange]: { color: 'bg-purple-500 text-white', symbol: 'I', key: 'I' },
};

export const DAYS_OF_WEEK: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const MOTIVATIONAL_QUOTES = [
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "La única forma de hacer un gran trabajo es amar lo que haces.",
  "No te preocupes por los fracasos, preocúpate por las oportunidades que pierdes cuando ni siquiera lo intentas.",
  "Cree en ti mismo y todo lo que eres. Reconoce que hay algo dentro de ti que es más grande que cualquier obstáculo.",
  "El futuro pertenece a quienes creen en la belleza de sus sueños.",
  "La educación es el arma más poderosa que puedes usar para cambiar el mundo.",
  "El aprendizaje es un tesoro que seguirá a su dueño a todas partes."
];

export const PROFESSORS: Professor[] = [
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
];

export const GRADE_DEADLINES = {
    firstPartial: "2024-10-15",
    final: "2024-12-10"
};