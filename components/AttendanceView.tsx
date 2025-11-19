import React, { useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus, Student } from '../types';
import { getClassDates } from '../services/dateUtils';
import { STATUS_STYLES, ATTENDANCE_STATUSES } from '../constants';
import Icon from './icons/Icon';
import Modal from './common/Modal';
import Button from './common/Button';
import AttendanceTaker from './AttendanceTaker';
import BulkAttendanceModal from './BulkAttendanceModal';
import AttendanceTextImporter from './AttendanceTextImporter';
import * as ReactWindow from 'react-window';
import type { ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Robust import for FixedSizeList to handle potential ESM/CJS mismatch
const List = (ReactWindow as any).FixedSizeList || (ReactWindow as any).default?.FixedSizeList || ReactWindow.FixedSizeList;

// Dimension constants
const NAME_COL_WIDTH = 250;
const DATE_COL_WIDTH = 60;
const STATS_COL_WIDTH = 100;
const ROW_HEIGHT = 50;

interface CellData {
    students: Student[];
    classDates: string[];
    attendance: { [groupId: string]: { [studentId: string]: { [date: string]: AttendanceStatus } } };
    groupId: string;
    handleStatusChange: (studentId: string, date: string, status: AttendanceStatus) => void;
    focusedCell: { r: number; c: number } | null;
    setFocusedCell: (val: { r: number; c: number } | null) => void;
    todayStr: string;
}

// Virtualized Row Component
const Row = ({ index, style, data }: ListChildComponentProps<CellData>) => {
    const { students, classDates, attendance, groupId, handleStatusChange, focusedCell, todayStr, setFocusedCell } = data;
    const student = students[index];
    
    // Real-time stats calculation
    const studentAttendance = attendance[groupId]?.[student.id] || {};
    let presentCount = 0;
    let totalPastClasses = 0;
    const todayDateObj = new Date(todayStr);

    classDates.forEach(date => {
        if (new Date(date) <= todayDateObj) {
            totalPastClasses++;
            const status = studentAttendance[date];
            if (status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified || status === AttendanceStatus.Exchange) {
                presentCount++;
            }
        }
    });
    
    const percentage = totalPastClasses > 0 ? Math.round((presentCount / totalPastClasses) * 100) : 100;
    
    // Color coding for percentage
    const percentageColor = percentage >= 90 ? 'text-emerald-600' : percentage >= 80 ? 'text-amber-600' : 'text-rose-600';

    return (
        <div style={style} className="flex items-center border-b border-border-color/70 hover:bg-surface-secondary/40 group transition-colors">
            {/* Fixed Name Column (Sticky Left) */}
            <div 
                className="sticky left-0 z-10 bg-surface group-hover:bg-surface-secondary/40 flex items-center px-3 border-r border-border-color h-full shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
            >
                <div className="truncate">
                    <p className="font-medium text-sm text-text-primary truncate">{student.name}</p>
                    {student.nickname && <p className="text-xs text-text-secondary truncate">({student.nickname})</p>}
                </div>
            </div>

            {/* Date Cells */}
            {classDates.map((date, colIndex) => {
                // Cast to AttendanceStatus to satisfy TS
                const status = (studentAttendance[date] || AttendanceStatus.Pending) as AttendanceStatus;
                const isFocused = focusedCell?.r === index && focusedCell?.c === colIndex;
                const isToday = date === todayStr;

                return (
                    <div 
                        key={date}
                        className={`flex items-center justify-center border-r border-border-color/50 h-full relative ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                        style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}
                        onClick={() => setFocusedCell({ r: index, c: colIndex })}
                    >
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const nextIndex = (ATTENDANCE_STATUSES.indexOf(status) + 1) % ATTENDANCE_STATUSES.length;
                                handleStatusChange(student.id, date, ATTENDANCE_STATUSES[nextIndex]);
                                setFocusedCell({ r: index, c: colIndex });
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                handleStatusChange(student.id, date, AttendanceStatus.Pending);
                            }}
                            className={`w-9 h-9 rounded-md text-xs font-bold transition-all duration-150 flex items-center justify-center
                                ${STATUS_STYLES[status].color}
                                ${isFocused ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface z-20 scale-110' : ''}
                            `}
                            tabIndex={-1}
                        >
                            {STATUS_STYLES[status].symbol}
                        </button>
                    </div>
                );
            })}

            {/* Fixed Global % Column (Sticky Right) */}
            <div 
                className="sticky right-0 z-10 bg-surface group-hover:bg-surface-secondary/40 flex items-center justify-center border-l border-border-color h-full shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                style={{ width: STATS_COL_WIDTH, minWidth: STATS_COL_WIDTH }}
            >
                 <span className={`font-bold text-sm ${percentageColor}`}>{percentage}%</span>
            </div>
        </div>
    );
};

const AttendanceView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, attendance, settings, selectedGroupId } = state;
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [isBulkFillOpen, setBulkFillOpen] = useState(false);
    const [isTextImporterOpen, setTextImporterOpen] = useState(false);
    
    const outerListRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<any>(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Navigation State: { r: rowIndex, c: colIndex }
    const [focusedCell, setFocusedCell] = useState<{ r: number; c: number } | null>(null);

    const setSelectedGroupId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
        setFocusedCell(null);
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

    // Horizontal Scroll Sync (Header <-> Body)
    const handleScroll = useCallback((event: any) => {
        if (headerRef.current && event.target) {
            headerRef.current.scrollLeft = event.target.scrollLeft;
        }
    }, []);
    
    useEffect(() => {
        const outerElement = outerListRef.current;
        if (outerElement) {
            outerElement.addEventListener('scroll', handleScroll);
            return () => outerElement.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll, group]);

    const handleStatusChange = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
        if (selectedGroupId) {
            dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: selectedGroupId, studentId, date, status } });
        }
    }, [selectedGroupId, dispatch]);
    
    const handleTakerStatusChange = (studentId: string, status: AttendanceStatus) => {
        handleStatusChange(studentId, todayStr, status);
    };

    // Keyboard Handling
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!group || !focusedCell) return;
        
        const { r, c } = focusedCell;
        const maxR = group.students.length - 1;
        const maxC = classDates.length - 1;

        // Movement
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (r > 0) setFocusedCell({ r: r - 1, c });
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (r < maxR) setFocusedCell({ r: r + 1, c });
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            if (c > 0) setFocusedCell({ r, c: c - 1 });
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            if (c < maxC) setFocusedCell({ r, c: c + 1 });
        }
        
        // Actions
        const keyMap: { [key: string]: AttendanceStatus } = {
            'p': AttendanceStatus.Present,
            'a': AttendanceStatus.Absent,
            'r': AttendanceStatus.Late,
            'j': AttendanceStatus.Justified,
            'i': AttendanceStatus.Exchange,
            'Delete': AttendanceStatus.Pending,
            'Backspace': AttendanceStatus.Pending,
        };
        
        if (keyMap[e.key.toLowerCase()]) {
            e.preventDefault();
            const student = group.students[r];
            const date = classDates[c];
            handleStatusChange(student.id, date, keyMap[e.key.toLowerCase()]);
        }
    };

    // Scroll to Today
    const scrollToToday = () => {
        if (!group || !outerListRef.current) return;
        
        let targetIndex = classDates.findIndex(d => d === todayStr);
        if (targetIndex === -1) {
            targetIndex = classDates.findIndex(d => new Date(d) > new Date(todayStr));
            if (targetIndex === -1) targetIndex = classDates.length - 1;
        }

        if (targetIndex !== -1) {
            const viewportWidth = outerListRef.current.clientWidth;
            // Calculate position to center the target column
            const scrollPos = (targetIndex * DATE_COL_WIDTH) - (viewportWidth / 2) + (DATE_COL_WIDTH / 2) + NAME_COL_WIDTH;
            
            outerListRef.current.scrollTo({
                left: Math.max(0, scrollPos),
                behavior: 'smooth'
            });
        }
    };

    const totalContentWidth = useMemo(() => {
        return NAME_COL_WIDTH + (classDates.length * DATE_COL_WIDTH) + STATS_COL_WIDTH;
    }, [classDates.length]);

    const renderHeader = () => {
        return (
            <div className="flex h-full text-sm font-semibold text-text-secondary">
                 {/* Name Header */}
                 <div 
                    className="sticky left-0 z-20 bg-surface border-r border-border-color flex items-center px-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
                >
                    Alumno
                </div>
                
                {/* Date Headers */}
                {classDates.map(date => {
                    const isToday = date === todayStr;
                    const dateObj = new Date(date + 'T00:00:00');
                    return (
                        <div 
                            key={date}
                            className={`flex flex-col items-center justify-center border-r border-border-color/50 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-bold' : ''}`}
                            style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}
                        >
                            <span className="text-[10px] uppercase opacity-70">{dateObj.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.','')}</span>
                            <span>{dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).split(' ')[0]}</span>
                        </div>
                    );
                })}

                {/* Global Stats Header */}
                <div 
                    className="sticky right-0 z-20 bg-surface border-l border-border-color flex items-center justify-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    style={{ width: STATS_COL_WIDTH, minWidth: STATS_COL_WIDTH }}
                >
                    Global %
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full outline-none" onKeyDown={handleKeyDown} tabIndex={0}>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4 sm:ml-auto">
                    <select
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full sm:w-64 p-2 border border-border-color rounded-md bg-surface focus:ring-2 focus:ring-primary"
                    >
                        <option value="" disabled>Selecciona un grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name} - {g.subject}</option>)}
                    </select>
                    
                     <Button onClick={scrollToToday} disabled={!group} variant="secondary" className="w-full sm:w-auto">
                        <Icon name="calendar" className="w-4 h-4" /> Ir a Hoy
                    </Button>

                    <div className="hidden md:flex gap-2">
                        <Button onClick={() => setTextImporterOpen(true)} disabled={!group} variant="secondary" size="sm">
                            <Icon name="upload-cloud" className="w-4 h-4" /> Importar
                        </Button>
                        <Button onClick={() => setBulkFillOpen(true)} disabled={!group} variant="secondary" size="sm">
                            <Icon name="grid" className="w-4 h-4" /> Relleno
                        </Button>
                        <Button onClick={() => setTakerOpen(true)} disabled={!group} size="sm">
                            <Icon name="list-checks" className="w-4 h-4" /> Pase Rápido
                        </Button>
                    </div>
                </div>
            </div>

            {group ? (
                <div className="flex-1 border border-border-color rounded-xl overflow-hidden bg-surface flex flex-col shadow-sm">
                    {/* Header Container */}
                    <div 
                        ref={headerRef}
                        className="overflow-hidden border-b-2 border-border-color bg-surface-secondary/30 flex-shrink-0"
                        style={{ height: 50 }}
                    >
                        <div style={{ width: totalContentWidth, height: '100%' }}>
                             {renderHeader()}
                        </div>
                    </div>

                    {/* Virtualized Body */}
                    <div className="flex-1 relative">
                        <AutoSizer>
                            {({ height, width }: { height: number, width: number }) => (
                                <List
                                    ref={listRef}
                                    outerRef={outerListRef}
                                    height={height}
                                    width={width}
                                    itemCount={group.students.length}
                                    itemSize={ROW_HEIGHT}
                                    itemData={{
                                        students: group.students,
                                        classDates,
                                        attendance,
                                        groupId: group.id,
                                        handleStatusChange,
                                        focusedCell,
                                        setFocusedCell,
                                        todayStr
                                    }}
                                    className="overflow-x-auto scroll-smooth"
                                    innerElementType={React.forwardRef(({ style, ...rest }: any, ref) => (
                                        <div
                                            ref={ref}
                                            style={{
                                                ...style,
                                                width: totalContentWidth,
                                                position: 'relative'
                                            }}
                                            {...rest}
                                        />
                                    ))}
                                >
                                    {Row}
                                </List>
                            )}
                        </AutoSizer>
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 bg-surface rounded-xl shadow-sm border border-border-color">
                    <Icon name="check-square" className="w-20 h-20 mx-auto text-border-color"/>
                    <p className="mt-4 text-text-secondary">Por favor, selecciona un grupo para ver el registro de asistencia.</p>
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