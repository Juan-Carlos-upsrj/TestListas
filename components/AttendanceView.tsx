import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus } from '../types';
import { getClassDates } from '../services/dateUtils';
import { STATUS_STYLES, ATTENDANCE_STATUSES } from '../constants';
import Icon from './icons/Icon';
import Modal from './common/Modal';
import Button from './common/Button';
import AttendanceTaker from './AttendanceTaker';
import BulkAttendanceModal from './BulkAttendanceModal';
import AttendanceTextImporter from './AttendanceTextImporter';

const AttendanceView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, attendance, settings, selectedGroupId } = state;
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [isBulkFillOpen, setBulkFillOpen] = useState(false);
    const [isTextImporterOpen, setTextImporterOpen] = useState(false);
    
    // Fix for timezone bug: Use local date methods instead of UTC-based toISOString()
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const setSelectedGroupId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
    }, [dispatch]);

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
    }, [groups, selectedGroupId, setSelectedGroupId]);

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
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4 sm:ml-auto">
                    <select
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full sm:w-64 p-2 border border-border-color rounded-md bg-surface focus:ring-2 focus:ring-primary"
                    >
                        <option value="" disabled>Selecciona un grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <Button onClick={() => setTextImporterOpen(true)} disabled={!group} variant="secondary" className="w-full sm:w-auto">
                        <Icon name="upload-cloud" /> Importar desde Texto
                    </Button>
                    <Button onClick={() => setBulkFillOpen(true)} disabled={!group} variant="secondary" className="w-full sm:w-auto">
                        <Icon name="grid" /> Relleno Rápido
                    </Button>
                    <Button onClick={() => setTakerOpen(true)} disabled={!group} className="w-full sm:w-auto">
                        <Icon name="list-checks" /> Pase de Lista Hoy
                    </Button>
                </div>
            </div>

            {group ? (
                <div className="bg-surface p-4 rounded-xl shadow-sm border border-border-color overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th rowSpan={3} className="sticky left-0 bg-surface p-2 text-left font-semibold z-10 border-b-2 border-border-color">Alumno</th>
                                {attendanceHeaders && Object.entries(attendanceHeaders).map(([partialName, months]) => {
                                    const colspan = Object.values(months).reduce((sum, dates) => sum + dates.length, 0);
                                    return <th key={partialName} colSpan={colspan} className="p-2 font-semibold text-center text-lg border-b-2 border-border-color">{partialName}</th>
                                })}
                            </tr>
                            <tr>
                                {attendanceHeaders && Object.entries(attendanceHeaders).flatMap(([partialName, months]) => 
                                    Object.entries(months).map(([monthName, dates], index) => 
                                        <th key={`${partialName}-${monthName}`} colSpan={dates.length} 
                                        className={`p-2 font-semibold text-center border-b border-border-color ${index % 2 === 0 ? 'bg-surface-secondary/70' : 'bg-surface-secondary/40'}`}>
                                            {monthName}
                                        </th>
                                    )
                                )}
                            </tr>
                            <tr>
                                {classDates.map(date => (
                                    <th key={date} className={`p-2 font-semibold text-center text-sm min-w-[60px] border-b border-border-color ${date === todayStr ? 'bg-accent-blue-light dark:bg-accent-blue/20' : ''}`}>
                                        {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {group.students.map(student => (
                                <tr key={student.id} className="border-b border-border-color/70 hover:bg-surface-secondary/40">
                                    <td className="sticky left-0 bg-surface p-2 font-medium z-10 whitespace-nowrap">{student.name} {student.nickname && <span className="font-normal text-text-secondary">({student.nickname})</span>}</td>
                                    {classDates.map(date => {
                                        const status = attendance[group.id]?.[student.id]?.[date] || AttendanceStatus.Pending;
                                        return (
                                            <td key={date} className={`p-0 text-center ${date === todayStr ? 'bg-accent-blue-light/30 dark:bg-accent-blue/10' : ''}`}>
                                                <button
                                                    onClick={() => handleStatusChange(student.id, date, getNextStatus(status))}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        handleStatusChange(student.id, date, AttendanceStatus.Pending);
                                                    }}
                                                    className={`w-full h-10 text-xs transition-transform transform hover:scale-110 ${STATUS_STYLES[status].color}`}
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
                <div className="text-center py-20 bg-surface rounded-xl shadow-sm border border-border-color">
                    <Icon name="check-square" className="w-20 h-20 mx-auto text-border-color"/>
                    <p className="mt-4 text-text-secondary">Por favor, selecciona un grupo para ver el registro de asistencia.</p>
                    {groups.length === 0 && <p className="text-text-secondary/70">Primero necesitas crear un grupo en la sección 'Grupos'.</p>}
                </div>
            )}
             {group && (
                <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${group.name}`}>
                    <AttendanceTaker 
                        students={group.students} 
                        date={todayStr} 
                        groupAttendance={attendance[group.id] || {}}
                        onStatusChange={handleTakerStatusChange}
                        onClose={() => setTakerOpen(false)}
                    />
                </Modal>
             )}
             {group && (
                <BulkAttendanceModal
                    isOpen={isBulkFillOpen}
                    onClose={() => setBulkFillOpen(false)}
                    group={group}
                />
             )}
             {group && (
                <AttendanceTextImporter
                    isOpen={isTextImporterOpen}
                    onClose={() => setTextImporterOpen(false)}
                    group={group}
                />
             )}
        </div>
    );
};

export default AttendanceView;