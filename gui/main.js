const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add app icon later
    title: 'Bible Shorts AutoUploader',
    resizable: true,
    minWidth: 600,
    minHeight: 500
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

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

// IPC Handlers for GUI actions
ipcMain.handle('generate-single-video', async () => {
  return runPipeline(['--single']);
});

ipcMain.handle('generate-two-videos', async () => {
  return runPipeline([]);
});

ipcMain.handle('test-voice', async () => {
  return runScript('test_custom_voice.py');
});

ipcMain.handle('check-youtube', async () => {
  return runScript('setup.mjs', ['info']);
});

ipcMain.handle('get-logs', async () => {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    const files = fs.readdirSync(logsDir);
    const latestLog = files
      .filter(f => f.endsWith('.log'))
      .sort()
      .reverse()[0];
    
    if (latestLog) {
      const logContent = fs.readFileSync(path.join(logsDir, latestLog), 'utf-8');
      return { success: true, logs: logContent };
    }
    return { success: false, error: 'No log files found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

function runPipeline(args = []) {
  return new Promise((resolve) => {
    const projectRoot = path.join(__dirname, '..');
    const child = spawn('node', ['index.mjs', ...args], {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      // Send real-time updates to renderer
      mainWindow.webContents.send('pipeline-output', data.toString());
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
      mainWindow.webContents.send('pipeline-error', data.toString());
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error,
        code
      });
    });
  });
}

function runScript(scriptName, args = []) {
  return new Promise((resolve) => {
    const projectRoot = path.join(__dirname, '..');
    const isJavaScript = scriptName.endsWith('.mjs') || scriptName.endsWith('.js');
    const command = isJavaScript ? 'node' : 'python';
    const scriptArgs = isJavaScript ? [scriptName, ...args] : [scriptName, ...args];

    const child = spawn(command, scriptArgs, {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        error,
        code
      });
    });
  });
}
