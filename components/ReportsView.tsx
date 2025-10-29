import React, { useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import { getClassDates } from '../services/dateUtils';
import { exportAttendanceToCSV, exportGradesToCSV } from '../services/exportService';
import { exportReportToPDF } from '../services/pdfService';
import Icon from './icons/Icon';
import Button from './common/Button';
import ReportChart from './ReportChart';
import { motion } from 'framer-motion';

const ReportsView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, attendance, evaluations, grades, settings, selectedGroupId } = state;

    const setSelectedGroupId = (id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
    };

    const group = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    const classDates = useMemo(() => {
        if (group) {
            return getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
        }
        return [];
    }, [group, settings.semesterStart, settings.semesterEnd]);

    const reportData = useMemo(() => {
        if (!group) return [];

        return group.students.map(student => {
            // Attendance calculation
            const studentAttendance = attendance[group.id]?.[student.id] || {};
            let present = 0, absent = 0, late = 0, justified = 0, totalClasses = 0;
            
            classDates.forEach(date => {
                const status = studentAttendance[date];
                if(status && status !== AttendanceStatus.Pending && status !== AttendanceStatus.Exchange) {
                    totalClasses++;
                    if (status === AttendanceStatus.Present) present++;
                    else if (status === AttendanceStatus.Absent) absent++;
                    else if (status === AttendanceStatus.Late) late++;
                    else if (status === AttendanceStatus.Justified) justified++;
                }
            });
            const attendancePercentage = totalClasses > 0 ? ((present + late + justified) / totalClasses) * 100 : 100;

            // Grades calculation
            const studentGrades = grades[group.id]?.[student.id] || {};
            const groupEvaluations = evaluations[group.id] || [];
            let totalScore = 0;
            let maxPossibleScore = 0;

            groupEvaluations.forEach(ev => {
                if (studentGrades[ev.id] !== undefined && studentGrades[ev.id] !== null) {
                    totalScore += studentGrades[ev.id];
                }
                // Always sum maxScore to calculate average based on all evaluations
                maxPossibleScore += ev.maxScore;
            });
            const averageGrade = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 10 : 0;

            return {
                student,
                attendance: { present, absent, late, justified, totalClasses, percentage: attendancePercentage },
                grade: { average: averageGrade.toFixed(1) }
            };
        });
    }, [group, classDates, attendance, grades, evaluations]);
    
    const handleExportAttendance = () => {
        if (group && attendance[group.id]) {
            exportAttendanceToCSV(group, classDates, attendance[group.id]);
        }
    };

    const handleExportGrades = () => {
        if (group && evaluations[group.id] && grades[group.id]) {
            exportGradesToCSV(group, evaluations[group.id], grades[group.id]);
        }
    };
    
    const handleExportPDF = () => {
        if (group) {
            exportReportToPDF(group, reportData);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Reportes</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full sm:w-64 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="" disabled>Selecciona un grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
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
                        <Button variant="primary" onClick={handleExportPDF}>
                           <Icon name="book-marked" className="w-4 h-4" /> Exportar Reporte (PDF)
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b dark:border-slate-700">
                                        <th className="p-2 text-left font-semibold">Alumno</th>
                                        <th className="p-2 text-center font-semibold">Asistencia (%)</th>
                                        <th className="p-2 text-center font-semibold">Faltas</th>
                                        <th className="p-2 text-center font-semibold">Retardos</th>
                                        <th className="p-2 text-center font-semibold">Promedio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(data => {
                                        const lowAttendance = data.attendance.percentage < settings.lowAttendanceThreshold;
                                        const lowGrade = data.grade.average !== null && Number(data.grade.average) < 6;
                                        return (
                                            <tr key={data.student.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-2 font-medium whitespace-nowrap">{data.student.name}</td>
                                                <td className={`p-2 text-center font-bold ${lowAttendance ? 'text-red-500' : 'text-green-500'}`}>
                                                    {data.attendance.percentage.toFixed(1)}%
                                                </td>
                                                <td className="p-2 text-center">{data.attendance.absent}</td>
                                                <td className="p-2 text-center">{data.attendance.late}</td>
                                                <td className={`p-2 text-center font-bold ${lowGrade ? 'text-red-500' : ''}`}>
                                                    {data.grade.average !== null ? data.grade.average : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                             {group.students.length === 0 && <p className="text-center text-slate-500 py-8">No hay alumnos en este grupo para generar un reporte.</p>}
                        </div>
                        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                             <h3 className="text-lg font-bold mb-4">Resumen de Asistencia</h3>
                            {group.students.length > 0 ? (
                                <ReportChart reportData={reportData} />
                            ) : (
                                <p className="text-center text-slate-500 py-8">No hay datos para mostrar el gráfico.</p>
                            )}
                        </div>
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
