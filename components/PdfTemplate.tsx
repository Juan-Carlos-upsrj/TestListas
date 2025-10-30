import { forwardRef } from 'react';
import { Group, ReportData, StudentStatus } from '../types';
import { GROUP_COLORS } from '../constants';

interface PdfTemplateProps {
  group: Group;
  reportData: ReportData[];
  logoBase64: string;
}

const statusStyles: { [key in StudentStatus]: { text: string; bg: string; } } = {
    'Destacado': { text: 'text-green-800', bg: 'bg-green-100' },
    'Regular': { text: 'text-blue-800', bg: 'bg-blue-100' },
    'En Riesgo': { text: 'text-red-800', bg: 'bg-red-100' },
};

const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(({ group, reportData, logoBase64 }, ref) => {

  const groupColor = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];

  const totalGroupAttendance = reportData.length > 0 ? reportData.reduce((sum, data) => sum + data.attendance.percentage, 0) / reportData.length : 0;
  const groupAverageGrade = reportData.length > 0 ? reportData.reduce((sum, data) => sum + Number(data.grade.average), 0) / reportData.length : 0;
  const studentsAtRisk = reportData.filter(d => d.status === 'En Riesgo').length;

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
                {/* Summary Section */}
                <section className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Estadísticas Clave</h2>
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
                </section>
                
                {/* Students Table */}
                <section>
                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Desempeño Individual</h2>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600">
                                <tr>
                                    <th className="p-3 font-semibold" scope="col">Alumno</th>
                                    <th className="p-3 font-semibold text-center" scope="col">Asistencia</th>
                                    <th className="p-3 font-semibold text-center" scope="col">Calificación Final</th>
                                    <th className="p-3 font-semibold text-center" scope="col">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {reportData.map((data) => {
                                    const statusStyle = statusStyles[data.status];
                                    return (
                                        <tr key={data.student.id}>
                                            <td className="p-3">
                                                <p className="font-medium text-slate-900">{data.student.name}</p>
                                                <p className="text-xs text-slate-500">{data.student.matricula || 'Sin matrícula'}</p>
                                            </td>
                                            <td className="p-3 text-center">
                                                <p className="font-semibold">{data.attendance.percentage.toFixed(1)}%</p>
                                                <p className="text-xs text-slate-500">{data.attendance.present} / {data.attendance.totalClasses} clases</p>
                                            </td>
                                            <td className="p-3 text-center font-bold text-lg">
                                                {data.grade.average}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                                                    {data.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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