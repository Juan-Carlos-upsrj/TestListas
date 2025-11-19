import { AppState } from './types';

export {};

declare global {
  interface Window {
    electronAPI: {
      getData: () => Promise<Partial<AppState>>;
      saveData: (data: AppState) => Promise<void>;
      getVersion: () => Promise<string>;
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      restartApp: () => void;
    };
  }
}