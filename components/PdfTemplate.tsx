import { forwardRef } from 'react';
import { Group, ReportData, StudentStatus, Evaluation, GroupReportSummary } from '../types';
import { GROUP_COLORS } from '../constants';

interface PdfTemplateProps {
  group: Group;
  reportData: ReportData[];
  logoBase64: string;
  evaluations: Evaluation[];
  groupSummary: GroupReportSummary;
}

const statusStyles: { [key in StudentStatus]: { text: string; bg: string; } } = {
    'Destacado': { text: 'text-green-800', bg: 'bg-green-100' },
    'Regular': { text: 'text-blue-800', bg: 'bg-blue-100' },
    'En Riesgo': { text: 'text-red-800', bg: 'bg-red-100' },
};

const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(({ group, reportData, logoBase64, evaluations, groupSummary }, ref) => {

  const groupColor = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];

  const totalGroupAttendance = reportData.length > 0 ? reportData.reduce((sum, data) => sum + data.totalAttendancePercentage, 0) / reportData.length : 0;
  const groupAverageGrade = reportData.length > 0 ? reportData.reduce((sum, data) => {
      const grade = Number(data.totalGradeAverage);
      return sum + (isNaN(grade) ? 0 : grade);
  }, 0) / reportData.length : 0;
  const studentsAtRisk = reportData.filter(d => d.status === 'En Riesgo').length;
  
  const sortedMonths = Object.keys(groupSummary.monthlyAttendance).sort((a, b) => {
      const aDate = new Date(`01 ${a}`);
      const bDate = new Date(`01 ${b}`);
      return aDate.getTime() - bDate.getTime();
  });

  return (
    <div ref={ref} className="bg-white font-sans text-slate-800" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
        <div className="p-10">
            {/* Header */}
            <header className={`p-6 rounded-xl ${groupColor.bg} ${groupColor.text}`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {logoBase64 && <img src={logoBase64} alt="Logo" style={{ width: '56px', height: '56px' }} />}
                        <div>
                            <h1 className="text-4xl font-bold">Reporte de Desempeño</h1>
                            <p className="opacity-80 text-lg">Grupo: {group.name}</p>
                        </div>
                    </div>
                    <div className="text-sm text-right">
                        <p><span className="font-semibold">Materia:</span> {group.subject}</p>
                        <p><span className="font-semibold">Fecha:</span> {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </div>
            </header>

            <main className="mt-8">
                {/* --- GROUP SUMMARY PAGE --- */}
                <section className="mb-8" style={{ breakAfter: 'page' }}>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Estadísticas Clave del Grupo</h2>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <span className="text-sm font-medium text-slate-500">Total de Alumnos</span>
                            <p className="mt-1 text-3xl font-bold text-slate-900">{group.students.length}</p>
                        </div>
                         <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <span className="text-sm font-medium text-slate-500">Asistencia General</span>
                            <p className="mt-1 text-3xl font-bold text-blue-600">{totalGroupAttendance.toFixed(1)}%</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <span className="text-sm font-medium text-slate-500">Promedio General</span>
                            <p className="mt-1 text-3xl font-bold text-green-600">{groupAverageGrade.toFixed(1)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4 text-center">
                            <span className="text-sm font-medium text-slate-500">Alumnos en Riesgo</span>
                            <p className="mt-1 text-3xl font-bold text-red-600">{studentsAtRisk}</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">Resumen General del Grupo</h2>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Group Monthly Attendance */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-bold text-center mb-2">Asistencia Mensual (Promedio)</h3>
                             <table className="w-full text-sm">
                                <tbody>
                                    {sortedMonths.map(month => (
                                        <tr key={month} className="border-b">
                                            <td className="py-1 text-slate-600">{month.charAt(0).toUpperCase() + month.slice(1, -5)}</td>
                                            <td className="py-1 text-right font-semibold">{groupSummary.monthlyAttendance[month].toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Group Evaluation Averages */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-bold text-center mb-2">Calificaciones (Promedio)</h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    {Object.values(groupSummary.evaluationAverages).map(ev => (
                                        <tr key={ev.name} className="border-b">
                                            <td className="py-1 text-slate-600">{ev.name}</td>
                                            <td className="py-1 text-right font-semibold">{ev.average.toFixed(1)} / {ev.maxScore}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                
                {/* --- INDIVIDUAL STUDENTS PAGE --- */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Desempeño Individual</h2>
                    <div className="space-y-4">
                        {reportData.map((data) => {
                            const statusStyle = statusStyles[data.status];
                            const p1Evals = evaluations.filter(e => e.partial === 1);
                            const p2Evals = evaluations.filter(e => e.partial === 2);
                            return (
                                <div key={data.student.id} className="p-4 border border-slate-200 rounded-lg" style={{ breakInside: 'avoid-page' }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-bold text-lg text-slate-900">{data.student.name}</p>
                                            {data.student.matricula && <p className="text-sm text-slate-500">Matrícula: {data.student.matricula}</p>}
                                        </div>
                                        <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                            {data.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        {/* Grades Column */}
                                        <div className="bg-slate-50 p-3 rounded-md col-span-1">
                                            <h4 className="font-semibold text-slate-600 mb-2 text-center">Calificaciones</h4>
                                            <table className="w-full text-xs">
                                                <tbody>
                                                    {p1Evals.map(ev => {
                                                        const grade = data.grades[ev.id];
                                                        return (
                                                            <tr key={ev.id}>
                                                                <td className="text-left py-0.5 text-slate-500">{ev.name}</td>
                                                                <td className="text-right py-0.5 font-semibold">{grade !== null && grade !== undefined ? grade : '–'} / {ev.maxScore}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                    <tr className="border-t">
                                                        <td className="text-left py-0.5 font-bold">Promedio P1:</td>
                                                        <td className="text-right py-0.5 font-bold">{data.p1GradeAverage}</td>
                                                    </tr>
                                                    {p2Evals.map(ev => {
                                                        const grade = data.grades[ev.id];
                                                        return (
                                                            <tr key={ev.id}>
                                                                <td className="text-left py-0.5 text-slate-500">{ev.name}</td>
                                                                <td className="text-right py-0.5 font-semibold">{grade !== null && grade !== undefined ? grade : '–'} / {ev.maxScore}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                     <tr className="border-t">
                                                        <td className="text-left py-0.5 font-bold">Promedio P2:</td>
                                                        <td className="text-right py-0.5 font-bold">{data.p2GradeAverage}</td>
                                                    </tr>
                                                     <tr className="border-t-2 border-slate-400">
                                                        <td className="text-left pt-1 font-bold text-sm">Promedio Final:</td>
                                                        <td className="text-right pt-1 font-bold text-sm">{data.totalGradeAverage}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Attendance Column */}
                                        <div className="bg-slate-50 p-3 rounded-md">
                                            <h4 className="font-semibold text-slate-600 mb-2 text-center">Asistencia</h4>
                                            <div className="space-y-1.5 text-sm">
                                                <div className="flex justify-between font-bold text-base"><span className="font-semibold">Total:</span><span>{data.totalAttendancePercentage.toFixed(1)}%</span></div>
                                                <hr/>
                                                <div className="flex justify-between"><span className="text-slate-500">Parcial 1:</span><span>{data.p1AttendancePercentage.toFixed(1)}%</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Parcial 2:</span><span>{data.p2AttendancePercentage.toFixed(1)}%</span></div>
                                            </div>
                                        </div>

                                        {/* Monthly Attendance Column */}
                                        <div className="bg-slate-50 p-3 rounded-md">
                                            <h4 className="font-semibold text-slate-600 mb-2 text-center">Asistencia Mensual</h4>
                                            <table className="w-full text-xs">
                                                <tbody>
                                                    {Object.entries(data.monthlyAttendance).map(([month, stats]) => (
                                                        <tr key={month}>
                                                            <td className="text-left py-0.5 text-slate-500">{month.split(' ')[0].charAt(0).toUpperCase() + month.split(' ')[0].slice(1)}</td>
                                                            <td className="text-right py-0.5 font-semibold">{stats.percentage.toFixed(1)}%</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                     {reportData.length === 0 && <p className="text-center py-12 text-slate-500">No hay datos de alumnos para mostrar en este reporte.</p>}
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-12 text-center text-xs text-slate-400 border-t pt-4">
                <p>Reporte generado por Gestión Académica IAEV</p>
            </footer>
        </div>
    </div>
  );
});

export default PdfTemplate;