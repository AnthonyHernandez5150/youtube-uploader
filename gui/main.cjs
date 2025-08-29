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
      preload: path.join(__dirname, 'preload.cjs')
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

// File Management Handlers
ipcMain.handle('get-storage-stats', async () => {
  return getStorageStats();
});

ipcMain.handle('get-file-list', async (event, fileType) => {
  return getFileList(fileType);
});

ipcMain.handle('organize-files', async () => {
  return organizeFilesByDate();
});

ipcMain.handle('clean-old-files', async () => {
  return cleanOldFiles();
});

ipcMain.handle('archive-week', async () => {
  return archiveWeekFiles();
});

ipcMain.handle('delete-file', async (event, filePath) => {
  return deleteFile(filePath);
});

ipcMain.handle('get-usage-stats', async () => {
  return getUsageStats();
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

// File Management Functions
async function getStorageStats() {
  try {
    const outputDir = path.join(__dirname, '..', 'output');
    const files = fs.readdirSync(outputDir);
    
    let totalSize = 0;
    let videoCount = 0;
    let audioCount = 0;
    let stockCount = 0;
    let scriptCount = 0;
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      if (file.startsWith('final_video_') && file.endsWith('.mp4')) {
        videoCount++;
      } else if (file.startsWith('narration_') && file.endsWith('.wav')) {
        audioCount++;
      } else if (file.startsWith('stock_') && file.endsWith('.mp4')) {
        stockCount++;
      } else if (file.startsWith('script_') && file.endsWith('.txt')) {
        scriptCount++;
      }
    }
    
    return {
      success: true,
      totalSize: Math.round(totalSize / (1024 * 1024)), // MB
      videoCount,
      audioCount,
      stockCount,
      scriptCount,
      totalFiles: files.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getFileList(fileType) {
  try {
    const outputDir = path.join(__dirname, '..', 'output');
    const files = fs.readdirSync(outputDir);
    
    let pattern = '';
    switch (fileType) {
      case 'videos':
        pattern = 'final_video_';
        break;
      case 'audio':
        pattern = 'narration_';
        break;
      case 'stock':
        pattern = 'stock_';
        break;
      case 'scripts':
        pattern = 'script_';
        break;
      default:
        return { success: false, error: 'Unknown file type' };
    }
    
    const filteredFiles = files
      .filter(file => file.startsWith(pattern))
      .map(file => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: Math.round(stats.size / (1024 * 1024) * 100) / 100, // MB
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    return { success: true, files: filteredFiles };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function organizeFilesByDate() {
  try {
    const outputDir = path.join(__dirname, '..', 'output');
    const archiveDir = path.join(outputDir, 'archive');
    
    await fs.promises.mkdir(archiveDir, { recursive: true });
    
    const files = fs.readdirSync(outputDir);
    let movedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && file.includes('_2025-')) {
        // Extract date from filename
        const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          const dateDir = path.join(archiveDir, dateStr);
          
          await fs.promises.mkdir(dateDir, { recursive: true });
          
          const newPath = path.join(dateDir, file);
          await fs.promises.rename(filePath, newPath);
          movedCount++;
        }
      }
    }
    
    return { success: true, movedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function cleanOldFiles() {
  try {
    const outputDir = path.join(__dirname, '..', 'output');
    const files = fs.readdirSync(outputDir);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.birthtime < threeDaysAgo) {
        // Keep at least 2 of each type
        const prefix = file.split('_')[0];
        const sameTypeFiles = files.filter(f => f.startsWith(prefix + '_'));
        
        if (sameTypeFiles.length > 2) {
          await fs.promises.unlink(filePath);
          deletedCount++;
        }
      }
    }
    
    return { success: true, deletedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function archiveWeekFiles() {
  try {
    const outputDir = path.join(__dirname, '..', 'output');
    const archiveDir = path.join(outputDir, 'archive', 'week-' + new Date().toISOString().slice(0, 10));
    
    await fs.promises.mkdir(archiveDir, { recursive: true });
    
    const files = fs.readdirSync(outputDir);
    let archivedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(outputDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && file.includes('_2025-')) {
        const newPath = path.join(archiveDir, file);
        await fs.promises.rename(filePath, newPath);
        archivedCount++;
      }
    }
    
    return { success: true, archivedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getUsageStats() {
  try {
    // Import the usage tracker
    const { DailyUsageTracker } = await import('../utils/dailyUsageTracker.mjs');
    const tracker = new DailyUsageTracker();
    const stats = await tracker.getUsageStats();
    
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
