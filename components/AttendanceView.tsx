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

// Robust import for FixedSizeList
const List = (ReactWindow as any).FixedSizeList || (ReactWindow as any).default?.FixedSizeList || ReactWindow.FixedSizeList;

// Dimension constants
const NAME_COL_WIDTH = 250;
const DATE_COL_WIDTH = 50; // Reduced slightly to fit more
const STAT_COL_WIDTH = 60; // Width for each stat column (P1, P2, Global)
const ROW_HEIGHT = 45;

interface Coords { r: number; c: number; }

interface CellData {
    students: Student[];
    classDates: string[];
    attendance: { [groupId: string]: { [studentId: string]: { [date: string]: AttendanceStatus } } };
    groupId: string;
    handleStatusChange: (studentId: string, date: string, status: AttendanceStatus) => void;
    focusedCell: Coords | null;
    selection: { start: Coords | null; end: Coords | null; isDragging: boolean };
    todayStr: string;
    firstPartialEnd: string; // Passed for calculation
    onMouseDown: (r: number, c: number) => void;
    onMouseEnter: (r: number, c: number) => void;
}

// --- Helper to calculate percentage ---
const calculatePercentage = (
    studentAttendance: { [date: string]: AttendanceStatus },
    dates: string[]
): { percent: number; valid: boolean } => {
    let present = 0;
    let total = 0;
    dates.forEach(date => {
        const status = studentAttendance[date];
        // Only count dates that have passed or are today? Usually we calculate based on dates *taken* or all dates up to now.
        // For simplicity, we count all dates in the range.
        // If you want to count only dates with status != Pending, change logic here.
        // Current logic: Count all dates in the column list (which are usually dates up to today or semester end)
        // But normally attendance is percentage of *classes passed*.
        if (new Date(date) <= new Date()) {
             total++;
             if (status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified || status === AttendanceStatus.Exchange) {
                present++;
            }
        }
    });
    return {
        percent: total > 0 ? Math.round((present / total) * 100) : 100,
        valid: total > 0
    };
};

