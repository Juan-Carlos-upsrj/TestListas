// FIX: Switched to ES module imports to resolve TypeScript errors with `require`.
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import isSquirrelStartup from 'electron-squirrel-startup';
import { fileURLToPath } from 'url';
// FIX: The `process` object is a global in Node.js, so it doesn't need to be imported or required.

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (isSquirrelStartup) {
  app.quit();
}

// FIX: In ES modules, __dirname is not available by default.
// This polyfill creates it from import.meta.url, which is the standard ES module approach.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Data Persistence Setup ---
const dataDir = path.join(app.getPath('home'), 'OneDrive', 'Documentos', 'AsistenciaApp-Data');
const dataFilePath = path.join(dataDir, 'asistencia.db');

// Ensure data directory and file exist on startup
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({}));
  }
} catch (error) {
    console.error('Failed to initialize data store:', error);
}

// --- IPC Handlers for Data ---
ipcMain.handle('get-data', async () => {
  try {
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileContent || '{}');
  } catch (error) {
    console.error('Failed to read or parse data file:', error);
    return null; // Return null on error, renderer will use default state
  }
});

ipcMain.handle('save-data', async (event, data) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save data to file:', error);
  }
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
app.on('ready', createWindow);

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
