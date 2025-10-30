import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import type { AppState } from '../types';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Define the path for storing application data in the user's app data directory.
const dataPath = path.join(app.getPath('userData'), 'appState.json');

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // The preload script path is determined by the vite-plugin-electron build output.
      // Typically, it's placed alongside the main process script in 'dist-electron'.
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the index.html of the app.
  const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open the DevTools in development.
    mainWindow.webContents.openDevTools();
  } else {
    // In production, the renderer's files are expected in a 'dist' folder
    // relative to the electron app's root. The main script is in 'dist-electron'.
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // IPC handler to get data from the file.
    ipcMain.handle('get-data', async () => {
        try {
            const data = await fs.readFile(dataPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // If the file doesn't exist, it's not an error on first launch, just return null.
            if (error.code === 'ENOENT') {
                return null;
            }
            // For other errors, log it and return null so the app can start with a default state.
            console.error('Failed to read data file:', error);
            return null;
        }
    });

    // IPC handler to save data to the file.
    ipcMain.handle('save-data', async (event, data: AppState) => {
        try {
            await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    });

    createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
