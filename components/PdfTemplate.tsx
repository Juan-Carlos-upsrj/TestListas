import { forwardRef } from 'react';
import { Group, Student } from '../types';

interface ReportData {
  student: Student;
  attendance: {
    percentage: number;
    absent: number;
    late: number;
  };
  grade: {
    average: string | number;
  };
}

interface PdfTemplateProps {
  group: Group;
  reportData: ReportData[];
}

const PdfTemplate = forwardRef<HTMLDivElement, PdfTemplateProps>(({ group, reportData }, ref) => {

  const totalGroupAttendance = reportData.length > 0 ? reportData.reduce((sum, data) => sum + data.attendance.percentage, 0) / reportData.length : 0;

  return (
    // Using inline styles for dimensions to ensure html2canvas captures it correctly
    <div ref={ref} className="bg-slate-50 font-sans text-gray-800" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
        <div className="p-8">
            {/* Header */}
            <header className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                     <div className="flex items-center gap-4">
                        <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px' }} />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Reporte de Desempeño</h1>
                            <p className="text-gray-500 mt-1">Grupo: {group.name}</p>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 text-right">
                        <p>Materia: {group.subject}</p>
                        <p>Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}</p>
                    </div>
                </div>
                <hr className="mt-4 border-gray-200" />
            </header>

            <main>
                {/* Summary Section */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumen de Asistencia</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow-sm p-5 flex flex-col items-center justify-center col-span-full">
                            <span className="text-sm font-medium text-gray-500">Asistencia Total del Grupo</span>
                            <div className="mt-2 text-4xl font-bold text-blue-500">{totalGroupAttendance.toFixed(1)}%</div>
                        </div>
                    </div>
                </section>
                
                {/* Students Table */}
                <section>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="p-4 font-semibold" scope="col">#</th>
                                        <th className="p-4 font-semibold" scope="col">Matrícula</th>
                                        <th className="p-4 font-semibold" scope="col">Nombre del Alumno</th>
                                        <th className="p-4 font-semibold text-center" scope="col">Asistencia (%)</th>
                                        <th className="p-4 font-semibold text-center" scope="col">Faltas</th>
                                        <th className="p-4 font-semibold text-center" scope="col">Promedio</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reportData.map((data, index) => {
                                        const lowAttendance = data.attendance.percentage < 80;
                                        const lowGrade = Number(data.grade.average) < 6;
                                        return (
                                            <tr key={data.student.id} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-500">{index + 1}</td>
                                                <td className="p-4">{data.student.matricula || '-'}</td>
                                                <td className="p-4 font-medium text-gray-900">{data.student.name}</td>
                                                <td className={`p-4 text-center font-semibold ${lowAttendance ? 'text-red-600' : 'text-green-600'}`}>
                                                    {data.attendance.percentage.toFixed(1)}%
                                                </td>
                                                <td className="p-4 text-center">{data.attendance.absent}</td>
                                                <td className={`p-4 text-center font-semibold ${lowGrade ? 'text-red-600' : 'text-gray-800'}`}>
                                                    {data.grade.average}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                         {reportData.length === 0 && <p className="text-center py-12 text-gray-500">No hay datos de alumnos para mostrar en este reporte.</p>}
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-12 text-center text-sm text-gray-400">
                <p>Reporte generado por Gestión Académica IAEV</p>
            </footer>
        </div>
    </div>
  );
});

export default PdfTemplate;