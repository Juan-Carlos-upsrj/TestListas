
import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CalendarEvent } from '../types';
import Modal from './common/Modal';
import Button from './common/Button';
import { v4 as uuidv4 } from 'uuid';
import Icon from './icons/Icon';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    events: CalendarEvent[];
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, date, events }) => {
    const { dispatch } = useContext(AppContext);
    const [newEventTitle, setNewEventTitle] = useState('');
    
    // Create a mutable copy and add the weekend event if applicable.
    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];
    const displayEvents = [...events];

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        const weekendEvent: CalendarEvent = {
            id: `weekend-rest-${dateStr}`,
            date: dateStr,
            title: "Sé feliz y descansa",
            type: 'custom',
            color: 'bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
        };
        if (!displayEvents.some(e => e.id === weekendEvent.id)) {
            displayEvents.unshift(weekendEvent);
        }
    }


    const handleAddEvent = (e: React.FormEvent) => {
        e.preventDefault();
        if (newEventTitle.trim() === '') return;

        const newEvent: CalendarEvent = {
            id: uuidv4(),
            date: date.toISOString().split('T')[0],
            title: newEventTitle,
            type: 'custom',
            color: 'bg-cyan-200'
        };

        dispatch({ type: 'SAVE_EVENT', payload: newEvent });
        setNewEventTitle('');
    };
    
    const handleDeleteEvent = (eventId: string) => {
        dispatch({ type: 'DELETE_EVENT', payload: eventId });
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Eventos para ${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        >
            <div className="space-y-4">
                {displayEvents.length > 0 ? (
                    <ul className="space-y-2">
                        {displayEvents.map(event => (
                            <li key={event.id} className={`flex items-center justify-between p-2 rounded-lg text-slate-800 ${event.color}`}>
                                <div className="flex items-center gap-2">
                                    {event.type === 'gcal' && <Icon name="google" className="w-4 h-4 text-slate-600" />}
                                    <span>{event.title}</span>
                                </div>
                                {event.type === 'custom' && !event.id.startsWith('weekend-rest-') && (
                                    <button onClick={() => handleDeleteEvent(event.id)} className="p-1 text-slate-600 hover:text-red-500">
                                        <Icon name="trash-2" className="w-4 h-4" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-slate-500">No hay eventos para este día.</p>
                )}

                <hr className="dark:border-slate-600"/>

                <div>
                    <h4 className="font-semibold mb-2">Agregar Nuevo Evento</h4>
                    <form onSubmit={handleAddEvent} className="flex gap-2">
                        <input
                            type="text"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            placeholder="Título del evento"
                            className="flex-grow p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500"
                        />
                        <Button type="submit">
                            <Icon name="plus" className="w-4 h-4" /> Agregar
                        </Button>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default EventModal;
