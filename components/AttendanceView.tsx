
import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Group, AttendanceStatus, Student } from '../types';
import { getClassDates } from '../services/dateUtils';
import { STATUS_STYLES, ATTENDANCE_STATUSES } from '../constants';
import Icon from './icons/Icon';
import Modal from './common/Modal';
import Button from './common/Button';

const AttendanceTaker: React.FC<{
    students: Student[];
    date: string;
    groupAttendance: { [studentId: string]: { [date: string]: AttendanceStatus } };
    onStatusChange: (studentId: string, status: AttendanceStatus) => void;
    onClose: () => void;
}> = ({ students, date, groupAttendance, onStatusChange, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentStudent = students[currentIndex];

    const handleSetStatus = (status: AttendanceStatus) => {
        onStatusChange(currentStudent.id, status);
        goToNext();
    };

    const goToNext = () => {
        if (currentIndex < students.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            onClose();
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
    }, [currentIndex, students]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!currentStudent) return null;

    const currentStatus = groupAttendance[currentStudent.id]?.[date] || AttendanceStatus.Pending;

    return (
        <div className="text-center p-4">
            <p className="text-sm text-slate-500">Pase de lista para: {new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
            <p className="text-slate-400 text-sm">Alumno {currentIndex + 1} de {students.length}</p>
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

const AttendanceView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, attendance, settings, selectedGroupId } = state;
    const [isTakerOpen, setTakerOpen] = useState(false);
    
    const setSelectedGroupId = (id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
    };

    const group = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

    const classDates = useMemo(() => {
        if (group) {
            return getClassDates(settings.semesterStart, settings.semesterEnd, group.classDays);
        }
        return [];
    }, [group, settings.semesterStart, settings.semesterEnd]);
    
    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleStatusChange = (studentId: string, date: string, status: AttendanceStatus) => {
        if (selectedGroupId) {
            dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: selectedGroupId, studentId, date, status } });
        }
    };
    
    const handleTakerStatusChange = (studentId: string, status: AttendanceStatus) => {
        const todayStr = new Date().toISOString().split('T')[0];
        handleStatusChange(studentId, todayStr, status);
    };

    const getNextStatus = (currentStatus: AttendanceStatus): AttendanceStatus => {
        if (currentStatus === AttendanceStatus.Pending) return AttendanceStatus.Present;
        const currentIndex = ATTENDANCE_STATUSES.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % ATTENDANCE_STATUSES.length;
        return ATTENDANCE_STATUSES[nextIndex];
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Registro de Asistencia</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full sm:w-64 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="" disabled>Selecciona un grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <Button onClick={() => setTakerOpen(true)} disabled={!group}>
                        <Icon name="list-checks" /> Pase de Lista Hoy
                    </Button>
                </div>
            </div>

            {group ? (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                <th className="sticky left-0 bg-white dark:bg-slate-800 p-2 text-left font-semibold z-10">Alumno</th>
                                {classDates.map(date => (
                                    <th key={date} className="p-2 font-semibold text-center text-sm min-w-[60px]">
                                        {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {group.students.map(student => (
                                <tr key={student.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="sticky left-0 bg-white dark:bg-slate-800 p-2 font-medium z-10 whitespace-nowrap">{student.name}</td>
                                    {classDates.map(date => {
                                        const status = attendance[group.id]?.[student.id]?.[date] || AttendanceStatus.Pending;
                                        return (
                                            <td key={date} className="p-0 text-center">
                                                <button
                                                    onClick={() => handleStatusChange(student.id, date, getNextStatus(status))}
                                                    className={`w-full h-10 text-xs font-bold transition-transform transform hover:scale-110 ${STATUS_STYLES[status].color}`}
                                                >
                                                    {STATUS_STYLES[status].symbol}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                    <Icon name="check-square" className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600"/>
                    <p className="mt-4 text-slate-500">Por favor, selecciona un grupo para ver el registro de asistencia.</p>
                    {groups.length === 0 && <p className="text-slate-400">Primero necesitas crear un grupo en la sección 'Grupos'.</p>}
                </div>
            )}
             {group && (
                <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title="Pase de Lista Rápido">
                    <AttendanceTaker 
                        students={group.students} 
                        date={new Date().toISOString().split('T')[0]} 
                        groupAttendance={attendance[group.id] || {}}
                        onStatusChange={handleTakerStatusChange}
                        onClose={() => setTakerOpen(false)}
                    />
                </Modal>
             )}
        </div>
    );
};

export default AttendanceView;
