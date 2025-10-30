

import React, { useContext, useMemo, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus, ReportData, Evaluation, ReportMonthlyAttendance, StudentStatus } from '../types';
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
    }, [groups, selectedGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

    const reportData: ReportData[] = useMemo(() => {
        if (!group) return [];

        // 1. Get all dates and categorize them by partial and month
        const p1EndDate = new Date(settings.firstPartialEnd + 'T00:00:00');
        const allSemesterDates = getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
        
        const p1Dates = allSemesterDates.filter(d => new Date(d + 'T00:00:00') <= p1EndDate);
        const p2Dates = allSemesterDates.filter(d => new Date(d + 'T00:00:00') > p1EndDate);
        
        const monthlyDates: { [monthYear: string]: string[] } = {};
        allSemesterDates.forEach(d => {
            const dateObj = new Date(d + 'T00:00:00');
            const monthYear = dateObj.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
            if (!monthlyDates[monthYear]) monthlyDates[monthYear] = [];
            monthlyDates[monthYear].push(d);
        });

        // 2. Get all evaluations and categorize them by partial
        const groupEvaluations = evaluations[group.id] || [];
        const p1Evals = groupEvaluations.filter(e => e.partial === 1);
        const p2Evals = groupEvaluations.filter(e => e.partial === 2);

        // 3. Process each student
        return group.students.map(student => {
            const studentAttendance = attendance[group.id]?.[student.id] || {};
            const studentGrades = grades[group.id]?.[student.id] || {};

            // Helper to calculate attendance for a given list of dates
            const calculateAttendance = (dates: string[]) => {
                if (dates.length === 0) return { present: 0, totalClasses: 0, percentage: 100 };
                let present = 0;
                let validAttendanceTaken = 0;
                dates.forEach(date => {
                    const status = studentAttendance[date];
                    if (status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified) {
                        present++;
                        validAttendanceTaken++;
                    } else if (status === AttendanceStatus.Absent) {
                        validAttendanceTaken++;
                    }
                });
                const percentage = validAttendanceTaken > 0 ? (present / validAttendanceTaken) * 100 : 100;
                return { present, totalClasses: dates.length, percentage };
            };

            // Helper to calculate grades for a given list of evaluations
            const calculateGrades = (evals: Evaluation[]) => {
                if (evals.length === 0) return 'N/A';
                let score = 0;
                let maxScore = 0;
                evals.forEach(ev => {
                    if (studentGrades[ev.id] !== undefined && studentGrades[ev.id] !== null) {
                        score += studentGrades[ev.id]!;
                        maxScore += ev.maxScore;
                    }
                });
                if (maxScore === 0) return 'N/A';
                const average = (score / maxScore) * 10;
                return average.toFixed(1);
            };
            
            // Calculate all the values
            const totalAtt = calculateAttendance(allSemesterDates);
            const p1Att = calculateAttendance(p1Dates);
            const p2Att = calculateAttendance(p2Dates);

            const monthlyAttendance: ReportMonthlyAttendance = {};
            Object.keys(monthlyDates).forEach(monthYear => {
                monthlyAttendance[monthYear] = calculateAttendance(monthlyDates[monthYear]);
            });
            
            const totalGrade = calculateGrades(groupEvaluations);
            const p1Grade = calculateGrades(p1Evals);
            const p2Grade = calculateGrades(p2Evals);
            
            // Calculate status
            let status: StudentStatus = 'Regular';
            const totalGradeNum = typeof totalGrade === 'string' ? parseFloat(totalGrade) : totalGrade;
            if (totalAtt.percentage < settings.lowAttendanceThreshold || totalGradeNum < 6) {
                status = 'En Riesgo';
            } else if (totalAtt.percentage >= 95 && totalGradeNum >= 9) {
                status = 'Destacado';
            }

            return {
                student,
                status,
                totalAttendancePercentage: totalAtt.percentage,
                totalGradeAverage: totalGrade,
                p1AttendancePercentage: p1Att.percentage,
                p1GradeAverage: p1Grade,
                p2AttendancePercentage: p2Att.percentage,
                p2GradeAverage: p2Grade,
                monthlyAttendance,
            };
        });
    }, [group, settings, attendance, grades, evaluations]);
    
    const handleExportAttendance = () => {
        if (group && attendance[group.id]) {
            const allSemesterDates = getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
            exportAttendanceToCSV(group, allSemesterDates, attendance[group.id]);
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
                        <Button variant="primary" onClick={handleExportPDF}>
                           <Icon name="book-marked" className="w-4 h-4" /> Exportar Reporte Detallado (PDF)
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg overflow-x-auto">
                            <h3 className="text-lg font-bold mb-4">Resumen del Semestre</h3>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b dark:border-slate-700">
                                        <th className="p-2 text-left font-semibold">Alumno</th>
                                        <th className="p-2 text-center font-semibold">Asistencia Total (%)</th>
                                        <th className="p-2 text-center font-semibold">Promedio Final</th>
                                        <th className="p-2 text-center font-semibold">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(data => {
                                        const lowAttendance = data.totalAttendancePercentage < settings.lowAttendanceThreshold;
                                        const lowGrade = typeof data.totalGradeAverage === 'number' && data.totalGradeAverage < 6;
                                        const statusColors = {
                                            'En Riesgo': 'text-red-500',
                                            'Regular': 'text-slate-500',
                                            'Destacado': 'text-green-500'
                                        };
                                        return (
                                            <tr key={data.student.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="p-2 font-medium whitespace-nowrap">{data.student.name}</td>
                                                <td className={`p-2 text-center font-bold ${lowAttendance ? 'text-red-500' : 'text-green-500'}`}>
                                                    {data.totalAttendancePercentage.toFixed(1)}%
                                                </td>
                                                <td className={`p-2 text-center font-bold ${lowGrade ? 'text-red-500' : ''}`}>
                                                    {data.totalGradeAverage}
                                                </td>
                                                <td className={`p-2 text-center font-semibold ${statusColors[data.status]}`}>
                                                    {data.status}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                             {group.students.length === 0 && <p className="text-center text-slate-500 py-8">No hay alumnos en este grupo para generar un reporte.</p>}
                        </div>
                        <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                             <h3 className="text-lg font-bold mb-4">Distribución de Asistencia (Semestre)</h3>
                            {group.students.length > 0 ? (
                                <ReportChart reportData={reportData.map(d => ({ attendance: { percentage: d.totalAttendancePercentage }}))} />
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