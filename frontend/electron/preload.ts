import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for IPC channels
interface DialogOptions {
  openFile?: Electron.OpenDialogOptions;
  openDirectory?: Electron.OpenDialogOptions;
  saveFile?: Electron.SaveDialogOptions;
  messageBox?: Electron.MessageBoxOptions;
}

interface FileOperationResult {
  success: boolean;
  data?: string;
  error?: string;
  exists?: boolean;
  files?: Array<{ name: string; isDirectory: boolean; isFile: boolean }>;
}

interface AppInfo {
  getVersion: () => string;
  getName: () => string;
  getPath: (name: 'userData' | 'temp' | 'exe' | 'desktop') => string;
}

interface WindowControls {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => boolean;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog operations
  dialog: {
    openFile: (options?: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:openFile', options),
    openDirectory: (options?: Electron.OpenDialogOptions) =>
      ipcRenderer.invoke('dialog:openDirectory', options),
    saveFile: (options?: Electron.SaveDialogOptions) =>
      ipcRenderer.invoke('dialog:saveFile', options),
    messageBox: (options: Electron.MessageBoxOptions) =>
      ipcRenderer.invoke('dialog:messageBox', options),
  },

  // Shell operations
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
    showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path),
  },

  // File system operations
  fs: {
    readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, data: string, encoding?: 'base64' | 'utf8') =>
      ipcRenderer.invoke('fs:writeFile', filePath, data, encoding),
    exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
    mkdir: (dirPath: string, recursive?: boolean) =>
      ipcRenderer.invoke('fs:mkdir', dirPath, recursive),
    readdir: (dirPath: string) =>
      ipcRenderer.invoke('fs:readdir', dirPath),
    copyFile: (source: string, dest: string) =>
      ipcRenderer.invoke('fs:copyFile', source, dest),
  },

  // Desktop operations
  desktop: {
    getPath: () => ipcRenderer.invoke('desktop:getPath'),
  },

  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getName: () => ipcRenderer.invoke('app:getName'),
    getPath: (name: 'userData' | 'temp' | 'exe' | 'desktop') =>
      ipcRenderer.invoke('app:getPath', name),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Platform info
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development' || !process.env.ELECTRON_RUN_AS_NODE,
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      dialog: {
        openFile: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
        openDirectory: (options?: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
        saveFile: (options?: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;
        messageBox: (options: Electron.MessageBoxOptions) => Promise<number>;
      };
      shell: {
        openExternal: (url: string) => Promise<{ success: boolean }>;
        openPath: (path: string) => Promise<{ success: boolean; error?: string }>;
        showItemInFolder: (path: string) => Promise<{ success: boolean; error?: string }>;
      };
      fs: {
        readFile: (filePath: string) => Promise<FileOperationResult>;
        writeFile: (filePath: string, data: string, encoding?: 'base64' | 'utf8') => Promise<FileOperationResult>;
        exists: (filePath: string) => Promise<{ exists: boolean }>;
        mkdir: (dirPath: string, recursive?: boolean) => Promise<{ success: boolean; error?: string }>;
        readdir: (dirPath: string) => Promise<{ success: boolean; files?: Array<{ name: string; isDirectory: boolean; isFile: boolean }>; error?: string }>;
        copyFile: (source: string, dest: string) => Promise<{ success: boolean; error?: string }>;
      };
      desktop: {
        getPath: () => Promise<{ success: boolean; path?: string; error?: string }>;
      };
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };
      platform: NodeJS.Platform;
      isDev: boolean;
    };
  }
}