import React, { useContext, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus, GroupReportSummary } from '../types';
import { getClassDates } from '../services/dateUtils';
import { exportAttendanceToCSV, exportGradesToCSV } from '../services/exportService';
import Icon from './icons/Icon';
import Button from './common/Button';
import ReportChart from './ReportChart';
import { motion } from 'framer-motion';
import { STATUS_STYLES } from '../constants';

const ReportsView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, attendance, evaluations, grades, settings, selectedGroupId } = state;

    const setSelectedGroupId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
    }, [dispatch]);

    const group = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    const groupEvaluations = useMemo(() => (evaluations[selectedGroupId || ''] || []), [evaluations, selectedGroupId]);

    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId, setSelectedGroupId]);

    const classDates = useMemo(() => {
        if (group) {
            return getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
        }
        return [];
    }, [group, settings.semesterStart, settings.semesterEnd]);

    const attendanceHeaders = useMemo(() => {
        if (!group) return null;

        const partial1End = new Date(settings.firstPartialEnd + 'T00:00:00');
        const grouped: Record<string, Record<string, string[]>> = {};

        classDates.forEach(dateStr => {
            const date = new Date(dateStr + 'T00:00:00');
            const partialName = date <= partial1End ? "Primer Parcial" : "Segundo Parcial";
            const monthName = date.toLocaleDateString('es-MX', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());

            if (!grouped[partialName]) grouped[partialName] = {};
            if (!grouped[partialName][monthName]) grouped[partialName][monthName] = [];
            grouped[partialName][monthName].push(dateStr);
        });
        return grouped;
    }, [group, classDates, settings.firstPartialEnd]);

    const groupSummaryData: GroupReportSummary | null = useMemo(() => {
        if (!group) return null;

        const allSemesterDates = getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
        
        const monthlyDates: { [monthYear: string]: string[] } = {};
        allSemesterDates.forEach(d => {
            const dateObj = new Date(d + 'T00:00:00');
            const monthYear = dateObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
            if (!monthlyDates[monthYear]) monthlyDates[monthYear] = [];
            monthlyDates[monthYear].push(d);
        });

        const summary: GroupReportSummary = {
            monthlyAttendance: {},
            evaluationAverages: {}
        };

        Object.keys(monthlyDates).forEach(monthYear => {
            const datesInMonth = monthlyDates[monthYear];
            let totalPercentageSum = 0;
            let studentsWithAttendanceThisMonth = 0;

            group.students.forEach(student => {
                const studentAttendance = attendance[group.id]?.[student.id] || {};
                let present = 0;
                let validAttendanceTaken = 0;
                datesInMonth.forEach(date => {
                    const status = studentAttendance[date];
                    if (status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified) {
                        present++;
                        validAttendanceTaken++;
                    } else if (status === AttendanceStatus.Absent) {
                        validAttendanceTaken++;
                    }
                });
                if (validAttendanceTaken > 0) {
                    totalPercentageSum += (present / validAttendanceTaken) * 100;
                    studentsWithAttendanceThisMonth++;
                }
            });
            
            if (studentsWithAttendanceThisMonth > 0) {
                summary.monthlyAttendance[monthYear] = totalPercentageSum / studentsWithAttendanceThisMonth;
            }
        });

        return summary;
    }, [group, settings, attendance]);

    const handleExportAttendance = () => {
        if (group) {
            exportAttendanceToCSV(group, classDates, attendance[group.id] || {});
        }
    };

    const handleExportGrades = () => {
        if (group) {
            exportGradesToCSV(group, groupEvaluations, grades[group.id] || {});
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Reportes del Grupo</h1>
                <select
                    value={selectedGroupId || ''}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="w-full sm:w-64 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="" disabled>Selecciona un grupo</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>

            {group ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="flex flex-wrap justify-end gap-3 mb-4">
                         <Button variant="secondary" onClick={handleExportAttendance}>
                            <Icon name="file-spreadsheet" className="w-4 h-4" /> Exportar Asistencia (CSV)
                        </Button>
                        <Button variant="secondary" onClick={handleExportGrades}>
                           <Icon name="file-spreadsheet" className="w-4 h-4" /> Exportar Calificaciones (CSV)
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold mb-4">Asistencia Mensual del Grupo</h3>
                            {groupSummaryData && Object.keys(groupSummaryData.monthlyAttendance).length > 0 ? (
                                <ReportChart monthlyAttendance={groupSummaryData.monthlyAttendance} />
                            ) : (
                                <p className="text-center text-slate-500 py-8">No hay suficientes datos de asistencia para mostrar el gráfico.</p>
                            )}
                        </div>
                        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col justify-center">
                            <h3 className="text-xl font-bold mb-4">Resumen General</h3>
                            <div className="space-y-4">
                               <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Total de Alumnos</span>
                                    <span className="font-bold text-2xl text-indigo-500">{group.students.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Evaluaciones Creadas</span>
                                    <span className="font-bold text-2xl text-indigo-500">{groupEvaluations.length}</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="font-medium text-slate-500 dark:text-slate-400">Días de Clase</span>
                                    <span className="font-bold text-2xl text-indigo-500">{classDates.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg overflow-x-auto">
                        <h3 className="text-xl font-bold mb-4">Registro Detallado de Asistencia</h3>
                        {group.students.length > 0 ? (
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th rowSpan={3} className="sticky left-0 bg-white dark:bg-slate-800 p-2 text-left font-semibold z-10 border-b-2 dark:border-slate-600">Alumno</th>
                                        {attendanceHeaders && Object.entries(attendanceHeaders).map(([partialName, months]) => {
                                            const colspan = Object.values(months).reduce((sum, dates) => sum + dates.length, 0);
                                            return <th key={partialName} colSpan={colspan} className="p-2 font-semibold text-center text-lg border-b-2 dark:border-slate-600">{partialName}</th>
                                        })}
                                    </tr>
                                    <tr>
                                        {attendanceHeaders && Object.entries(attendanceHeaders).flatMap(([partialName, months]) => 
                                            Object.entries(months).map(([monthName, dates], index) => 
                                                <th key={`${partialName}-${monthName}`} colSpan={dates.length} 
                                                className={`p-2 font-semibold text-center border-b dark:border-slate-700 ${index % 2 === 0 ? 'bg-slate-50 dark:bg-slate-700/50' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                                    {monthName}
                                                </th>
                                            )
                                        )}
                                    </tr>
                                    <tr>
                                        {classDates.map(date => (
                                            <th key={date} className={`p-2 font-semibold text-center text-sm min-w-[60px] border-b dark:border-slate-700`}>
                                                {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit' })}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.students.map(student => (
                                        <tr key={student.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="sticky left-0 bg-white dark:bg-slate-800 p-2 font-medium z-10 whitespace-nowrap">{student.name}</td>
                                            {classDates.map(date => {
                                                const status = attendance[group.id]?.[student.id]?.[date] || AttendanceStatus.Pending;
                                                return (
                                                    <td key={date} className="p-0 text-center">
                                                        <div
                                                            className={`w-full h-10 flex items-center justify-center text-xs font-bold ${STATUS_STYLES[status].color}`}
                                                        >
                                                            {STATUS_STYLES[status].symbol}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="text-center text-slate-500 py-8">No hay alumnos en este grupo para generar un reporte.</p>
                        )}
                    </div>
                </motion.div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                    <Icon name="bar-chart-3" className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600"/>
                    <p className="mt-4 text-slate-500">Por favor, selecciona un grupo para ver sus reportes.</p>
                    {groups.length === 0 && <p className="text-slate-400">Primero necesitas crear un grupo en la sección 'Grupos'.</p>}
                </div>
            )}
        </div>
    );
};

export default ReportsView;
