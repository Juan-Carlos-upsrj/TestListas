
// @ts-ignore
import { driver } from "driver.js";

export const startTour = () => {
    const driverObj = driver({
        showProgress: true,
        animate: true,
        popoverClass: 'driverjs-theme',
        nextBtnText: 'Siguiente',
        prevBtnText: 'Anterior',
        doneBtnText: '¡Entendido!',
        steps: [
            {
                element: '#sidebar-logo',
                popover: {
                    title: 'Bienvenido a Gestión IAEV',
                    description: 'Esta es tu herramienta integral para el control académico. <br/><br/>Este recorrido te enseñará no solo dónde están las cosas, sino <strong>cómo sacarles el máximo provecho</strong> para ahorrar tiempo.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#sidebar-quick-groups',
                popover: {
                    title: 'Acceso Inmediato',
                    description: 'Tus grupos aparecerán aquí como botones. <br/>Al hacer clic, la aplicación se "enfoca" en ese grupo, mostrando sus alumnos y datos en cualquier sección que visites (Asistencia, Calificaciones, etc).',
                    side: 'right'
                }
            },
            {
                element: '#dashboard-attendance-widget',
                popover: {
                    title: 'Pase de Lista Rápido (Diario)',
                    description: 'Esta es tu herramienta de batalla diaria. <br/>Solo aparecerán aquí los grupos que te tocan <strong>hoy</strong> según tu horario. Úsalo para tomar asistencia al vuelo sin entrar a menús complejos.',
                    side: 'right'
                }
            },
            {
                element: '#dashboard-combined-overview',
                popover: {
                    title: 'Termómetro de Asistencia',
                    description: 'Este gráfico se llena en tiempo real. Te permite ver de un vistazo qué porcentaje de tus alumnos ha asistido a las clases del día.',
                    side: 'left'
                }
            },
            {
                element: '#nav-item-groups',
                popover: {
                    title: 'Gestión de Grupos',
                    description: 'Aquí es donde nace todo. <br/><ul><li>Crea grupos y asigna colores.</li><li>Importa listas de alumnos desde Excel/Texto.</li><li><strong>Tip:</strong> Usa el botón de "Duplicar" si das la misma materia a otro grupo.</li></ul>',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-attendance',
                popover: {
                    title: 'Matriz de Asistencia Avanzada',
                    description: 'Aquí verás la tabla completa del semestre. <br/><br/><strong>Funciones Clave:</strong><br/>1. <strong>Importar con IA:</strong> Sube una foto de tu lista física y la app la digitalizará.<br/>2. <strong>Relleno Rápido:</strong> Pon asistencia a todos en un rango de fechas.<br/>3. <strong>Atajos:</strong> Usa (P), (A), (R) y las flechas del teclado.',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-grades',
                popover: {
                    title: 'Libreta de Calificaciones',
                    description: 'Olvídate de calcular promedios a mano.<br/><br/>Configura los criterios (ej. 40% Examen, 60% Tareas). Puedes activar una opción para que el <strong>% de Asistencia</strong> se convierta automáticamente en puntos de calificación.',
                    side: 'right'
                }
            },
            {
                element: '#nav-item-reports',
                popover: {
                    title: 'Reportes Ejecutivos',
                    description: 'Genera PDFs profesionales con gráficas de rendimiento mensual y desglose por alumno, listos para entregar a coordinación. También puedes exportar a Excel (CSV).',
                    side: 'right'
                }
            },
            {
                element: '#sidebar-settings',
                popover: {
                    title: 'Configuración y Ciclo de Vida',
                    description: 'Define aquí las fechas de inicio/fin de semestre y conecta tu Google Calendar.<br/><br/><strong>⚠️ Al finalizar el Cuatri:</strong> Busca aquí el botón <strong>"Asistente de Cierre de Ciclo"</strong>. Te ayudará a respaldar todo, promover grupos al siguiente nivel y limpiar los datos antiguos automáticamente.',
                    side: 'right',
                    align: 'end'
                }
            }
        ]
    });

    driverObj.drive();
};
