import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Development mode detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const iconPath = path.join(__dirname, '../public/icon.ico');
  const hasIcon = fs.existsSync(iconPath);
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    title: 'Tax Compliance Management System',
    icon: hasIcon ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    show: false,
  });

  // Load URL based on environment
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// IPC Handlers for file operations
ipcMain.handle('dialog:openFile', async (_event, options?: Electron.OpenDialogOptions) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    ...options,
  });
  return result;
});

ipcMain.handle('dialog:openDirectory', async (_event, options?: Electron.OpenDialogOptions) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
    ...options,
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (_event, options?: Electron.SaveDialogOptions) => {
  const result = await dialog.showSaveDialog(mainWindow!, options ?? {});
  return result;
});

ipcMain.handle('dialog:messageBox', async (_event, options: Electron.MessageBoxOptions) => {
  const result = await dialog.showMessageBox(mainWindow!, options);
  return result;
});

ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  await shell.openExternal(url);
  return { success: true };
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const data = await fs.promises.readFile(filePath);
    return { success: true, data: data.toString('base64') };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: string, encoding: 'base64' | 'utf8' = 'base64') => {
  try {
    const buffer = encoding === 'base64' ? Buffer.from(data, 'base64') : Buffer.from(data, 'utf8');
    await fs.promises.writeFile(filePath, buffer);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:exists', async (_event, filePath: string) => {
  try {
    await fs.promises.access(filePath);
    return { exists: true };
  } catch {
    return { exists: false };
  }
});

ipcMain.handle('fs:mkdir', async (_event, dirPath: string, recursive = true) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
  try {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return {
      success: true,
      files: files.map(f => ({
        name: f.name,
        isDirectory: f.isDirectory(),
        isFile: f.isFile(),
      })),
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// App info
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:getName', () => app.getName());
ipcMain.handle('app:getPath', (_event, name: 'userData' | 'temp' | 'exe' | 'desktop') => {
  return app.getPath(name);
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

// Desktop operations
ipcMain.handle('shell:openPath', async (_event, path: string) => {
  try {
    await shell.openPath(path);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('shell:showItemInFolder', async (_event, path: string) => {
  try {
    shell.showItemInFolder(path);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:copyFile', async (_event, source: string, dest: string) => {
  try {
    await fs.promises.copyFile(source, dest);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('desktop:getPath', async () => {
  try {
    const desktopPath = app.getPath('desktop');
    return { success: true, path: desktopPath };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});
