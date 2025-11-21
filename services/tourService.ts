// @ts-ignore
import { driver } from "driver.js";

export const startTour = () => {
    const driverObj = driver({
        showProgress: true,
        animate: true,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: '¡Listo!',
        steps: [
            {
                element: '#sidebar-logo',
                popover: {
                    title: 'Bienvenido a Gestión IAEV',
                    description: 'Esta aplicación te ayudará a gestionar tus grupos, asistencia y calificaciones de manera rápida y sencilla.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#sidebar-nav',
                popover: {
                    title: 'Navegación Principal',
                    description: 'Aquí encontrarás todas las secciones para administrar tus clases.',
                    side: 'right'
                }
            },
            {
                element: '#sidebar-quick-groups',
                popover: {
                    title: 'Grupos Rápidos',
                    description: 'Tus grupos aparecerán aquí. Haz clic para cambiar el "Grupo Activo" rápidamente desde cualquier pantalla.',
                    side: 'right'
                }
            },
            {
                element: '#dashboard-combined-overview',
                popover: {
                    title: 'Resumen de Hoy',
                    description: 'Visualiza el total de tus alumnos y un gráfico en tiempo real del porcentaje de asistencia del día.',
                    side: 'left'
                }
            },
            {
                element: '#dashboard-attendance-widget',
                popover: {
                    title: 'Pase de Lista Rápido',
                    description: '¡Lo más importante! Aquí aparecerán tus clases de hoy. Un clic y estarás tomando asistencia.',
                    side: 'right'
                }
            },
            {
                element: '#dashboard-upcoming-events',
                popover: {
                    title: 'Próximos Eventos',
                    description: 'Consulta días festivos y eventos sincronizados desde tu Google Calendar.',
                    side: 'top'
                }
            },
            {
                element: '#dashboard-quick-actions',
                popover: {
                    title: 'Acciones Rápidas',
                    description: 'Botones útiles para subir tus datos a la nube o actualizar tu horario docente.',
                    side: 'left'
                }
            },
            {
                element: '#nav-item-groups',
                popover: {
                    title: 'Gestión de Grupos',
                    description: 'Crea grupos nuevos, duplícalos para otras materias y administra tu lista de alumnos (puedes importar listas desde texto).',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-attendance',
                popover: {
                    title: 'Vista de Asistencia',
                    description: 'La tabla completa. Puedes usar "Relleno Rápido" para días pasados o editar manualmente.',
                    side: 'right'
                }
            },
            {
                popover: {
                    title: 'Atajos de Teclado ⚡',
                    description: 'En la tabla de asistencia, usa las flechas para moverte y estas teclas:\n\n[P] Presente\n[A] Ausente\n[R] Retardo\n[J] Justificado\n[I] Intercambio\n\n¡Es mucho más rápido que el mouse!',
                }
            },
            {
                element: '#nav-item-grades',
                popover: {
                    title: 'Calificaciones',
                    description: 'Configura los porcentajes de evaluación (Tareas, Exámenes) y vincula la asistencia para que se califique automáticamente.',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-reports',
                popover: {
                    title: 'Reportes',
                    description: 'Genera reportes oficiales en PDF con gráficas de rendimiento o exporta tus datos a Excel (CSV).',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-calendar',
                popover: {
                    title: 'Calendario',
                    description: 'Una vista mensual de tus clases y eventos.',
                    side: 'right'
                }
            },
            {
                element: '#sidebar-settings',
                popover: {
                    title: 'Configuración',
                    description: 'Importante: Configura aquí las fechas del semestre y conecta tu Google Calendar para sacar el máximo provecho.',
                    side: 'right',
                    align: 'end'
                }
            }
        ]
    });

    driverObj.drive();
};