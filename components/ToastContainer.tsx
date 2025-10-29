
import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Toast } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './icons/Icon';

const toastIcons = {
    success: { icon: 'check-circle-2', color: 'text-green-500' },
    error: { icon: 'x-circle', color: 'text-red-500' },
    info: { icon: 'info', color: 'text-blue-500' },
};

const ToastMessage: React.FC<{ toast: Toast, onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 3000);

        return () => {
            clearTimeout(timer);
        };
    }, [toast, onRemove]);

    const { icon, color } = toastIcons[toast.type];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className="flex items-center w-full max-w-xs p-4 mb-4 text-slate-600 bg-white rounded-lg shadow-lg dark:text-slate-300 dark:bg-slate-800"
            role="alert"
        >
            <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 ${color} bg-opacity-10 rounded-lg`}>
                <Icon name={icon} className="w-5 h-5" />
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <button
                type="button"
                className="ml-auto -mx-1.5 -my-1.5 bg-white text-slate-400 hover:text-slate-900 rounded-lg focus:ring-2 focus:ring-slate-300 p-1.5 hover:bg-slate-100 inline-flex h-8 w-8 dark:text-slate-500 dark:hover:text-white dark:bg-slate-800 dark:hover:bg-slate-700"
                onClick={() => onRemove(toast.id)}
            >
                <span className="sr-only">Close</span>
                <Icon name="x" className="w-5 h-5"/>
            </button>
        </motion.div>
    );
};


const ToastContainer: React.FC = () => {
    const { state, dispatch } = useContext(AppContext);

    const removeToast = (id: number) => {
        dispatch({ type: 'REMOVE_TOAST', payload: id });
    };

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <AnimatePresence>
                {state.toasts.map((toast) => (
                    <ToastMessage key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastContainer;
