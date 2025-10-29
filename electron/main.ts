// FIX (line 1, 7, 33, 46): The following declarations resolve multiple TypeScript errors
// related to missing Node.js type definitions. The original `/// <reference types="node" />`
// was failing, so we're providing minimal types for `require`, `__dirname`, and `process.platform`
// to allow the file to compile without errors.
declare const require: (id: string) => any;
declare const __dirname: string;
declare global {
  namespace NodeJS {
    interface Process {
      readonly platform: string;
    }
  }
}

import { app, BrowserWindow } from 'electron';
import path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      // preload is a common pattern, but the file was not provided.
      // If a preload script is needed, it should be created and referenced here.
      // preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Use the VITE_DEV_SERVER_URL environment variable if it exists (development),
  // otherwise load the built HTML file (production).
  const viteDevServerUrl = process.env['VITE_DEV_SERVER_URL'];

  if (viteDevServerUrl) {
    mainWindow.loadURL(viteDevServerUrl);
    // Open the DevTools automatically in development.
    mainWindow.webContents.openDevTools();
  } else {
    // Load the index.html from the 'dist' folder which contains the production build.
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
