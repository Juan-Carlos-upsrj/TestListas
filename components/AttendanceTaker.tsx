import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AttendanceStatus, Student } from '../types';
import { STATUS_STYLES, ATTENDANCE_STATUSES } from '../constants';
import Icon from './icons/Icon';
import Button from './common/Button';

interface AttendanceTakerProps {
    students: Student[];
    date: string;
    groupAttendance: { [studentId: string]: { [date: string]: AttendanceStatus } };
    onStatusChange: (studentId: string, status: AttendanceStatus) => void;
    onClose: () => void;
}

const AttendanceTaker: React.FC<AttendanceTakerProps> = ({ students, date, groupAttendance, onStatusChange, onClose }) => {
    // FIX: Replaced useState with useMemo. The previous implementation with useState caused a stale state issue
    // where the list of pending students was not updated when props changed (e.g., after taking attendance for a student).
    // This led to incorrect behavior and could cause the application to crash. useMemo ensures the list is always up-to-date.
    const pendingStudents = useMemo(() =>
        students.filter(s => {
            const status = groupAttendance[s.id]?.[date];
            return !status || status === AttendanceStatus.Pending;
        }),
        [students, groupAttendance, date]
    );

    const [currentIndex, setCurrentIndex] = useState(0);

    // Memoize callbacks to ensure they are stable and don't cause unnecessary re-renders or effect re-runs.
    const goToNext = useCallback(() => {
        if (currentIndex < pendingStudents.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    }, [currentIndex, pendingStudents.length, onClose]);

    const handleSetStatus = useCallback((status: AttendanceStatus) => {
        const currentStudent = pendingStudents[currentIndex];
        if (currentStudent) {
            onStatusChange(currentStudent.id, status);
        }
        goToNext();
    }, [currentIndex, pendingStudents, onStatusChange, goToNext]);
    
    // FIX: This useEffect hook is now placed before any conditional returns, adhering to the Rules of Hooks.
    // It also uses memoized callbacks (useCallback) with a correct dependency array to prevent stale closures.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Do not process keys if there are no students to take attendance for.
            if (pendingStudents.length === 0) return;

            const keyMap: { [key: string]: AttendanceStatus } = {
                'p': AttendanceStatus.Present,
                'a': AttendanceStatus.Absent,
                'r': AttendanceStatus.Late,
                'j': AttendanceStatus.Justified,
                'i': AttendanceStatus.Exchange,
            };
            if (keyMap[e.key.toLowerCase()]) {
                handleSetStatus(keyMap[e.key.toLowerCase()]);
            } else if (e.key === 's' || e.key === 'ArrowRight') {
                goToNext();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSetStatus, goToNext, pendingStudents.length]);

    // Conditional return for when all attendance is taken.
    if (pendingStudents.length === 0) {
        return (
            <div className="text-center p-4">
                <Icon name="check-circle-2" className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold my-4">¡Todo listo!</h3>
                <p className="text-slate-500 mb-6">Todos los alumnos ya tienen un estado de asistencia para hoy.</p>
                <Button onClick={onClose}>Cerrar</Button>
            </div>
        );
    }
    
    // FIX: Add a guard to prevent crashes if currentIndex becomes invalid (e.g., if the list shrinks).
    const currentStudent = pendingStudents[currentIndex];
    if (!currentStudent) {
        // This can happen briefly if the list shrinks and the index is temporarily out of bounds.
        // Returning null allows React to re-render with a corrected state.
        return null;
    }

    const currentStatus = groupAttendance[currentStudent.id]?.[date] || AttendanceStatus.Pending;

    return (
        <div className="text-center p-4">
            <p className="text-sm text-slate-500">Pase de lista para: {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
            <p className="text-slate-400 text-sm">Alumno {currentIndex + 1} de {pendingStudents.length}</p>
            <h3 className="text-3xl font-bold my-4">{currentStudent.name}</h3>
            <p className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-6 ${STATUS_STYLES[currentStatus].color}`}>
                Estado actual: {currentStatus}
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {ATTENDANCE_STATUSES.map(status => (
                    <Button key={status} onClick={() => handleSetStatus(status)} className={`${STATUS_STYLES[status].color} !py-3 !text-base`}>
                        ({STATUS_STYLES[status].key}) {status}
                    </Button>
                ))}
            </div>
             <Button variant="secondary" onClick={goToNext} className="w-full">
                (S) Saltar / Siguiente <Icon name="arrow-right" className="w-4 h-4" />
            </Button>
            <p className="text-xs text-slate-400 mt-4">Usa los atajos de teclado para un pase de lista más rápido.</p>
        </div>
    );
};

export default AttendanceTaker;