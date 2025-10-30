"use strict";const e=require("electron");e.contextBridge.exposeInMainWorld("electronAPI",{getData:()=>e.ipcRenderer.invoke("get-data"),saveData:t=>e.ipcRenderer.invoke("save-data",t)});
