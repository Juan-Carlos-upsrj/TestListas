import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Group, AttendanceStatus } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import Icon from './icons/Icon';

interface AttendanceTextImporterProps {
    isOpen: boolean;
    onClose: () => void;
    group: Group;
}

const AttendanceTextImporter: React.FC<AttendanceTextImporterProps> = ({ isOpen, onClose, group }) => {
    const { dispatch } = useContext(AppContext);
    const [pastedText, setPastedText] = useState('');
    const [error, setError] = useState('');

    const promptText = `Actúa como un asistente experto en extracción de datos. Te proporcionaré una imagen de una lista de asistencia. Tu tarea es analizarla y devolver un objeto JSON con la siguiente estructura:
{
  "attendanceRecords": [
    { "studentName": "Nombre del Alumno", "date": "YYYY-MM-DD", "status": "Estado" }
  ]
}

Reglas de Mapeo de Estado:
- Si ves 'P', una palomita (✓), o está presente, usa "Presente".
- Si ves 'A', 'F', una cruz (X), o está ausente, usa "Ausente".
- Si ves 'R' o 'T', usa "Retardo".
- Si ves 'J', usa "Justificado".
- Si ves 'I', usa "Intercambio".
- Si una celda está vacía o no es clara, omite ese registro.

Analiza la imagen completa y extrae todos los registros de asistencia posibles. El formato de fecha debe ser YYYY-MM-DD. Asegúrate de que el resultado sea un JSON válido y no incluyas texto adicional fuera del bloque JSON.`;

    const handleImport = () => {
        setError('');
        if (!pastedText.trim()) {
            setError('El campo de texto está vacío.');
            return;
        }

        let data;
        try {
            data = JSON.parse(pastedText);
            if (!data.attendanceRecords || !Array.isArray(data.attendanceRecords)) {
                throw new Error("El JSON no contiene la clave 'attendanceRecords' o no es un array.");
            }
        } catch (e) {
            setError('Texto inválido. Asegúrate de pegar el JSON exacto. Error: ' + (e as Error).message);
            return;
        }

        const studentMap = new Map(group.students.map(s => [s.name.toLowerCase().trim(), s.id]));
        const validRecords: { studentId: string; date: string; status: AttendanceStatus }[] = [];
        let unmatchedNames = 0;
        const validStatuses = Object.values(AttendanceStatus);

        for (const record of data.attendanceRecords) {
            const studentId = studentMap.get(record.studentName?.toLowerCase().trim());
            if (studentId) {
                if (record.date && record.status && validStatuses.includes(record.status as AttendanceStatus)) {
                    validRecords.push({
                        studentId,
                        date: record.date,
                        status: record.status as AttendanceStatus,
                    });
                }
            } else {
                unmatchedNames++;
            }
        }

        if (validRecords.length === 0) {
            setError(`No se encontraron registros válidos o los nombres no coinciden con los alumnos del grupo. Nombres no encontrados: ${unmatchedNames}.`);
            return;
        }

        const confirmationMessage = `Se importarán ${validRecords.length} registros de asistencia. ${unmatchedNames > 0 ? `${unmatchedNames} nombres no coincidieron y serán ignorados.` : ''} ¿Deseas continuar?`;
        
        if (window.confirm(confirmationMessage)) {
            dispatch({
                type: 'BULK_SET_ATTENDANCE',
                payload: { groupId: group.id, records: validRecords }
            });
            dispatch({ type: 'ADD_TOAST', payload: { message: `${validRecords.length} registros importados.`, type: 'success' } });
            handleClose();
        }
    };

    const handleClose = () => {
        setPastedText('');
        setError('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Importar Asistencia desde Texto" size="xl">
            <div className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2 text-lg">Paso 1: Genera los datos con IA</h3>
                    <p className="text-sm text-slate-500 mb-2">Copia el siguiente prompt, ve a Gemini (o tu IA preferida), sube la imagen de tu lista de asistencia y pega el prompt.</p>
                    <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-md text-xs whitespace-pre-wrap font-mono ring-1 ring-slate-200 dark:ring-slate-700">
                        {promptText}
                    </pre>
                    <Button size="sm" variant="secondary" className="mt-2" onClick={() => navigator.clipboard.writeText(promptText)}>
                        <Icon name="edit-3" className="w-4 h-4"/> Copiar Prompt
                    </Button>
                </div>
                <div>
                    <h3 className="font-semibold mb-2 text-lg">Paso 2: Pega el resultado JSON aquí</h3>
                    <p className="text-sm text-slate-500 mb-2">Copia la respuesta JSON completa que te dio la IA y pégala en el siguiente cuadro de texto.</p>
                    <textarea
                        value={pastedText}
                        onChange={e => setPastedText(e.target.value)}
                        rows={10}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                        placeholder='Pega aquí el objeto JSON, ej: { "attendanceRecords": [...] }'
                        aria-label="Pegar resultado JSON"
                    />
                </div>
                {error && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-sm rounded-md">
                        {error}
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleImport} disabled={!pastedText}>
                    <Icon name="upload-cloud" className="w-4 h-4"/> Verificar e Importar
                </Button>
            </div>
        </Modal>
    );
};

export default AttendanceTextImporter;
