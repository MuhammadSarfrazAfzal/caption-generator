const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Prevent any unhandled errors from silently crashing Electron
process.on('uncaughtException', (error) => {
  console.error('Unhandled Exception:', error);
});

// Database helper functions (Stored in app userData)
function getDbFilePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'capscribe_projects_db.json');
}

function readProjectsFromDb() {
  try {
    const dbPath = getDbFilePath();
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading projects DB:', err);
    return [];
  }
}

function writeProjectsToDb(projects) {
  try {
    const dbPath = getDbFilePath();
    fs.writeFileSync(dbPath, JSON.stringify(projects, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing projects DB:', err);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1420,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#0a0b0e',
    title: 'CapScribe Studio - Roman Urdu Video Caption Generator',
    frame: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    show: false,
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  const isDev = process.argv.includes('--dev') || process.env.DEV_MODE || !fs.existsSync(distPath);

  if (isDev) {
    const devUrl = 'http://localhost:5173';
    const loadDev = () => {
      mainWindow.loadURL(devUrl).catch(() => {
        setTimeout(loadDev, 500);
      });
    };
    loadDev();
  } else {
    mainWindow.loadFile(distPath);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Database Handlers
ipcMain.handle('db:saveProject', async (event, project) => {
  try {
    const projects = readProjectsFromDb();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      projects[existingIndex] = updatedProject;
    } else {
      projects.unshift(updatedProject);
    }

    writeProjectsToDb(projects);
    return { success: true, project: updatedProject };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db:getProjects', async () => {
  try {
    const projects = readProjectsFromDb();
    // Sort descending by updatedAt
    projects.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return { success: true, projects };
  } catch (err) {
    return { success: false, error: err.message, projects: [] };
  }
});

ipcMain.handle('db:getProject', async (event, id) => {
  try {
    const projects = readProjectsFromDb();
    const found = projects.find(p => p.id === id);
    return { success: true, project: found || null };
  } catch (err) {
    return { success: false, error: err.message, project: null };
  }
});

ipcMain.handle('db:deleteProject', async (event, id) => {
  try {
    let projects = readProjectsFromDb();
    projects = projects.filter(p => p.id !== id);
    writeProjectsToDb(projects);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// IPC Dialog Handlers
ipcMain.handle('dialog:openVideo', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Video File for Captioning',
      properties: ['openFile'],
      filters: [
        { name: 'Video Files', extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const stats = fs.statSync(filePath);
    
    // Read file buffer so renderer can convert it to Blob URL without file:// CORS blocks
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    const mimeMap = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      mkv: 'video/x-matroska',
      avi: 'video/x-msvideo'
    };
    const mimeType = mimeMap[ext] || 'video/mp4';

    return {
      filePath,
      fileName: path.basename(filePath),
      fileSize: stats.size,
      mimeType,
      base64Data: fileBuffer.toString('base64'),
    };
  } catch (err) {
    console.error('Error opening video dialog:', err);
    return null;
  }
});

ipcMain.handle('dialog:saveFile', async (event, { defaultPath, filters, content, encoding = 'utf-8' }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save File',
      defaultPath: defaultPath || 'captions.srt',
      filters: filters || [
        { name: 'SubRip Subtitle (*.srt)', extensions: ['srt'] },
        { name: 'WebVTT (*.vtt)', extensions: ['vtt'] },
        { name: 'JSON (*.json)', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    if (encoding === 'base64') {
      const buffer = Buffer.from(content, 'base64');
      fs.writeFileSync(result.filePath, buffer);
    } else {
      fs.writeFileSync(result.filePath, content, encoding);
    }
    return { success: true, filePath: result.filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file:readAsBase64', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    return { success: true, base64: data.toString('base64') };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Helper to locate FFmpeg
function getFfmpegPath() {
  const possiblePaths = [
    'C:\\Program Files (x86)\\Once Sport\\mio\\ffmpeg.exe',
    'ffmpeg',
    path.join(__dirname, '../bin/ffmpeg.exe'),
    path.join(process.resourcesPath || '', 'ffmpeg.exe'),
  ];
  for (const p of possiblePaths) {
    try {
      if (p === 'ffmpeg') {
        const { execSync } = require('child_process');
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return 'ffmpeg';
      } else if (fs.existsSync(p)) {
        return p;
      }
    } catch {}
  }
  return null;
}

// IPC Video Burning & FFmpeg Handlers
ipcMain.handle('video:hasFfmpeg', async () => {
  return Boolean(getFfmpegPath());
});

ipcMain.handle('video:burnWithFfmpeg', async (event, { inputPath, outputPath, assContent, resolution = 'original' }) => {
  const ffmpegExe = getFfmpegPath();
  if (!ffmpegExe) throw new Error('FFmpeg not found on this computer.');
  
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input video file does not exist: ${inputPath}`);
  }

  // Create temporary ASS subtitle file
  const tempAssPath = path.join(app.getPath('temp'), `capscribe_sub_${Date.now()}.ass`);
  fs.writeFileSync(tempAssPath, assContent, 'utf-8');
  
  // Escape Windows drive colon and backslashes for FFmpeg vf filter
  const escapedAss = tempAssPath.replace(/\\/g, '/').replace(':', '\\:');
  
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    
    // Choose scale filter if requested
    let vf = `ass='${escapedAss}'`;
    if (resolution === '4k') {
      vf = `scale=-2:2160,ass='${escapedAss}'`;
    } else if (resolution === '1080p') {
      vf = `scale=-2:1080,ass='${escapedAss}'`;
    }

    const args = [
      '-i', inputPath,
      '-vf', vf,
      '-c:v', 'h264_mf',
      '-b:v', '3500k',
      '-c:a', 'copy',
      '-y', outputPath
    ];

    const proc = spawn(ffmpegExe, args);
    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      try { fs.unlinkSync(tempAssPath); } catch {}
      if (code === 0) {
        resolve({ success: true, outputPath });
      } else {
        // Fallback without h264_mf (try libopenh264 or default encoder)
        const fallbackArgs = [
          '-i', inputPath,
          '-vf', vf,
          '-c:v', 'libopenh264',
          '-c:a', 'copy',
          '-y', outputPath
        ];
        const proc2 = spawn(ffmpegExe, fallbackArgs);
        let stderr2 = '';
        proc2.stderr.on('data', d => { stderr2 += d.toString(); });
        proc2.on('close', (code2) => {
          if (code2 === 0) {
            resolve({ success: true, outputPath });
          } else {
            reject(new Error(`FFmpeg rendering failed (code ${code}/${code2}): ${stderr || stderr2}`));
          }
        });
        proc2.on('error', err => reject(err));
      }
    });

    proc.on('error', err => {
      try { fs.unlinkSync(tempAssPath); } catch {}
      reject(err);
    });
  });
});

ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});
