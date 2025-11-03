import { contextBridge, ipcRenderer } from 'electron';
import type { AppState } from '../types';

contextBridge.exposeInMainWorld('electronAPI', {
  getData: (): Promise<Partial<AppState>> => ipcRenderer.invoke('get-data'),
  saveData: (data: AppState): Promise<void> => ipcRenderer.invoke('save-data', data),
});