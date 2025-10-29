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

  return (
    <div ref={ref} className="p-10 bg-white" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'sans-serif' }}>
        {/* Header */}
        <header className="flex justify-between items-center pb-4 border-b-2 border-gray-800">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Reporte de Desempeño</h1>
                <h2 className="text-xl text-gray-600">{group.name}</h2>
            </div>
            <div className="text-right">
                <p className="text-gray-600">{group.subject}</p>
                <p className="text-sm text-gray-500">Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}</p>
            </div>
        </header>

        {/* Main Content */}
        <main className="mt-8">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-800 text-white">
                        <th className="p-3">#</th>
                        <th className="p-3">Matrícula</th>
                        <th className="p-3">Nombre del Alumno</th>
                        <th className="p-3 text-center">Asistencia</th>
                        <th className="p-3 text-center">Faltas</th>
                        <th className="p-3 text-center">Promedio</th>
                    </tr>
                </thead>
                <tbody>
                    {reportData.map((data, index) => {
                        const lowAttendance = data.attendance.percentage < 80;
                        const lowGrade = Number(data.grade.average) < 6;
                        return (
                            <tr key={data.student.id} className="border-b border-gray-200 even:bg-gray-50">
                                <td className="p-3 text-gray-600">{index + 1}</td>
                                <td className="p-3 text-gray-700">{data.student.matricula || '-'}</td>
                                <td className="p-3 font-medium text-gray-800">{data.student.name}</td>
                                <td className={`p-3 text-center font-bold ${lowAttendance ? 'text-red-600' : 'text-green-600'}`}>
                                    {data.attendance.percentage.toFixed(1)}%
                                </td>
                                <td className="p-3 text-center text-gray-700">{data.attendance.absent}</td>
                                <td className={`p-3 text-center font-bold ${lowGrade ? 'text-red-600' : 'text-gray-800'}`}>
                                    {data.grade.average}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {reportData.length === 0 && <p className="text-center py-12 text-gray-500">No hay datos de alumnos para mostrar en este reporte.</p>}
        </main>

        {/* Footer */}
        <footer className="mt-12 pt-4 text-center text-sm text-gray-500 border-t border-gray-200">
            <p>Reporte generado por Gestión Académica IAEV</p>
        </footer>
    </div>
  );
});

export default PdfTemplate;
