import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import process from 'process';

// ES Module equivalent of __dirname for robust path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// --- JSON File Persistence Setup ---
const dataDir = path.join(app.getPath('home'), 'OneDrive', 'Documentos', 'AsistenciaApp-Data');
const dataFilePath = path.join(dataDir, 'appData.json');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// --- IPC Handlers for Data ---
ipcMain.handle('get-data', async () => {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
      if (fileContent) {
        return JSON.parse(fileContent);
      }
    }
    return null; // Return null if file doesn't exist or is empty
  } catch (error) {
    console.error('Failed to read or parse data from file:', error);
    return null;
  }
});

ipcMain.handle('save-data', async (event, data) => {
  try {
    const jsonString = JSON.stringify(data, null, 2); // Pretty-print JSON
    fs.writeFileSync(dataFilePath, jsonString, 'utf-8');
  } catch (error) {
    console.error('Failed to save data to file:', error);
  }
});

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, '../../public/logo.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});