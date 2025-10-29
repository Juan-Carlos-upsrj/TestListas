import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import initSqlJs from 'sql.js';
import { AppState } from '../types';

// --- Database Persistence Setup ---
const dataDir = path.join(app.getPath('home'), 'OneDrive', 'Documentos', 'AsistenciaApp-Data');
const dbFilePath = path.join(dataDir, 'asistencia.db');
let db;

// Helper to convert SQL.js output to a more usable array of objects
const parseSqlJsResult = (result) => {
    if (!result || result.length === 0) {
        return [];
    }
    const { columns, values } = result[0];
    return values.map(row => {
        const rowObject = {};
        columns.forEach((col, index) => {
            rowObject[col] = row[index];
        });
        return rowObject;
    });
};

async function initializeDatabase() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // sql.js needs the wasm file. We load it from the node_modules folder.
    // electron-builder is configured in package.json to package this file.
    const sqlJs = await initSqlJs({
      locateFile: file => path.join(app.getAppPath(), 'node_modules/sql.js/dist', file)
    });

    // If the database file exists, load it. Otherwise, create a new one.
    if (fs.existsSync(dbFilePath)) {
      const fileBuffer = fs.readFileSync(dbFilePath);
      db = new sqlJs.Database(fileBuffer);
      console.log('Successfully loaded existing SQLite database.');
    } else {
      db = new sqlJs.Database();
      console.log('Created new in-memory SQLite database.');
      // You could initialize schema here if creating a new DB
      // const data = db.export();
      // fs.writeFileSync(dbFilePath, data);
    }
    
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
    const groupsResult = db.exec('SELECT id, name, subject, classDays FROM groups');
    const studentsResult = db.exec('SELECT id, name, matricula, group_id FROM students');

    const groupsFromDb = parseSqlJsResult(groupsResult);
    const studentsFromDb = parseSqlJsResult(studentsResult);
    
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
    
    return {
        groups: transformedGroups,
        // NOTE: Attendance, grades, etc., are not in the DB yet.
        // They will use the default state from the context.
    };
  } catch (error) {
    console.error('Failed to read or parse data from database:', error);
    return null;
  }
});

ipcMain.handle('save-data', async (event, data: AppState) => {
  if (!db) {
    console.error('Database not initialized, cannot save.');
    return;
  }
  try {
    // This is a simple but effective strategy for saving:
    // clear the tables and re-insert everything from the current app state.
    db.exec("BEGIN TRANSACTION;");
    db.exec("DELETE FROM students;");
    db.exec("DELETE FROM groups;");

    const groupStmt = db.prepare("INSERT INTO groups (id, name, subject, classDays) VALUES (?, ?, ?, ?)");
    const studentStmt = db.prepare("INSERT INTO students (id, name, matricula, group_id) VALUES (?, ?, ?, ?)");

    for (const group of data.groups) {
      groupStmt.run([group.id, group.name, group.subject, group.classDays.join(',')]);
      for (const student of group.students) {
        studentStmt.run([student.id, student.name, student.matricula, group.id]);
      }
    }

    groupStmt.free();
    studentStmt.free();
    db.exec("COMMIT;");
    
    // Export the in-memory database to a buffer and write it to the file
    const fileData = db.export();
    fs.writeFileSync(dbFilePath, fileData);
    console.log('Successfully saved data to SQLite database.');

  } catch (error) {
    db.exec("ROLLBACK;");
    console.error('Failed to save data to database:', error);
  }
});

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
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

app.on('ready', async () => {
  await initializeDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (db) {
    db.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});