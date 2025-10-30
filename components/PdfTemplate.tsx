import React, { forwardRef } from 'react';
import { Group, Evaluation, GroupReportSummary, AttendanceStatus } from '../types';
import { GROUP_COLORS, STATUS_STYLES } from '../constants';
import ReportChart from './ReportChart';

interface GroupPdfTemplateProps {
  group: Group;
  groupSummary: GroupReportSummary;
  classDates: string[];
  groupAttendance: { [studentId: string]: { [date: string]: AttendanceStatus; }; };
  attendanceHeaders: Record<string, Record<string, string[]>> | null;
  groupEvaluations: Evaluation[];
  logoBase64: string;
}

const PdfTemplate = forwardRef<HTMLDivElement, GroupPdfTemplateProps>(({ 
  group, 
  groupSummary, 
  classDates, 
  groupAttendance, 
  attendanceHeaders, 
  groupEvaluations, 
  logoBase64 
}, ref) => {
  
  const groupColor = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];

  return (
    <div ref={ref} className="bg-white font-sans text-slate-800" style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}>
      <div className="p-10">
        {/* Header */}
        <header className={`p-6 rounded-xl ${groupColor.bg} ${groupColor.text}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    {logoBase64 && <img src={logoBase64} alt="Logo" style={{ width: '56px', height: '56px' }} />}
                    <div>
                        <h1 className="text-4xl font-bold">Reporte de Grupo</h1>
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
            <section className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Resumen del Grupo</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <span className="text-sm font-medium text-slate-500">Total de Alumnos</span>
                        <p className="mt-1 text-3xl font-bold text-slate-900">{group.students.length}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <span className="text-sm font-medium text-slate-500">Evaluaciones</span>
                        <p className="mt-1 text-3xl font-bold text-blue-600">{groupEvaluations.length}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 text-center">
                        <span className="text-sm font-medium text-slate-500">Días de Clase</span>
                        <p className="mt-1 text-3xl font-bold text-green-600">{classDates.length}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-center mb-2">Asistencia Mensual (Promedio)</h3>
                    {groupSummary && Object.keys(groupSummary.monthlyAttendance).length > 0 ? (
                        <ReportChart monthlyAttendance={groupSummary.monthlyAttendance} />
                    ) : (
                        <p className="text-center text-slate-500 py-8">No hay datos de asistencia.</p>
                    )}
                </div>
            </section>

            {/* --- Detailed Attendance Grid Page(s) --- */}
            <section style={{ breakBefore: 'page' }}>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Registro Detallado de Asistencia</h2>
                <table className="w-full border-collapse text-[6px]">
                  <thead>
                      <tr>
                          <th rowSpan={3} className="sticky left-0 bg-white p-1 text-left font-semibold z-10 border-b-2 border-slate-600 align-bottom">Alumno</th>
                          {attendanceHeaders && Object.entries(attendanceHeaders).map(([partialName, months]) => {
                              const colspan = Object.values(months).reduce((sum, dates) => sum + dates.length, 0);
                              return <th key={partialName} colSpan={colspan} className="p-1 font-semibold text-center text-base border-b-2 border-slate-600">{partialName}</th>
                          })}
                      </tr>
                      <tr>
                          {attendanceHeaders && Object.entries(attendanceHeaders).flatMap(([partialName, months]) => 
                              Object.entries(months).map(([monthName, dates]) => 
                                  <th key={`${partialName}-${monthName}`} colSpan={dates.length} 
                                  className="p-1 font-semibold text-center border-b border-slate-400 bg-slate-50 text-sm">
                                      {monthName}
                                  </th>
                              )
                          )}
                      </tr>
                      <tr>
                          {classDates.map(date => (
                              <th key={date} className="p-1 font-semibold text-center min-w-[10px] border-b border-slate-400 align-bottom" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                  {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {group.students.map(student => (
                          <tr key={student.id} className="border-b border-slate-200">
                              <td className="sticky left-0 bg-white p-1 font-semibold z-10 whitespace-nowrap text-[8px]">{student.name}</td>
                              {classDates.map(date => {
                                  const status = groupAttendance[student.id]?.[date] || AttendanceStatus.Pending;
                                  // Use a simplified color for PDF to save ink and improve clarity
                                  const simpleColor = {
                                      [AttendanceStatus.Present]: 'bg-green-100',
                                      [AttendanceStatus.Absent]: 'bg-red-100',
                                      [AttendanceStatus.Late]: 'bg-yellow-100',
                                      [AttendanceStatus.Justified]: 'bg-blue-100',
                                      [AttendanceStatus.Exchange]: 'bg-purple-100',
                                      [AttendanceStatus.Pending]: 'bg-slate-100',
                                  };
                                  return (
                                      <td key={date} className={`p-0 text-center border-l border-slate-200 ${simpleColor[status]}`}>
                                          <div className="w-full h-5 flex items-center justify-center font-bold">
                                              {STATUS_STYLES[status].symbol}
                                          </div>
                                      </td>
                                  );
                              })}
                          </tr>
                      ))}
                  </tbody>
              </table>
            </section>
        </main>

        <footer className="mt-12 text-center text-xs text-slate-400 border-t pt-4">
            <p>Reporte generado por Gestión Académica IAEV</p>
        </footer>
      </div>
    </div>
  );
});

export default PdfTemplate;