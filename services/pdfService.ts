import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Group, Student } from '../types';

// The type for HookData seems to be causing issues with the current setup.
// Defining a minimal interface for the hook data based on its usage in this file.
interface HookData {
  pageNumber: number;
  settings: {
    margin: {
      left: number;
      right: number;
    }
  };
  // Add other properties from HookData if needed in the future, e.g., doc, table, pageCount, cursor
}

// Extend jsPDF with the autoTable plugin
// FIX: Using an intersection type for better compatibility with class-based types, which resolves the errors about missing properties on the custom type.
type jsPDFWithAutoTable = jsPDF & {
  autoTable: (options: any) => jsPDF;
};

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

export const exportReportToPDF = (group: Group, reportData: ReportData[]) => {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const tableColumn = ["#", "Matrícula", "Nombre", "Asistencia (%)", "Faltas", "Retardos", "Promedio"];
  const tableRows: (string | number)[][] = [];

  reportData.forEach((data, index) => {
    const rowData = [
      index + 1,
      data.student.matricula || '-',
      data.student.name,
      `${data.attendance.percentage.toFixed(1)}%`,
      data.attendance.absent,
      data.attendance.late,
      data.grade.average,
    ];
    tableRows.push(rowData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    theme: 'striped',
    headStyles: {
      fillColor: [22, 163, 74] // green-600 color
    },
    didDrawPage: (data: HookData) => {
      // Header
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text('Reporte de Desempeño Académico', 14, 22);
      doc.setFontSize(12);
      doc.text(`Grupo: ${group.name} - ${group.subject}`, 14, 30);

      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(`Página ${data.pageNumber} de ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      doc.text(new Date().toLocaleDateString('es-ES'), doc.internal.pageSize.width - data.settings.margin.right - 30, doc.internal.pageSize.height - 10);
    },
  });

  doc.save(`reporte_${group.name.replace(/\s/g, '_')}.pdf`);
};