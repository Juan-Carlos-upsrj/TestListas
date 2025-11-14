import { Group, Evaluation, AttendanceStatus } from '../types';

function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export const exportAttendanceToCSV = (
    group: Group,
    classDates: string[],
    attendance: { [studentId: string]: { [date: string]: AttendanceStatus } }
) => {
    let csvRows = [];
    
    // Header
    const header = ['Matrícula', 'Nombre', ...classDates];
    csvRows.push(header.join(','));

    // Rows
    group.students.forEach(student => {
        const row = [
            student.matricula || '',
            `"${student.name}"`,
            ...classDates.map(date => {
                const status = attendance[student.id]?.[date] || AttendanceStatus.Pending;
                switch(status) {
                    case AttendanceStatus.Present: return 'P';
                    case AttendanceStatus.Absent: return 'A';
                    case AttendanceStatus.Late: return 'R';
                    case AttendanceStatus.Justified: return 'J';
                    case AttendanceStatus.Exchange: return 'I';
                    default: return '';
                }
            })
        ];
        csvRows.push(row.join(','));
    });
    
    downloadCSV(csvRows.join('\r\n'), `asistencia_${group.name.replace(/\s/g, '_')}.csv`);
};

export const exportGradesToCSV = (
    group: Group,
    evaluations: Evaluation[],
    grades: { [studentId: string]: { [evaluationId: string]: number | null } }
) => {
    let csvRows = [];

    // Header
    const header = ['Matrícula', 'Nombre', ...evaluations.map(e => `"${e.name} (${e.maxScore} pts)"`)];
    csvRows.push(header.join(','));

    // Rows
    group.students.forEach(student => {
        const row = [
            student.matricula || '',
            `"${student.name}"`,
            ...evaluations.map(ev => {
                const grade = grades[student.id]?.[ev.id];
                return grade !== undefined && grade !== null ? grade.toString() : '';
            })
        ];
        csvRows.push(row.join(','));
    });

    downloadCSV(csvRows.join('\r\n'), `calificaciones_${group.name.replace(/\s/g, '_')}.csv`);
};