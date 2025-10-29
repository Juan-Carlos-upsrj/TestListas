// FIX: Switched to ES module imports to resolve TypeScript errors with `require`.
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import isSquirrelStartup from 'electron-squirrel-startup';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { AppState } from '../types';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (isSquirrelStartup) {
  app.quit();
}

// FIX: In ES modules, __dirname is not available by default.
// This polyfill creates it from import.meta.url, which is the standard ES module approach.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Database Persistence Setup ---
const dataDir = path.join(app.getPath('home'), 'OneDrive', 'Documentos', 'AsistenciaApp-Data');
const dataFilePath = path.join(dataDir, 'asistencia.db');

let db;

async function initializeDatabase() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    db = await open({
      filename: dataFilePath,
      driver: sqlite3.Database
    });
    
    console.log('Successfully connected to the SQLite database.');

  } catch (error) {
    console.error('Failed to initialize or connect to database:', error);
  }
}

// --- IPC Handlers for Data ---
ipcMain.handle('get-data', async (): Promise<Partial<AppState> | null> => {
  if (!db) {
    console.error('Database not initialized.');
    return null;
  }
  try {
    const groupsFromDb = await db.all('SELECT id, name, subject, classDays FROM groups');
    const studentsFromDb = await db.all('SELECT id, name, matricula, group_id FROM students');

    const transformedGroups = groupsFromDb.map(group => {
      return {
        ...group,
        id: String(group.id), // Ensure IDs are strings
        classDays: group.classDays ? group.classDays.split(',') : [],
        students: studentsFromDb
          .filter(student => student.group_id === group.id)
          .map(student => ({
              ...student,
              id: String(student.id), // Ensure IDs are strings
          })),
      };
    });
    
    // We only return the parts of the state that come from the database.
    // The rest will use the default state defined in the context.
    return {
        groups: transformedGroups,
    };
  } catch (error) {
    console.error('Failed to read or parse data from database:', error);
    return null; // Return null on error, renderer will use default state
  }
});

ipcMain.handle('save-data', async (event, data) => {
  // IMPORTANT: Save functionality is temporarily disabled to prevent corruption
  // of the user's database file. This needs to be implemented carefully.
  console.log('Save data called, but is currently disabled for safety. Data received:', data);
  // try {
  //   fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  // } catch (error) {
  //   console.error('Failed to save data to file:', error);
  // }
});

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // Use __dirname which is provided natively in CommonJS
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Use the VITE_DEV_SERVER_URL environment variable if it exists (development),
  // otherwise load the built HTML file (production).
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Open the DevTools automatically in development.
    mainWindow.webContents.openDevTools();
  } else {
    // Load the index.html from the 'dist' folder which contains the production build.
    // The path should be relative to the 'dist-electron' folder where this script runs.
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  await initializeDatabase();
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