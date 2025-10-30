import React, { useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { Evaluation } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Modal from './common/Modal';
import Button from './common/Button';
import Icon from './icons/Icon';

const EvaluationForm: React.FC<{
    evaluation?: Evaluation;
    onSave: (evaluation: Evaluation) => void;
    onCancel: () => void;
}> = ({ evaluation, onSave, onCancel }) => {
    const [name, setName] = useState(evaluation?.name || '');
    const [maxScore, setMaxScore] = useState(evaluation?.maxScore || 10);
    const [partial, setPartial] = useState<1 | 2>(evaluation?.partial || 1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || maxScore <= 0) {
            alert('Por favor, ingresa un nombre válido y una puntuación máxima mayor a 0.');
            return;
        }
        onSave({ id: evaluation?.id || uuidv4(), name, maxScore, partial });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="evalName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombre de la Evaluación</label>
                    <input type="text" id="evalName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="maxScore" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Puntuación Máxima</label>
                        <input type="number" id="maxScore" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} min="1" required className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="partial" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Parcial</label>
                        <select id="partial" value={partial} onChange={e => setPartial(Number(e.target.value) as 1 | 2)} className="mt-1 block w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500">
                            <option value={1}>Primer Parcial</option>
                            <option value={2}>Segundo Parcial</option>
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
    const groupEvaluations = useMemo(() => (evaluations[selectedGroupId || ''] || []).sort((a,b) => a.partial - b.partial), [evaluations, selectedGroupId]);
    const groupGrades = useMemo(() => grades[selectedGroupId || ''] || {}, [grades, selectedGroupId]);

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
            dispatch({ type: 'UPDATE_GRADE', payload: { groupId: selectedGroupId, studentId, evaluationId, score: scoreValue } });
        }
    };

    const calculateAverage = (studentId: string) => {
        const studentGrades = groupGrades[studentId] || {};
        let totalScore = 0;
        let maxPossibleScore = 0;

        groupEvaluations.forEach(ev => {
            const grade = studentGrades[ev.id];
            if (grade !== undefined && grade !== null) {
                totalScore += grade;
                maxPossibleScore += ev.maxScore;
            }
        });
        
        if (maxPossibleScore === 0) return { average: '-', color: '' };

        const average = (totalScore / maxPossibleScore) * 10;
        const color = average >= 7 ? 'text-green-600 dark:text-green-400' : average >= 6 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400';
        
        return { average: average.toFixed(1), color };
    };
    
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">Registro de Calificaciones</h1>
                <div className="flex items-center gap-4">
                    <select
                        value={selectedGroupId || ''}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full sm:w-64 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="" disabled>Selecciona un grupo</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>

            {group ? (
                <>
                <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-bold">Evaluaciones</h2>
                        <Button onClick={() => { setEditingEvaluation(undefined); setEvalModalOpen(true); }}>
                            <Icon name="plus" /> Nueva Evaluación
                        </Button>
                    </div>
                     {groupEvaluations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {groupEvaluations.map(ev => (
                                <div key={ev.id} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex items-center gap-2">
                                    <span className="text-xs bg-indigo-200 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 px-1.5 py-0.5 rounded-full font-semibold">P{ev.partial}</span>
                                    <span className="font-semibold">{ev.name}</span>
                                    <span className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">{ev.maxScore} pts</span>
                                    <button onClick={() => { setEditingEvaluation(ev); setEvalModalOpen(true); }} className="text-slate-500 hover:text-blue-500"><Icon name="edit-3" className="w-3 h-3"/></button>
                                    <button onClick={() => handleDeleteEvaluation(ev.id)} className="text-slate-500 hover:text-red-500"><Icon name="x" className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-slate-500">Aún no has creado evaluaciones para este grupo.</p>}
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b dark:border-slate-700">
                                <th className="sticky left-0 bg-white dark:bg-slate-800 p-2 text-left font-semibold z-10">Alumno</th>
                                {groupEvaluations.map(ev => (
                                    <th key={ev.id} className="p-2 font-semibold text-center text-sm min-w-[100px]">
                                        {ev.name} <span className="font-normal text-xs">({ev.maxScore} pts)</span>
                                    </th>
                                ))}
                                <th className="p-2 font-semibold text-center text-sm">Promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.students.map(student => {
                                const { average, color } = calculateAverage(student.id);
                                return (
                                    <tr key={student.id} className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="sticky left-0 bg-white dark:bg-slate-800 p-2 font-medium z-10 whitespace-nowrap">{student.name}</td>
                                        {groupEvaluations.map(ev => {
                                            const grade = groupGrades[student.id]?.[ev.id];
                                            return (
                                                <td key={ev.id} className="p-1 text-center">
                                                    <input
                                                        type="number"
                                                        value={grade ?? ''}
                                                        onChange={(e) => handleGradeChange(student.id, ev.id, e.target.value)}
                                                        max={ev.maxScore}
                                                        min={0}
                                                        placeholder="-"
                                                        className="w-20 p-1.5 text-center border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                </td>
                                            );
                                        })}
                                        <td className={`p-2 text-center font-bold text-lg ${color}`}>
                                            {average}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                     {group.students.length === 0 && <p className="text-center text-slate-500 py-8">No hay alumnos en este grupo.</p>}
                </div>
                </>
            ) : (
                 <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                    <Icon name="graduation-cap" className="w-20 h-20 mx-auto text-slate-300 dark:text-slate-600"/>
                    <p className="mt-4 text-slate-500">Por favor, selecciona un grupo para registrar calificaciones.</p>
                    {groups.length === 0 && <p className="text-slate-400">Primero necesitas crear un grupo en la sección 'Grupos'.</p>}
                </div>
            )}
            <Modal isOpen={isEvalModalOpen} onClose={() => setEvalModalOpen(false)} title={editingEvaluation ? 'Editar Evaluación' : 'Nueva Evaluación'}>
                <EvaluationForm evaluation={editingEvaluation} onSave={handleSaveEvaluation} onCancel={() => setEvalModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default GradesView;