// Virtualized Row Component
const Row = ({ index, style, data }: ListChildComponentProps<CellData>) => {
    const { 
        students, classDates, attendance, groupId, 
        focusedCell, selection, todayStr, firstPartialEnd,
        onMouseDown, onMouseEnter
    } = data;
    
    const student = students[index];
    const studentAttendance = attendance[groupId]?.[student.id] || {};
    
    // --- Statistics Calculation ---
    const p1End = new Date(firstPartialEnd);
    
    const p1Dates = classDates.filter(d => new Date(d) <= p1End);
    const p2Dates = classDates.filter(d => new Date(d) > p1End);
    
    const p1Stats = calculatePercentage(studentAttendance, p1Dates);
    const p2Stats = calculatePercentage(studentAttendance, p2Dates);
    const globalStats = calculatePercentage(studentAttendance, classDates);

    const getScoreColor = (pct: number) => pct >= 90 ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-rose-600';

    // Check if row is involved in selection for highlighting logic
    const isRowInSelection = selection.start && selection.end && 
        index >= Math.min(selection.start.r, selection.end.r) && 
        index <= Math.max(selection.start.r, selection.end.r);

    return (
        <div style={style} className={`flex items-center border-b border-border-color/70 hover:bg-surface-secondary/40 transition-colors ${isRowInSelection ? 'bg-blue-50/30' : ''}`}>
            {/* Fixed Name Column (Sticky Left) */}
            <div 
                className="sticky left-0 z-10 bg-surface flex items-center px-3 border-r border-border-color h-full shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
            >
                <div className="truncate w-full">
                    <p className="font-medium text-sm text-text-primary truncate">{student.name}</p>
                    {student.nickname && <p className="text-xs text-text-secondary truncate">({student.nickname})</p>}
                </div>
            </div>

            {/* Date Cells */}
            {classDates.map((date, colIndex) => {
                const status = (studentAttendance[date] || AttendanceStatus.Pending) as AttendanceStatus;
                const isFocused = focusedCell?.r === index && focusedCell?.c === colIndex;
                const isToday = date === todayStr;

                // Selection Check
                let isSelected = false;
                if (selection.start && selection.end) {
                    const minR = Math.min(selection.start.r, selection.end.r);
                    const maxR = Math.max(selection.start.r, selection.end.r);
                    const minC = Math.min(selection.start.c, selection.end.c);
                    const maxC = Math.max(selection.start.c, selection.end.c);
                    if (index >= minR && index <= maxR && colIndex >= minC && colIndex <= maxC) {
                        isSelected = true;
                    }
                }

                return (
                    <div 
                        key={date}
                        className={`flex items-center justify-center border-r border-border-color/50 h-full relative select-none
                            ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                            ${isSelected ? 'bg-blue-200/50 dark:bg-blue-800/50' : ''}
                        `}
                        style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}
                        onMouseDown={() => onMouseDown(index, colIndex)}
                        onMouseEnter={() => onMouseEnter(index, colIndex)}
                    >
                        {/* Visual Indicator (Symbol) */}
                         <div
                            className={`w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center pointer-events-none
                                ${STATUS_STYLES[status].color}
                                ${isFocused ? 'ring-2 ring-primary ring-offset-2 ring-offset-surface z-20 scale-110' : ''}
                            `}
                        >
                            {STATUS_STYLES[status].symbol}
                        </div>
                    </div>
                );
            })}

            {/* Fixed Stats Columns (Sticky Right) */}
            
            {/* P1 % */}
            <div 
                className="sticky z-10 bg-amber-50/80 dark:bg-amber-900/20 flex items-center justify-center border-l border-border-color h-full font-mono text-xs"
                style={{ right: STAT_COL_WIDTH * 2, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}
            >
                 <span className={getScoreColor(p1Stats.percent)}>{p1Stats.percent}%</span>
            </div>
            
             {/* P2 % */}
            <div 
                className="sticky z-10 bg-sky-50/80 dark:bg-sky-900/20 flex items-center justify-center border-l border-border-color h-full font-mono text-xs"
                style={{ right: STAT_COL_WIDTH, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}
            >
                 <span className={getScoreColor(p2Stats.percent)}>{p2Stats.percent}%</span>
            </div>

            {/* Global % */}
            <div 
                className="sticky right-0 z-10 bg-surface flex items-center justify-center border-l-2 border-border-color h-full font-bold text-sm shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                style={{ width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}
            >
                 <span className={getScoreColor(globalStats.percent)}>{globalStats.percent}%</span>
            </div>
        </div>
    );
};

const AttendanceView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, attendance, settings, selectedGroupId } = state;
    
    // State for Modals
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [isBulkFillOpen, setBulkFillOpen] = useState(false);
    const [isTextImporterOpen, setTextImporterOpen] = useState(false);
    
    // Refs for Scrolling
    const outerListRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<any>(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Selection & Focus State
    const [focusedCell, setFocusedCell] = useState<Coords | null>(null);
    const [selection, setSelection] = useState<{ start: Coords | null; end: Coords | null; isDragging: boolean }>({
        start: null,
        end: null,
        isDragging: false
    });

    const setSelectedGroupId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
        setFocusedCell(null);
        setSelection({ start: null, end: null, isDragging: false });
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

    // --- SCROLL SYNC LOGIC ---
    // We attach a listener to the OUTER element of the FixedSizeList to catch horizontal scroll
    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement;
            if (headerRef.current) {
                headerRef.current.scrollLeft = target.scrollLeft;
            }
        };

        const listContainer = outerListRef.current;
        if (listContainer) {
            listContainer.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (listContainer) {
                listContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [group]); // Re-bind if group changes

    const handleStatusChange = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
        if (selectedGroupId) {
            dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: selectedGroupId, studentId, date, status } });
        }
    }, [selectedGroupId, dispatch]);

    // --- MOUSE INTERACTION LOGIC ---
    const handleMouseDown = useCallback((r: number, c: number) => {
        setSelection({ start: { r, c }, end: { r, c }, isDragging: true });
        setFocusedCell({ r, c });
    }, []);

    const handleMouseEnter = useCallback((r: number, c: number) => {
        setSelection(prev => {
            if (prev.isDragging) {
                return { ...prev, end: { r, c } };
            }
            return prev;
        });
    }, []);

    useEffect(() => {
        const handleMouseUp = () => {
            setSelection(prev => ({ ...prev, isDragging: false }));
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // --- KEYBOARD LOGIC ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!group) return;
            
            // 1. Navigation
            if (focusedCell) {
                const { r, c } = focusedCell;
                const maxR = group.students.length - 1;
                const maxC = classDates.length - 1;
                
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const newR = Math.max(0, r - 1);
                    setFocusedCell({ r: newR, c });
                    if (listRef.current) listRef.current.scrollToItem(newR);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const newR = Math.min(maxR, r + 1);
                    setFocusedCell({ r: newR, c });
                     if (listRef.current) listRef.current.scrollToItem(newR);
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    setFocusedCell({ r, c: Math.max(0, c - 1) });
                    // Horizontal scroll is manual, difficult to auto-scroll precisely with react-window fixedlist without ref manipulation
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    setFocusedCell({ r, c: Math.min(maxC, c + 1) });
                }
            }

            // 2. Data Entry (Apply to Selection or Focused Cell)
            const keyMap: { [key: string]: AttendanceStatus } = {
                'p': AttendanceStatus.Present,
                'a': AttendanceStatus.Absent,
                'r': AttendanceStatus.Late,
                'j': AttendanceStatus.Justified,
                'i': AttendanceStatus.Exchange,
                'Delete': AttendanceStatus.Pending,
                'Backspace': AttendanceStatus.Pending,
            };

            const statusToApply = keyMap[e.key.toLowerCase()];

            if (statusToApply && selectedGroupId) {
                e.preventDefault();
                
                // Determine range to update
                let updateRange: { r: number, c: number }[] = [];
                
                if (selection.start && selection.end) {
                     const minR = Math.min(selection.start.r, selection.end.r);
                     const maxR = Math.max(selection.start.r, selection.end.r);
                     const minC = Math.min(selection.start.c, selection.end.c);
                     const maxC = Math.max(selection.start.c, selection.end.c);
                     
                     for (let r = minR; r <= maxR; r++) {
                         for (let c = minC; c <= maxC; c++) {
                             updateRange.push({ r, c });
                         }
                     }
                } else if (focusedCell) {
                    updateRange.push(focusedCell);
                }

                // Batch update via dispatch needed? 
                // Dispatching many individual actions might be slow. 
                // Better to create a BULK_SET action, but for now individual is safer logic-wise.
                // To avoid lag, we can optimistically update? 
                // Given local state, it should be fast enough for < 100 cells.
                updateRange.forEach(({ r, c }) => {
                    const student = group.students[r];
                    const date = classDates[c];
                    if (student && date) {
                        handleStatusChange(student.id, date, statusToApply);
                    }
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [group, focusedCell, selection, classDates, selectedGroupId, handleStatusChange]);


    // Scroll to Today Logic
    const scrollToToday = () => {
        if (!group || !outerListRef.current) return;
        
        let targetIndex = classDates.findIndex(d => d === todayStr);
        if (targetIndex === -1) {
            targetIndex = classDates.findIndex(d => new Date(d) > new Date(todayStr));
            if (targetIndex === -1) targetIndex = classDates.length - 1;
        }

        if (targetIndex !== -1) {
            const viewportWidth = outerListRef.current.clientWidth;
            const scrollPos = (targetIndex * DATE_COL_WIDTH) - (viewportWidth / 2) + (DATE_COL_WIDTH / 2) + NAME_COL_WIDTH;
            
            outerListRef.current.scrollTo({
                left: Math.max(0, scrollPos),
                behavior: 'smooth'
            });
        }
    };

    const totalContentWidth = useMemo(() => {
        return NAME_COL_WIDTH + (classDates.length * DATE_COL_WIDTH) + (STAT_COL_WIDTH * 3);
    }, [classDates.length]);

    return (
        <div className="flex flex-col h-full outline-none">
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
                <div className="flex-1 border border-border-color rounded-xl overflow-hidden bg-surface flex flex-col shadow-sm select-none">
                    {/* Header Container */}
                    <div 
                        ref={headerRef}
                        className="overflow-hidden border-b-2 border-border-color bg-surface-secondary/30 flex-shrink-0"
                        style={{ height: 50 }}
                    >
                        <div style={{ width: totalContentWidth, height: '100%', display: 'flex' }}>
                             {/* Name Header */}
                             <div 
                                className="sticky left-0 z-20 bg-surface border-r border-border-color flex items-center px-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                                style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
                            >
                                <span className="text-sm font-semibold text-text-secondary">Alumno</span>
                            </div>
                            
                            {/* Date Headers */}
                            {classDates.map(date => {
                                const isToday = date === todayStr;
                                const dateObj = new Date(date + 'T00:00:00');
                                return (
                                    <div 
                                        key={date}
                                        className={`flex flex-col items-center justify-center border-r border-border-color/50 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-bold' : 'text-text-secondary'}`}
                                        style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}
                                    >
                                        <span className="text-[10px] uppercase opacity-70">{dateObj.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.','')}</span>
                                        <span className="text-xs">{dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }).split(' ')[0]}</span>
                                    </div>
                                );
                            })}
                            
                            {/* Sticky Stat Headers */}
                            <div 
                                className="sticky z-20 bg-amber-50 dark:bg-amber-900/20 border-l border-border-color flex items-center justify-center text-xs font-semibold text-text-secondary"
                                style={{ right: STAT_COL_WIDTH * 2, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}
                            >
                                % P1
                            </div>
                             <div 
                                className="sticky z-20 bg-sky-50 dark:bg-sky-900/20 border-l border-border-color flex items-center justify-center text-xs font-semibold text-text-secondary"
                                style={{ right: STAT_COL_WIDTH, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}
                            >
                                % P2
                            </div>
                            <div 
                                className="sticky right-0 z-20 bg-surface border-l-2 border-border-color flex items-center justify-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs font-bold text-primary"
                                style={{ width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}
                            >
                                Global
                            </div>
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
                                        selection,
                                        todayStr,
                                        firstPartialEnd: settings.firstPartialEnd,
                                        onMouseDown: handleMouseDown,
                                        onMouseEnter: handleMouseEnter
                                    }}
                                    className="overflow-x-auto"
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
             
             {/* Modals */}
             {group && (
                <Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${group.name}`}>
                    <AttendanceTaker 
                        students={group.students} 
                        date={todayStr} 
                        groupAttendance={attendance[group.id] || {}}
                        onStatusChange={(id, status) => handleStatusChange(id, todayStr, status)}
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