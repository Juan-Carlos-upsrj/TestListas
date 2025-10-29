import { AppState } from './types';

export {};

declare global {
  interface Window {
    electronAPI: {
      getData: () => Promise<AppState>;
      saveData: (data: AppState) => Promise<void>;
    };
  }
}
