import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { Evaluation, Group, EvaluationType } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Modal from './common/Modal';
import Button from './common/Button';
import Icon from './icons/Icon';

const EvaluationForm: React.FC<{
    evaluation?: Evaluation;
    group: Group;
    onSave: (evaluation: Evaluation) => void;
    onCancel: () => void;
}> = ({ evaluation, group, onSave, onCancel }) => {
    const [name, setName] = useState(evaluation?.name || '');
    const [maxScore, setMaxScore] = useState(evaluation?.maxScore || 10);
    const [partial, setPartial] = useState<1 | 2>(evaluation?.partial || 1);
    
    const availableTypes = partial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2;
    const [typeId, setTypeId] = useState(evaluation?.typeId || availableTypes[0]?.id || '');

    useEffect(() => {
        // If the partial changes, reset the typeId to the first available type of the new partial
        const newAvailableTypes = partial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2;
        if (!newAvailableTypes.some(t => t.id === typeId)) {
            setTypeId(newAvailableTypes[0]?.id || '');
        }
    }, [partial, typeId, group.evaluationTypes]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || maxScore <= 0 || !typeId) {
            alert('Por favor, completa todos los campos, incluyendo un tipo de evaluación válido.');
            return;
        }
        onSave({ id: evaluation?.id || uuidv4(), name, maxScore, partial, typeId });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="evalName" className="block text-sm font-medium text-iaev-text-primary">Nombre de la Evaluación</label>
                    <input type="text" id="evalName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="maxScore" className="block text-sm font-medium text-iaev-text-primary">Puntuación Máxima</label>
                        <input type="number" id="maxScore" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min="1" required className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue" />
                    </div>
                    <div>
                        <label htmlFor="partial" className="block text-sm font-medium text-iaev-text-primary">Parcial</label>
                        <select id="partial" value={partial} onChange={e => setPartial(Number(e.target.value) as 1 | 2)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue">
                            <option value={1}>Primer Parcial</option>
                            <option value={2}>Segundo Parcial</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="typeId" className="block text-sm font-medium text-iaev-text-primary">Tipo de Evaluación</label>
                        <select id="typeId" value={typeId} onChange={e => setTypeId(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue" disabled={availableTypes.length === 0}>
                            {availableTypes.length === 0 && <option>Define tipos en el grupo</option>}
                            {availableTypes.map(type => <option key={type.id} value={type.id}>{type.name} ({type.weight}%)</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">{evaluation ? 'Guardar Cambios' : 'Crear Evaluación'}</Button>
            </div>
        </form>
    );
};


const GradesView: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, evaluations, grades, selectedGroupId } = state;

    const [isEvalModalOpen, setEvalModalOpen] = useState(false);
    const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | undefined>(undefined);

    const setSelectedGroupId = useCallback((id: string | null) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: id });
    }, [dispatch]);

    const group = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);
    const groupEvaluations = useMemo(() => (evaluations[selectedGroupId || ''] || []), [evaluations, selectedGroupId]);
    const groupGrades = useMemo(() => grades[selectedGroupId || ''] || {}, [grades, selectedGroupId]);

    const p1Evaluations = useMemo(() => groupEvaluations.filter(e => e.partial === 1), [groupEvaluations]);
    const p2Evaluations = useMemo(() => groupEvaluations.filter(e => e.partial === 2), [groupEvaluations]);

    useEffect(() => {
        if (!selectedGroupId && groups.length > 0) {
            setSelectedGroupId(groups[0].id);
        }
    }, [groups, selectedGroupId, setSelectedGroupId]);
    
    const handleSaveEvaluation = (evaluation: Evaluation) => {
        if (selectedGroupId) {
            dispatch({ type: 'SAVE_EVALUATION', payload: { groupId: selectedGroupId, evaluation } });
            dispatch({ type: 'ADD_TOAST', payload: { message: `Evaluación '${evaluation.name}' guardada.`, type: 'success' } });
            setEvalModalOpen(false);
            setEditingEvaluation(undefined);
        }
    };
    
    const handleDeleteEvaluation = (evaluationId: string) => {
        if (selectedGroupId && window.confirm('¿Seguro que quieres eliminar esta evaluación? Se borrarán todas las calificaciones asociadas.')) {
            const evalName = groupEvaluations.find(e => e.id === evaluationId)?.name;
            dispatch({ type: 'DELETE_EVALUATION', payload: { groupId: selectedGroupId, evaluationId } });
            dispatch({ type: 'ADD_TOAST', payload: { message: `Evaluación '${evalName}' eliminada.`, type: 'error' } });
        }
    };

    const handleGradeChange = (studentId: string, evaluationId: string, score: string) => {
        if (selectedGroupId) {
            const scoreValue = score === '' ? null : parseFloat(score);
            const evaluation = groupEvaluations.find(ev => ev.id === evaluationId);
            if (evaluation && scoreValue !== null && (scoreValue < 0 || scoreValue > evaluation.maxScore)) {
                dispatch({ type: 'ADD_TOAST', payload: { message: `La calificación no puede ser mayor a ${evaluation.maxScore}`, type: 'error' } });
                return;
            }
            dispatch({ type: 'UPDATE_GRADE', payload: { groupId: selectedGroupId, studentId, evaluationId, score: scoreValue } });
        }
    };

    const calculatePartialAverage = useCallback((studentId: string, partial: 1 | 2) => {
        if (!group) return { average: null, color: '' };
        
        const types: EvaluationType[] = partial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2;
        const evaluationsForPartial = partial === 1 ? p1Evaluations : p2Evaluations;
        const studentGrades = groupGrades[studentId] || {};

        let finalPartialScore = 0;
        let totalWeightOfGradedItems = 0;

        types.forEach(type => {
            const evalsOfType = evaluationsForPartial.filter(ev => ev.typeId === type.id);
            if (evalsOfType.length === 0) return;

            let totalScoreForType = 0;
            let maxScoreForType = 0;
            let hasGradesForType = false;

            evalsOfType.forEach(ev => {
                const grade = studentGrades[ev.id];
                if (grade !== null && grade !== undefined) {
                    totalScoreForType += grade;
                    maxScoreForType += ev.maxScore;
                    hasGradesForType = true;
                }
            });

            if (hasGradesForType && maxScoreForType > 0) {
                const typePercentage = totalScoreForType / maxScoreForType; // e.g., 0.85
                finalPartialScore += typePercentage * type.weight;
                totalWeightOfGradedItems += type.weight;
            }
        });

        if (totalWeightOfGradedItems === 0) return { average: null, color: '' };

        const weightedAverage = (finalPartialScore / totalWeightOfGradedItems) * 10;
        const color = weightedAverage >= 7 ? 'text-iaev-green-dark' : weightedAverage >= 6 ? 'text-iaev-yellow-dark' : 'text-iaev-red-dark';

        return { average: weightedAverage, color };
    }, [group, p1Evaluations, p2Evaluations, groupGrades]);
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto ml-auto">
                    <select
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full sm:w-64 p-2 border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue"
                    >
                        <option value="" disabled>Selecciona un grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>

            {group ? (
                <>
                <div className="mb-6 bg-iaev-surface p-4 rounded-xl shadow-sm border border-slate-900/10">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-3">
                        <h2 className="text-xl font-bold">Evaluaciones del Grupo</h2>
                        <Button onClick={() => { setEditingEvaluation(undefined); setEvalModalOpen(true); }} className="w-full sm:w-auto">
                            <Icon name="plus" /> Nueva Evaluación
                        </Button>
                    </div>
                     {groupEvaluations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {groupEvaluations.map(ev => {
                                const type = (ev.partial === 1 ? group.evaluationTypes.partial1 : group.evaluationTypes.partial2).find(t => t.id === ev.typeId);
                                return (
                                <div key={ev.id} className="bg-slate-200/60 p-2 rounded-lg flex items-center gap-2">
                                    <span className="text-xs bg-iaev-blue-light text-iaev-blue-darker px-1.5 py-0.5 rounded-full font-semibold">P{ev.partial}</span>
                                    <span className="font-semibold">{ev.name}</span>
                                    <span className="text-xs text-slate-500">({type?.name || '??'})</span>
                                    <span className="text-xs bg-slate-300/80 px-1.5 py-0.5 rounded-full">{ev.maxScore} pts</span>
                                    <button onClick={() => { setEditingEvaluation(ev); setEvalModalOpen(true); }} className="text-slate-500 hover:text-iaev-blue"><Icon name="edit-3" className="w-3 h-3"/></button>
                                    <button onClick={() => handleDeleteEvaluation(ev.id)} className="text-slate-500 hover:text-iaev-red"><Icon name="x" className="w-4 h-4"/></button>
                                </div>
                            )})}
                        </div>
                    ) : <p className="text-iaev-text-secondary">Aún no has creado evaluaciones para este grupo.</p>}
                </div>

                <div className="bg-iaev-surface p-4 rounded-xl shadow-sm border border-slate-900/10 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th rowSpan={2} className="sticky left-0 bg-iaev-surface p-2 text-left font-semibold z-10 border-b-2 border-slate-300">Alumno</th>
                                {p1Evaluations.length > 0 && <th colSpan={p1Evaluations.length + 1} className="p-2 font-semibold text-center text-lg border-b-2 border-slate-300">Primer Parcial</th>}
                                {p2Evaluations.length > 0 && <th colSpan={p2Evaluations.length + 1} className="p-2 font-semibold text-center text-lg border-b-2 border-slate-300">Segundo Parcial</th>}
                                <th rowSpan={2} className="p-2 font-semibold text-center text-sm border-b-2 border-slate-300 bg-slate-200/60 min-w-[100px]">Promedio Final</th>
                            </tr>
                            <tr className="border-b border-slate-200">
                                {p1Evaluations.map(ev => <th key={ev.id} className="p-2 font-semibold text-center text-sm min-w-[100px]">{ev.name} <span className="font-normal text-xs">({ev.maxScore}pts)</span></th>)}
                                {p1Evaluations.length > 0 && <th className="p-2 font-semibold text-center text-sm bg-slate-100/80 min-w-[100px]">Prom. P1</th>}

                                {p2Evaluations.map(ev => <th key={ev.id} className="p-2 font-semibold text-center text-sm min-w-[100px]">{ev.name} <span className="font-normal text-xs">({ev.maxScore}pts)</span></th>)}
                                {p2Evaluations.length > 0 && <th className="p-2 font-semibold text-center text-sm bg-slate-100/80 min-w-[100px]">Prom. P2</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {group.students.map(student => {
                                const { average: p1Avg, color: p1Color } = calculatePartialAverage(student.id, 1);
                                const { average: p2Avg, color: p2Color } = calculatePartialAverage(student.id, 2);

                                let finalAvg: number | null = null;
                                if (p1Avg !== null && p2Avg !== null) {
                                    finalAvg = (p1Avg + p2Avg) / 2;
                                } else if (p1Avg !== null) {
                                    finalAvg = p1Avg;
                                } else if (p2Avg !== null) {
                                    finalAvg = p2Avg;
                                }
                                const finalColor = finalAvg === null ? '' : finalAvg >= 7 ? 'text-iaev-green-dark' : finalAvg >= 6 ? 'text-iaev-yellow-dark' : 'text-iaev-red-dark';

                                return (
                                    <tr key={student.id} className="border-b border-slate-200/70 hover:bg-slate-200/40">
                                        <td className="sticky left-0 bg-iaev-surface p-2 font-medium z-10 whitespace-nowrap">{student.name}</td>
                                        
                                        {p1Evaluations.map(ev => (
                                            <td key={ev.id} className="p-1 text-center">
                                                <input type="number" value={groupGrades[student.id]?.[ev.id] ?? ''} onChange={(e) => handleGradeChange(student.id, ev.id, e.target.value)}
                                                    max={ev.maxScore} min={0} placeholder="-" className="w-20 p-1.5 text-center border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue"/>
                                            </td>
                                        ))}
                                        {p1Evaluations.length > 0 && <td className={`p-2 text-center font-bold text-lg bg-slate-100/80 ${p1Color}`}>{p1Avg?.toFixed(1) || '-'}</td>}

                                        {p2Evaluations.map(ev => (
                                            <td key={ev.id} className="p-1 text-center">
                                                <input type="number" value={groupGrades[student.id]?.[ev.id] ?? ''} onChange={(e) => handleGradeChange(student.id, ev.id, e.target.value)}
                                                    max={ev.maxScore} min={0} placeholder="-" className="w-20 p-1.5 text-center border border-slate-300 rounded-md bg-iaev-surface focus:ring-2 focus:ring-iaev-blue"/>
                                            </td>
                                        ))}
                                        {p2Evaluations.length > 0 && <td className={`p-2 text-center font-bold text-lg bg-slate-100/80 ${p2Color}`}>{p2Avg?.toFixed(1) || '-'}</td>}

                                        <td className={`p-2 text-center font-bold text-xl bg-slate-200/60 ${finalColor}`}>{finalAvg?.toFixed(1) || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {group.students.length === 0 && <p className="text-center text-iaev-text-secondary py-8">No hay alumnos en este grupo.</p>}
                </div>
                </>
            ) : (
                 <div className="text-center py-20 bg-iaev-surface rounded-xl shadow-sm border border-slate-900/10">
                    <Icon name="graduation-cap" className="w-20 h-20 mx-auto text-slate-300"/>
                    <p className="mt-4 text-iaev-text-secondary">Por favor, selecciona un grupo para registrar calificaciones.</p>
                    {groups.length === 0 && <p className="text-slate-400">Primero necesitas crear un grupo en la sección 'Grupos'.</p>}
                </div>
            )}
            {group && <Modal isOpen={isEvalModalOpen} onClose={() => setEvalModalOpen(false)} title={editingEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}>
                <EvaluationForm evaluation={editingEvaluation} group={group} onSave={handleSaveEvaluation} onCancel={() => setEvalModalOpen(false)} />
            </Modal>}
        </div>
    );
};

export default GradesView;