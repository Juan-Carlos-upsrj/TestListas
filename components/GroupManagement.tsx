import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { Group, Student, DayOfWeek } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Modal from './common/Modal';
import Button from './common/Button';
import Icon from './icons/Icon';
import { DAYS_OF_WEEK, GROUP_COLORS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

// Form for creating/editing a group
const GroupForm: React.FC<{
    group?: Group;
    onSave: (group: Group) => void;
    onCancel: () => void;
}> = ({ group, onSave, onCancel }) => {
    const [name, setName] = useState(group?.name || '');
    const [subject, setSubject] = useState(group?.subject || '');
    const [classDays, setClassDays] = useState<DayOfWeek[]>(group?.classDays || []);
    const [color, setColor] = useState(group?.color || GROUP_COLORS[0].name);

    const handleDayToggle = (day: DayOfWeek) => {
        setClassDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !subject) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        onSave({
            id: group?.id || uuidv4(),
            name,
            subject,
            classDays,
            students: group?.students || [],
            color
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="groupName" className="block text-sm font-medium">Nombre del Grupo</label>
                    <input type="text" id="groupName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium">Materia</label>
                    <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Días de Clase</label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                type="button"
                                key={day}
                                onClick={() => handleDayToggle(day)}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                    classDays.includes(day)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-2">Color del Grupo</label>
                    <div className="flex flex-wrap gap-3">
                        {GROUP_COLORS.map(c => (
                            <button
                                type="button"
                                key={c.name}
                                onClick={() => setColor(c.name)}
                                title={c.name}
                                className={`w-8 h-8 rounded-full ${c.bg} transition-transform transform hover:scale-110 focus:outline-none ${color === c.name ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">{group ? 'Guardar Cambios' : 'Crear Grupo'}</Button>
            </div>
        </form>
    );
};

// Form for creating/editing a student
const StudentForm: React.FC<{
    student?: Student;
    onSave: (student: Student) => void;
    onCancel: () => void;
}> = ({ student, onSave, onCancel }) => {
    const [name, setName] = useState(student?.name || '');
    const [matricula, setMatricula] = useState(student?.matricula || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
             alert('El nombre es requerido.');
             return;
        }
        onSave({
            id: student?.id || uuidv4(),
            name,
            matricula
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="studentName" className="block text-sm font-medium">Nombre Completo</label>
                    <input type="text" id="studentName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label htmlFor="matricula" className="block text-sm font-medium">Matrícula (Opcional)</label>
                    <input type="text" id="matricula" value={matricula} onChange={e => setMatricula(e.target.value)} className="mt-1 w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
             <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">{student ? 'Guardar Cambios' : 'Agregar Alumno'}</Button>
            </div>
        </form>
    );
};

// Form for bulk adding students
const BulkStudentForm: React.FC<{ onSave: (students: Student[]) => void; onCancel: () => void; }> = ({ onSave, onCancel }) => {
    const [studentData, setStudentData] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const lines = studentData.split('\n').filter(line => line.trim() !== '');
        const newStudents: Student[] = lines.map(line => {
            const parts = line.split(/[,;\t]/).map(p => p.trim());
            return {
                id: uuidv4(),
                name: parts[0] || '',
                matricula: parts[1] || '',
            };
        }).filter(s => s.name);
        
        if (newStudents.length > 0) {
            onSave(newStudents);
        } else {
            alert('No se encontraron alumnos válidos para agregar.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <p className="mb-2 text-sm text-slate-500">Pega la lista de alumnos. Separa el nombre y la matrícula con coma, punto y coma o tabulación. Un alumno por línea.</p>
            <textarea
                value={studentData}
                onChange={e => setStudentData(e.target.value)}
                rows={10}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                placeholder="Ejemplo:&#10;Juan Pérez, 12345&#10;Maria García; 67890"
            />
             <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button type="submit">Agregar Alumnos</Button>
            </div>
        </form>
    );
};

const GroupManagement: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);
    const { groups, selectedGroupId, settings } = state;

    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [isBulkModalOpen, setBulkModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined);
    const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);

    const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId), [groups, selectedGroupId]);

    const handleSelectGroup = (groupId: string) => {
        dispatch({ type: 'SET_SELECTED_GROUP', payload: groupId });
    };

    // Group Handlers
    const handleSaveGroup = (group: Group) => {
        dispatch({ type: 'SAVE_GROUP', payload: group });
        dispatch({ type: 'ADD_TOAST', payload: { message: `Grupo '${group.name}' guardado.`, type: 'success' } });
        setGroupModalOpen(false);
        setEditingGroup(undefined);
        if(!selectedGroupId) {
            handleSelectGroup(group.id);
        }
    };

    const handleDeleteGroup = (groupId: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este grupo? Se borrarán todos los datos asociados (alumnos, asistencia, calificaciones).')) {
            const groupName = groups.find(g => g.id === groupId)?.name;
            dispatch({ type: 'DELETE_GROUP', payload: groupId });
            dispatch({ type: 'ADD_TOAST', payload: { message: `Grupo '${groupName}' eliminado.`, type: 'error' } });
        }
    };

    // Student Handlers
    const handleSaveStudent = (student: Student) => {
        if (selectedGroupId) {
            dispatch({ type: 'SAVE_STUDENT', payload: { groupId: selectedGroupId, student } });
            dispatch({ type: 'ADD_TOAST', payload: { message: `Alumno '${student.name}' guardado.`, type: 'success' } });
            setStudentModalOpen(false);
            setEditingStudent(undefined);
        }
    };
    
    const handleBulkSaveStudents = (students: Student[]) => {
        if (selectedGroupId) {
            dispatch({ type: 'BULK_ADD_STUDENTS', payload: { groupId: selectedGroupId, students } });
            dispatch({ type: 'ADD_TOAST', payload: { message: `${students.length} alumnos agregados.`, type: 'success' } });
            setBulkModalOpen(false);
        }
    };

    const handleDeleteStudent = (studentId: string) => {
        if (selectedGroupId && window.confirm('¿Seguro que quieres eliminar a este alumno?')) {
            const studentName = selectedGroup?.students.find(s => s.id === studentId)?.name;
            dispatch({ type: 'DELETE_STUDENT', payload: { groupId: selectedGroupId, studentId } });
             dispatch({ type: 'ADD_TOAST', payload: { message: `Alumno '${studentName}' eliminado.`, type: 'error' } });
        }
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Gestión de Grupos</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Groups List */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Mis Grupos</h2>
                        <Button size="sm" onClick={() => { setEditingGroup(undefined); setGroupModalOpen(true); }}>
                            <Icon name="plus" className="w-4 h-4" /> Nuevo
                        </Button>
                    </div>
                    {groups.length > 0 ? (
                        <ul className="space-y-2">
                           {groups.map(group => {
                                const groupColor = GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0];
                                return (
                                <li key={group.id} onClick={() => handleSelectGroup(group.id)}
                                    className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${selectedGroupId === group.id ? `${groupColor.bg} text-white` : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border-transparent'}`}
                                    style={{ borderColor: selectedGroupId === group.id ? '' : (GROUP_COLORS.find(c => c.name === group.color) || GROUP_COLORS[0]).bg.replace('bg-', '#') }}
                                >
                                   <div className="flex justify-between items-start">
                                       <div className="flex items-start gap-3">
                                            <span className={`w-2 h-2 ${groupColor.bg} rounded-full mt-2 flex-shrink-0`}></span>
                                            <div>
                                               <p className="font-semibold">{group.name}</p>
                                               <p className={`text-sm ${selectedGroupId === group.id ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>{group.subject}</p>
                                           </div>
                                       </div>
                                       <div className="flex gap-2 items-center flex-shrink-0">
                                            <button onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setGroupModalOpen(true); }} className="p-1 hover:text-blue-400"><Icon name="edit-3" className="w-4 h-4"/></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }} className="p-1 hover:text-red-400"><Icon name="trash-2" className="w-4 h-4"/></button>
                                       </div>
                                   </div>
                               </li>
                               );
                            })}
                        </ul>
                    ) : (
                        <p className="text-center py-8 text-slate-500">No has creado ningún grupo todavía.</p>
                    )}
                </div>

                {/* Students List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                   {selectedGroup ? (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                                <h2 className="text-2xl font-bold">{selectedGroup.name} <span className="font-normal text-lg text-slate-500">({selectedGroup.students.length} alumnos)</span></h2>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => setBulkModalOpen(true)}>
                                        <Icon name="list-plus" className="w-4 h-4"/> Agregar Varios
                                    </Button>
                                    <Button size="sm" onClick={() => { setEditingStudent(undefined); setStudentModalOpen(true); }}>
                                        <Icon name="user-plus" className="w-4 h-4"/> Nuevo Alumno
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b dark:border-slate-700">
                                            <th className="p-2">#</th>
                                            {settings.showMatricula && <th className="p-2">Matrícula</th>}
                                            <th className="p-2">Nombre</th>
                                            <th className="p-2 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <AnimatePresence>
                                        {selectedGroup.students.map((student, index) => (
                                            <motion.tr
                                                key={student.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0, x: -50 }}
                                                className="border-b dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                            >
                                                <td className="p-2 text-slate-500">{index + 1}</td>
                                                {settings.showMatricula && <td className="p-2">{student.matricula || '-'}</td>}
                                                <td className="p-2 font-medium">{student.name}</td>
                                                <td className="p-2 text-right">
                                                    <div className="inline-flex gap-2">
                                                         <button onClick={() => { setEditingStudent(student); setStudentModalOpen(true); }} className="p-1 text-slate-500 hover:text-blue-500"><Icon name="edit-3" className="w-4 h-4"/></button>
                                                         <button onClick={() => handleDeleteStudent(student.id)} className="p-1 text-slate-500 hover:text-red-500"><Icon name="trash-2" className="w-4 h-4"/></button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                                {selectedGroup.students.length === 0 && <p className="text-center py-12 text-slate-500">No hay alumnos en este grupo.</p>}
                            </div>
                        </div>
                   ) : (
                       <div className="flex flex-col items-center justify-center h-full text-center">
                           <Icon name="users" className="w-20 h-20 text-slate-300 dark:text-slate-600"/>
                           <p className="mt-4 text-slate-500">Selecciona un grupo para ver a sus alumnos.</p>
                       </div>
                   )}
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isGroupModalOpen} onClose={() => setGroupModalOpen(false)} title={editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}>
                <GroupForm group={editingGroup} onSave={handleSaveGroup} onCancel={() => setGroupModalOpen(false)} />
            </Modal>

            <Modal isOpen={isStudentModalOpen} onClose={() => setStudentModalOpen(false)} title={editingStudent ? 'Editar Alumno' : 'Nuevo Alumno'}>
                <StudentForm student={editingStudent} onSave={handleSaveStudent} onCancel={() => setStudentModalOpen(false)} />
            </Modal>
             <Modal isOpen={isBulkModalOpen} onClose={() => setBulkModalOpen(false)} title="Agregar Alumnos en Lote">
                <BulkStudentForm onSave={handleBulkSaveStudents} onCancel={() => setBulkModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default GroupManagement;