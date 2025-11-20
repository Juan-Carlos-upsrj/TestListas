import React, { useContext, useState, useMemo, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { AttendanceStatus, Student } from '../types';
import { getClassDates } from '../services/dateUtils';
import { STATUS_STYLES } from '../constants';
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
const DATE_COL_WIDTH = 50;
const STAT_COL_WIDTH = 60;
const ROW_HEIGHT = 45;
const HEADER_HEIGHT = 90;

interface Coords { r: number; c: number; }

// Helper to calculate percentages (Pure function)
const calculateStats = (
    studentAttendance: { [date: string]: AttendanceStatus },
    dates: string[],
    todayStr: string
) => {
    let present = 0;
    let total = 0;
    const len = dates.length;
    for (let i = 0; i < len; i++) {
        const date = dates[i];
        if (date <= todayStr) {
             total++;
             const status = studentAttendance[date];
             if (status === AttendanceStatus.Present || status === AttendanceStatus.Late || status === AttendanceStatus.Justified || status === AttendanceStatus.Exchange) {
                present++;
            }
        }
    }
    return {
        percent: total > 0 ? Math.round((present / total) * 100) : 100,
        valid: total > 0
    };
};

interface ItemData {
    students: Student[];
    classDates: string[];
    attendance: { [groupId: string]: { [studentId: string]: { [date: string]: AttendanceStatus } } };
    groupId: string;
    focusedCell: Coords | null;
    selection: { start: Coords | null; end: Coords | null; isDragging: boolean };
    todayStr: string;
    totalWidth: number;
    handleStatusChange: (studentId: string, date: string, status: AttendanceStatus) => void;
    onMouseDown: (r: number, c: number) => void;
    onMouseEnter: (r: number, c: number) => void;
    precalcStats: any[]; // Array of precalculated stats per student
}

// --- ROW COMPONENT (STRICTLY MEMOIZED) ---
const Row = React.memo(({ index, style, data }: ListChildComponentProps<ItemData>) => {
    const { 
        students, classDates, attendance, groupId, 
        focusedCell, selection, todayStr, totalWidth,
        handleStatusChange, onMouseDown, onMouseEnter, precalcStats
    } = data;
    
    const student = students[index];
    const studentAttendance = attendance[groupId]?.[student.id] || {};
    
    // Use pre-calculated stats
    const { p1: p1Stats, p2: p2Stats, global: globalStats } = precalcStats[index];

    const getScoreColor = (pct: number) => pct >= 90 ? 'text-emerald-600' : pct >= 80 ? 'text-amber-600' : 'text-rose-600';

    const isRowInSelection = selection.start && selection.end && 
        index >= Math.min(selection.start.r, selection.end.r) && 
        index <= Math.max(selection.start.r, selection.end.r);

    return (
        <div style={{ ...style, width: totalWidth }} className={`flex items-center border-b border-border-color/70 hover:bg-surface-secondary/40 transition-colors ${isRowInSelection ? 'bg-blue-50/30' : ''}`}>
            <div 
                className="sticky left-0 z-10 bg-surface flex items-center px-3 border-r border-border-color h-full shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex-shrink-0"
                style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}
            >
                <div className="truncate w-full">
                    <p className="font-medium text-sm text-text-primary truncate">{student.name}</p>
                    {student.nickname && <p className="text-xs text-text-secondary truncate">({student.nickname})</p>}
                </div>
            </div>

            {classDates.map((date, colIndex) => {
                const status = (studentAttendance[date] || AttendanceStatus.Pending) as AttendanceStatus;
                const isFocused = focusedCell?.r === index && focusedCell?.c === colIndex;
                const isToday = date === todayStr;

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
                        className={`flex items-center justify-center border-r border-border-color/50 h-full relative select-none cursor-pointer flex-shrink-0
                            ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
                            ${isSelected ? 'bg-blue-200/50 dark:bg-blue-800/50' : ''}
                        `}
                        style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}
                        onMouseDown={() => onMouseDown(index, colIndex)}
                        onMouseEnter={() => onMouseEnter(index, colIndex)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            handleStatusChange(student.id, date, AttendanceStatus.Pending);
                        }}
                    >
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
            
            <div className="sticky z-10 bg-amber-50/80 dark:bg-amber-900/20 flex items-center justify-center border-l border-border-color h-full font-mono text-xs flex-shrink-0" style={{ right: STAT_COL_WIDTH * 2, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}>
                 <span className={getScoreColor(p1Stats.percent)}>{p1Stats.percent}%</span>
            </div>
            <div className="sticky z-10 bg-sky-50/80 dark:bg-sky-900/20 flex items-center justify-center border-l border-border-color h-full font-mono text-xs flex-shrink-0" style={{ right: STAT_COL_WIDTH, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}>
                 <span className={getScoreColor(p2Stats.percent)}>{p2Stats.percent}%</span>
            </div>
            <div className="sticky right-0 z-10 bg-surface flex items-center justify-center border-l-2 border-border-color h-full font-bold text-sm shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] flex-shrink-0" style={{ width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}>
                 <span className={getScoreColor(globalStats.percent)}>{globalStats.percent}%</span>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // CUSTOM COMPARISON FUNCTION (Crucial for performance)
    const { index: prevIndex, data: prevData } = prevProps;
    const { index: nextIndex, data: nextData } = nextProps;

    // 1. Check if student changed (sorting/filtering)
    if (prevData.students[prevIndex]?.id !== nextData.students[nextIndex]?.id) return false;

    // 2. Check Attendance Data for this student
    const sId = prevData.students[prevIndex].id;
    const gId = prevData.groupId;
    // We only care if the attendance object *reference* for this student changed
    // Note: This assumes immutable updates in the parent context
    if (prevData.attendance[gId]?.[sId] !== nextData.attendance[gId]?.[sId]) return false;

    // 3. Check Focus State
    const prevFocused = prevData.focusedCell?.r === prevIndex;
    const nextFocused = nextData.focusedCell?.r === nextIndex;
    if (prevFocused !== nextFocused) return false; // Row gained or lost focus
    if (nextFocused && prevData.focusedCell?.c !== nextData.focusedCell?.c) return false; // Focus moved horizontally within this row

    // 4. Check Selection State
    // Helper to check if index overlaps selection range
    const isSel = (idx: number, sel: typeof prevData.selection) => {
        if (!sel.start || !sel.end) return false;
        const min = Math.min(sel.start.r, sel.end.r);
        const max = Math.max(sel.start.r, sel.end.r);
        return idx >= min && idx <= max;
    };
    const prevSel = isSel(prevIndex, prevData.selection);
    const nextSel = isSel(nextIndex, nextData.selection);
    
    // If row was in selection or is in selection now, check if selection bounds changed
    if (prevSel || nextSel) {
        if (prevData.selection.start !== nextData.selection.start || prevData.selection.end !== nextData.selection.end) return false;
    }
    
    // 5. Check Width (Resize)
    if (prevProps.style.width !== nextProps.style.width) return false;

    return true; // No relevant changes, skip render
});


// --- MAIN COMPONENT ---
const AttendanceView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, attendance, settings, selectedGroupId } = state;
    
    const [isTakerOpen, setTakerOpen] = useState(false);
    const [isBulkFillOpen, setBulkFillOpen] = useState(false);
    const [isTextImporterOpen, setTextImporterOpen] = useState(false);
    
    // State to delay rendering list to ensure AutoSizer picks up correct dims after tab switch
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Reset ready state on mount, then enable it
        setIsReady(false);
        const timer = setTimeout(() => setIsReady(true), 50);
        return () => clearTimeout(timer);
    }, []); // Empty dep array means this runs on mount/unmount of the View

    const headerRef = useRef<HTMLDivElement>(null);
    const outerListRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<any>(null);

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const [focusedCell, setFocusedCell] = useState<Coords | null>(null);
    const [selection, setSelection] = useState<{ start: Coords | null; end: Coords | null; isDragging: boolean }>({
        start: null,
        end: null,
        isDragging: false
    });

    const focusRef = useRef(focusedCell);
    const selectionRef = useRef(selection);
    useEffect(() => { focusRef.current = focusedCell; }, [focusedCell]);
    useEffect(() => { selectionRef.current = selection; }, [selection]);

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
    
    // PRE-CALC DATES (P1 vs P2)
    const { p1Dates, p2Dates } = useMemo(() => ({
        p1Dates: classDates.filter(d => d <= settings.firstPartialEnd),
        p2Dates: classDates.filter(d => d > settings.firstPartialEnd)
    }), [classDates, settings.firstPartialEnd]);

    // PRE-CALC ALL STATS (Massive perf boost: calculated once per data change, not per row render)
    const precalcStats = useMemo(() => {
        if (!group) return [];
        return group.students.map(student => {
            const att = attendance[group.id]?.[student.id] || {};
            return {
                p1: calculateStats(att, p1Dates, todayStr),
                p2: calculateStats(att, p2Dates, todayStr),
                global: calculateStats(att, classDates, todayStr)
            };
        });
    }, [group, attendance, p1Dates, p2Dates, classDates, todayStr]);

    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId, setSelectedGroupId]);
    
    // Scroll Sync
    useLayoutEffect(() => {
        const container = outerListRef.current;
        const header = headerRef.current;
        if (!container || !header) return;
        const handleScroll = () => { header.scrollLeft = container.scrollLeft; };
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [isReady, group]); // Re-bind when ready or group changes

    // Header Structure
    const headerStructure = useMemo(() => {
        const p1End = new Date(settings.firstPartialEnd);
        const structure: { label: string; width: number; months: { label: string; width: number; }[] }[] = [];
        
        const p1DatesArr = classDates.filter(d => new Date(d) <= p1End);
        const p2DatesArr = classDates.filter(d => new Date(d) > p1End);
        
        const groupDatesByMonth = (dates: string[]) => {
             const months: { label: string; count: number }[] = [];
             dates.forEach(d => {
                 const m = new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { month: 'long' });
                 const label = m.charAt(0).toUpperCase() + m.slice(1);
                 const last = months[months.length - 1];
                 if (last && last.label === label) last.count++;
                 else months.push({ label, count: 1 });
             });
             return months.map(m => ({ label: m.label, width: m.count * DATE_COL_WIDTH }));
        };

        if (p1DatesArr.length > 0) structure.push({ label: 'Primer Parcial', width: p1DatesArr.length * DATE_COL_WIDTH, months: groupDatesByMonth(p1DatesArr) });
        if (p2DatesArr.length > 0) structure.push({ label: 'Segundo Parcial', width: p2DatesArr.length * DATE_COL_WIDTH, months: groupDatesByMonth(p2DatesArr) });
        
        return structure;
    }, [classDates, settings.firstPartialEnd]);

    const handleStatusChange = useCallback((studentId: string, date: string, status: AttendanceStatus) => {
        if (selectedGroupId) {
            dispatch({ type: 'UPDATE_ATTENDANCE', payload: { groupId: selectedGroupId, studentId, date, status } });
        }
    }, [selectedGroupId, dispatch]);

    const handleMouseDown = useCallback((r: number, c: number) => {
        setSelection({ start: { r, c }, end: { r, c }, isDragging: true });
        setFocusedCell({ r, c });
    }, []);

    const handleMouseEnter = useCallback((r: number, c: number) => {
        setSelection(prev => {
            if (prev.isDragging) return { ...prev, end: { r, c } };
            return prev;
        });
    }, []);

    useEffect(() => {
        const handleMouseUp = () => setSelection(prev => ({ ...prev, isDragging: false }));
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!group) return;
            const currentFocus = focusRef.current;
            const currentSelection = selectionRef.current;
            
            if (currentFocus) {
                const { r, c } = currentFocus;
                const maxR = group.students.length - 1;
                const maxC = classDates.length - 1;
                
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    let newR = r, newC = c;
                    if (e.key === 'ArrowUp') newR = Math.max(0, r - 1);
                    if (e.key === 'ArrowDown') newR = Math.min(maxR, r + 1);
                    if (e.key === 'ArrowLeft') newC = Math.max(0, c - 1);
                    if (e.key === 'ArrowRight') newC = Math.min(maxC, c + 1);
                    
                    setFocusedCell({ r: newR, c: newC });
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                         if (listRef.current) listRef.current.scrollToItem(newR);
                    }
                }
            }

            const keyMap: { [key: string]: AttendanceStatus } = {
                'p': AttendanceStatus.Present, 'a': AttendanceStatus.Absent, 'r': AttendanceStatus.Late,
                'j': AttendanceStatus.Justified, 'i': AttendanceStatus.Exchange,
                'delete': AttendanceStatus.Pending, 'backspace': AttendanceStatus.Pending,
            };
            const statusToApply = keyMap[e.key.toLowerCase()];

            if (statusToApply && selectedGroupId) {
                e.preventDefault();
                let updateRange: { r: number, c: number }[] = [];
                
                if (currentSelection.start && currentSelection.end) {
                     const minR = Math.min(currentSelection.start.r, currentSelection.end.r);
                     const maxR = Math.max(currentSelection.start.r, currentSelection.end.r);
                     const minC = Math.min(currentSelection.start.c, currentSelection.end.c);
                     const maxC = Math.max(currentSelection.start.c, currentSelection.end.c);
                     for (let r = minR; r <= maxR; r++) {
                         for (let c = minC; c <= maxC; c++) updateRange.push({ r, c });
                     }
                } else if (currentFocus) {
                    updateRange.push(currentFocus);
                }

                updateRange.forEach(({ r, c }) => {
                    const student = group.students[r];
                    const date = classDates[c];
                    if (student && date) handleStatusChange(student.id, date, statusToApply);
                });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [group, classDates, selectedGroupId, handleStatusChange]);
    
    const handleScrollToToday = () => {
         if (!group || !outerListRef.current) return;
        let targetIndex = classDates.findIndex(d => d === todayStr);
        if (targetIndex === -1) {
            targetIndex = classDates.findIndex(d => d > todayStr);
            if (targetIndex === -1) targetIndex = classDates.length - 1;
        }
        if (targetIndex !== -1) {
            const viewportWidth = outerListRef.current.clientWidth - NAME_COL_WIDTH - (STAT_COL_WIDTH * 3);
            const scrollPos = (targetIndex * DATE_COL_WIDTH) - (viewportWidth / 2) + (DATE_COL_WIDTH / 2);
            outerListRef.current.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
        }
    };

    const totalContentWidth = useMemo(() => {
        return NAME_COL_WIDTH + (classDates.length * DATE_COL_WIDTH) + (STAT_COL_WIDTH * 3);
    }, [classDates.length]);

    return (
        <div className="flex flex-col h-full outline-none">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-4 sm:ml-auto">
                    <select value={selectedGroupId || ''} onChange={(e) => setSelectedGroupId(e.target.value)} className="w-full sm:w-64 p-2 border border-border-color rounded-md bg-surface focus:ring-2 focus:ring-primary">
                        <option value="" disabled>Selecciona un grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name} - {g.subject}</option>)}
                    </select>
                     <Button onClick={handleScrollToToday} disabled={!group} variant="secondary" className="w-full sm:w-auto"><Icon name="calendar" className="w-4 h-4" /> Ir a Hoy</Button>
                    <div className="hidden md:flex gap-2">
                        <Button onClick={() => setTextImporterOpen(true)} disabled={!group} variant="secondary" size="sm"><Icon name="upload-cloud" className="w-4 h-4" /> Importar</Button>
                        <Button onClick={() => setBulkFillOpen(true)} disabled={!group} variant="secondary" size="sm"><Icon name="grid" className="w-4 h-4" /> Relleno</Button>
                        <Button onClick={() => setTakerOpen(true)} disabled={!group} size="sm"><Icon name="list-checks" className="w-4 h-4" /> Pase Rápido</Button>
                    </div>
                </div>
            </div>

            {group && isReady ? (
                <div className="flex-1 border border-border-color rounded-xl overflow-hidden bg-surface flex flex-col shadow-sm select-none">
                    <AutoSizer>
                        {({ height, width }: { height: number, width: number }) => {
                            // Native scrollbar width comp.
                            const hasScroll = (group.students.length * ROW_HEIGHT) > (height - HEADER_HEIGHT);
                            const paddingRight = hasScroll ? 15 : 0; // Approximate scrollbar width

                            return (
                                <div style={{ width, height }} className="flex flex-col">
                                    <div ref={headerRef} className="overflow-hidden border-b-2 border-border-color bg-surface-secondary/30 flex-shrink-0" style={{ height: HEADER_HEIGHT, width: width, paddingRight }}>
                                         <div style={{ width: totalContentWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            {/* Header Rows... (Kept same structure but minimized for brevity in this updated response, functionality is identical to prev) */}
                                            {/* ROW 1 */}
                                            <div className="flex h-1/3 w-full border-b border-border-color/50">
                                                <div className="sticky left-0 z-20 bg-surface border-r border-border-color flex items-center px-3 flex-shrink-0" style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}></div>
                                                {headerStructure.map((part, i) => <div key={i} className="flex items-center justify-center border-r border-border-color font-bold text-xs uppercase tracking-wide bg-surface-secondary/50 text-text-secondary flex-shrink-0" style={{ width: part.width }}>{part.label}</div>)}
                                                <div className="sticky right-0 z-20 flex flex-shrink-0" style={{ width: STAT_COL_WIDTH * 3 }}><div className="w-full bg-surface-secondary/50 border-l border-border-color"></div></div>
                                            </div>
                                            {/* ROW 2 */}
                                            <div className="flex h-1/3 w-full border-b border-border-color/50">
                                                <div className="sticky left-0 z-20 bg-surface border-r border-border-color flex items-center px-3 flex-shrink-0" style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}></div>
                                                {headerStructure.flatMap((part) => part.months.map((month, j) => <div key={`${part.label}-${j}`} className="flex items-center justify-center border-r border-border-color text-[10px] font-semibold uppercase text-text-secondary bg-surface/50 flex-shrink-0" style={{ width: month.width }}>{month.label}</div>))}
                                                <div className="sticky right-0 z-20 flex flex-shrink-0" style={{ width: STAT_COL_WIDTH * 3 }}><div className="w-full bg-surface/50 border-l border-border-color"></div></div>
                                            </div>
                                            {/* ROW 3 */}
                                            <div className="flex h-1/3 w-full">
                                                <div className="sticky left-0 z-20 bg-surface border-r border-border-color flex items-center px-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex-shrink-0" style={{ width: NAME_COL_WIDTH, minWidth: NAME_COL_WIDTH }}><span className="text-sm font-semibold text-text-secondary">Alumno</span></div>
                                                {classDates.map(date => {
                                                    const isToday = date === todayStr;
                                                    const dateObj = new Date(date + 'T00:00:00');
                                                    return <div key={date} className={`flex flex-col items-center justify-center border-r border-border-color/50 flex-shrink-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-bold' : 'text-text-secondary'}`} style={{ width: DATE_COL_WIDTH, minWidth: DATE_COL_WIDTH }}><span className="text-[10px] uppercase opacity-70 leading-none">{dateObj.toLocaleDateString('es-MX', { weekday: 'short' }).replace('.','')}</span><span className="text-xs leading-none">{dateObj.toLocaleDateString('es-MX', { day: '2-digit' })}</span></div>;
                                                })}
                                                <div className="sticky z-20 bg-amber-50 dark:bg-amber-900/20 border-l border-border-color flex items-center justify-center text-xs font-semibold text-text-secondary flex-shrink-0" style={{ right: STAT_COL_WIDTH * 2, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}>% P1</div>
                                                <div className="sticky z-20 bg-sky-50 dark:bg-sky-900/20 border-l border-border-color flex items-center justify-center text-xs font-semibold text-text-secondary flex-shrink-0" style={{ right: STAT_COL_WIDTH, width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}>% P2</div>
                                                <div className="sticky right-0 z-20 bg-surface border-l-2 border-border-color flex items-center justify-center shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs font-bold text-primary flex-shrink-0" style={{ width: STAT_COL_WIDTH, minWidth: STAT_COL_WIDTH }}>Global</div>
                                            </div>
                                         </div>
                                    </div>
                                    <List
                                        ref={listRef}
                                        outerRef={outerListRef}
                                        height={height - HEADER_HEIGHT}
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
                                            totalWidth: totalContentWidth,
                                            onMouseDown: handleMouseDown,
                                            onMouseEnter: handleMouseEnter,
                                            precalcStats // PASSED HERE
                                        }}
                                        className="overflow-x-auto"
                                        style={{ willChange: 'transform' }}
                                        innerElementType={React.forwardRef(({ style, ...rest }: any, ref) => (
                                            <div ref={ref} style={{ ...style, width: totalContentWidth, position: 'relative' }} {...rest} />
                                        ))}
                                    >
                                        {Row}
                                    </List>
                                </div>
                            );
                        }}
                    </AutoSizer>
                </div>
            ) : (
                <div className="text-center py-20 bg-surface rounded-xl shadow-sm border border-border-color">
                    <Icon name="check-square" className="w-20 h-20 mx-auto text-border-color"/>
                    <p className="mt-4 text-text-secondary">{group ? 'Cargando lista...' : 'Por favor, selecciona un grupo para ver el registro de asistencia.'}</p>
                </div>
            )}
             {group && (<Modal isOpen={isTakerOpen} onClose={() => setTakerOpen(false)} title={`Pase de Lista: ${group.name}`}><AttendanceTaker students={group.students} date={todayStr} groupAttendance={attendance[group.id] || {}} onStatusChange={(id, status) => handleStatusChange(id, todayStr, status)} onClose={() => setTakerOpen(false)} /></Modal>)}
             {group && (<BulkAttendanceModal isOpen={isBulkFillOpen} onClose={() => setBulkFillOpen(false)} group={group} />)}
             {group && (<AttendanceTextImporter isOpen={isTextImporterOpen} onClose={() => setTextImporterOpen(false)} group={group} />)}
        </div>
    );
};

export default AttendanceView;