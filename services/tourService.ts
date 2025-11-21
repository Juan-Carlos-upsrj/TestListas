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
                    description: 'Aquí encontrarás todas las secciones: Inicio, Grupos, Asistencia, Calendario, Calificaciones y Reportes.',
                    side: 'right'
                }
            },
            {
                element: '#sidebar-quick-groups',
                popover: {
                    title: 'Grupos Rápidos',
                    description: 'Tus grupos aparecerán aquí como botones. Haz clic para cambiar el "Grupo Activo" al instante desde cualquier pantalla.',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-groups',
                popover: {
                    title: 'Paso 1: Crear Grupos',
                    description: 'Empieza aquí. Crea tus grupos, define sus horarios y carga tu lista de alumnos (manualmente o importando desde texto).',
                    side: 'right'
                }
            },
            {
                element: '#dashboard-attendance-widget',
                popover: {
                    title: 'Paso 2: Toma de Lista',
                    description: 'Desde el Inicio, verás botones para tomar asistencia rápidamente a las clases de hoy.',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-attendance',
                popover: {
                    title: 'Vista de Asistencia',
                    description: 'Aquí verás la tabla completa. ¡Usa el teclado para ser más veloz!',
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
                element: '#sidebar-settings',
                popover: {
                    title: 'Configuración',
                    description: 'Asegúrate de configurar las fechas del semestre, parciales y tu nombre aquí para que los reportes salgan correctos.',
                    side: 'right',
                    align: 'end'
                }
            }
        ]
    });

    driverObj.drive();
};