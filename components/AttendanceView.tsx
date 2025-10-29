import React, { useContext, useState, useMemo, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import { getClassDates } from '../services/dateUtils';
import { STATUS_STYLES, ATTENDANCE_STATUSES } from '../constants';
import Icon from './icons/Icon';
import Modal from './common/Modal';
import Button from './common/Button';
import AttendanceTaker from './AttendanceTaker';

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
    }, [groups, selectedGroupId]); // eslint-disable-line react-hooks/exhaustive-deps

    const attendanceHeaders = useMemo(() => {
        if (!group) return null;

        const partial1End = new Date(settings.firstPartialEnd + 'T00:00:00');
        const grouped: Record<string, Record<string, string[]>> = {};

        classDates.forEach(dateStr => {
            const date = new Date(dateStr + 'T00:00:00');
            const partialName = date <= partial1End ? "Primer Parcial" : "Segundo Parcial";
            const monthName = date.toLocaleDateString('es-MX', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());

            if (!grouped[partialName]) grouped[partialName] = {};
            if (!grouped[partialName][monthName]) grouped[partialName][monthName] = [];
            grouped[partialName][monthName].push(dateStr);
        });
        return grouped;
    }, [group, classDates, settings.firstPartialEnd]);

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
    
    const todayStr = new Date().toISOString().split('T')[0];

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
                            <tr>
                                <th rowSpan={3} className="sticky left-0 bg-white dark:bg-slate-800 p-2 text-left font-semibold z-10 border-b-2 dark:border-slate-600">Alumno</th>
                                {attendanceHeaders && Object.entries(attendanceHeaders).map(([partialName, months]) => {
                                    const colspan = Object.values(months).reduce((sum, dates) => sum + dates.length, 0);
                                    return <th key={partialName} colSpan={colspan} className="p-2 font-semibold text-center text-lg border-b-2 dark:border-slate-600">{partialName}</th>
                                })}
                            </tr>
                            <tr>
                                {attendanceHeaders && Object.entries(attendanceHeaders).flatMap(([partialName, months]) => 
                                    Object.entries(months).map(([monthName, dates], index) => 
                                        <th key={`${partialName}-${monthName}`} colSpan={dates.length} 
                                        className={`p-2 font-semibold text-center border-b dark:border-slate-700 ${index % 2 === 0 ? 'bg-slate-50 dark:bg-slate-700/50' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                            {monthName}
                                        </th>
                                    )
                                )}
                            </tr>
                            <tr>
                                {classDates.map(date => (
                                    <th key={date} className={`p-2 font-semibold text-center text-sm min-w-[60px] border-b dark:border-slate-700 ${date === todayStr ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}>
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
                                            <td key={date} className={`p-0 text-center ${date === todayStr ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}>
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
                <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${group.name}`}>
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
