import { contextBridge, ipcRenderer } from 'electron';
import type { AppState } from '../types';

contextBridge.exposeInMainWorld('electronAPI', {
  getData: (): Promise<Partial<AppState>> => ipcRenderer.invoke('get-data'),
  saveData: (data: AppState): Promise<void> => ipcRenderer.invoke('save-data', data),
  getVersion: (): Promise<string> => ipcRenderer.invoke('get-version'),
  onUpdateAvailable: (callback: () => void) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback: () => void) => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.send('restart_app'),
});