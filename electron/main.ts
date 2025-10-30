import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import type { AppState } from '../types';
// FIX: Explicitly import process to resolve 'platform' property error.
import process from 'node:process';
// FIX: Import fileURLToPath to create a polyfill for __dirname.
import { fileURLToPath } from 'node:url';

const isDev = !!process.env.VITE_DEV_SERVER_URL;

// FIX: __dirname is not available in ES modules. This polyfill provides it,
// which is necessary for TypeScript to resolve the name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const userDataPath = app.getPath('userData');
const dataFilePath = path.join(userDataPath, 'appData.json');

// Function to read application data from a JSON file.
function readData(): Partial<AppState> {
  try {
    if (fs.existsSync(dataFilePath)) {
      const rawData = fs.readFileSync(dataFilePath, 'utf-8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Failed to read data file:', error);
  }
  return {};
}

// Function to write application data to a JSON file.
function writeData(data: AppState): void {
  try {
    // Writing synchronously to ensure data is saved before app quits.
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write data file:', error);
  }
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 600,
    icon: path.join(__dirname, isDev ? '../../public/logo.png' : '../dist/logo.png'),
    webPreferences: {
      // The preload script is essential for secure communication
      // between the main process and the renderer process.
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show the window until it's ready
  });

  // Load the app's URL. This will be the Vite dev server in development,
  // or the built index.html file in production.
  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open the DevTools automatically in development.
    mainWindow.webContents.openDevTools();
  } else {
    // The path is relative to the main process script's location (`dist-electron/main.js`).
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  
  // Gracefully show window when ready to avoid a white flash.
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  // Set up IPC listeners for data persistence.
  // These correspond to the functions exposed in the preload script.
  ipcMain.handle('get-data', () => {
    return readData();
  });

  ipcMain.handle('save-data', (_, data: AppState) => {
    writeData(data);
  });

  createWindow();

  // On macOS, re-create a window when the dock icon is clicked
  // and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});