const { app, BrowserWindow, ipcMain, shell, Notification, globalShortcut } = require('electron');

// Electron에서 Web Notifications API 권한 허용
app.on('web-contents-created', (_, wc) => {
  wc.session.setPermissionRequestHandler((_, permission, cb) => {
    cb(permission === 'notifications');
  });
});
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const SERVER_PORT = 7788;
const SERVER_URL  = `http://localhost:${SERVER_PORT}`;
const PROTOCOL    = 'linkdrop';

let mainWindow = null;
let pythonProcess = null;

// ── 커스텀 프로토콜 등록 (linkdrop://) ────────────────────────────────────────
// 개발 모드: 현재 실행 파일을 프로토콜 핸들러로 등록
// 빌드 모드: NSIS 설치 시 레지스트리에 자동 등록됨
if (process.defaultApp) {
  // 개발 모드 — electron . 으로 실행할 때
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
} else {
  // 빌드 모드 — .exe로 실행할 때
  app.setAsDefaultProtocolClient(PROTOCOL);
}

// ── 딥링크 URL 파싱 ──────────────────────────────────────────────────────────
function handleDeepLink(url) {
  if (!url) return;
  console.log(`[DeepLink] ${url}`);
  // linkdrop://start?job=xxx 등 향후 확장 가능
  // 현재는 앱 포커스만 처리
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}

// ── Windows: 단일 인스턴스 + 딥링크 수신 ──────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_, argv) => {
    // 이미 실행 중일 때 linkdrop:// 클릭하면 여기로 옴
    const deepUrl = argv.find(a => a.startsWith(`${PROTOCOL}://`));
    handleDeepLink(deepUrl);
  });
}

// ── 포트 점유 프로세스 정리 ────────────────────────────────────────────────────
function killPortProcess(port) {
  return new Promise((resolve) => {
    const { execSync } = require('child_process');
    try {
      const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8' });
      const lines = out.trim().split('\n').filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[parts.length - 1], 10);
        if (pid > 0) pids.add(pid);
      }
      for (const pid of pids) {
        console.log(`[Port] ${port} 포트 점유 프로세스 종료 (PID ${pid})`);
        try { execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf-8' }); }
        catch { /* 이미 종료된 경우 무시 */ }
      }
    } catch { /* LISTENING 없으면 정상 — 포트 비어있음 */ }
    resolve();
  });
}

// ── Python 서버 실행 ───────────────────────────────────────────────────────────
function startPythonServer() {
  const serverDir = path.join(__dirname, 'server');
  const serverScript = path.join(serverDir, 'pipeline_server.py');

  // 개발: python, 배포: 번들된 python 경로
  const pythonExe = process.env.PYTHON_EXE || 'python';

  console.log(`[Python] 서버 시작: ${pythonExe} ${serverScript}`);

  pythonProcess = spawn(pythonExe, ['-X', 'utf8', serverScript], {
    cwd: path.join(__dirname, '..', '..'),  // C:\LinkDropV2 (루트)
    env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pythonProcess.stdout.on('data', (d) => {
    const msg = d.toString().trim();
    console.log(`[Python] ${msg}`);
    if (mainWindow) mainWindow.webContents.send('server-log', msg);
  });

  pythonProcess.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    console.error(`[Python ERR] ${msg}`);
    if (mainWindow) mainWindow.webContents.send('server-log', `[ERR] ${msg}`);
  });

  pythonProcess.on('exit', (code) => {
    console.log(`[Python] 서버 종료 (code=${code})`);
    pythonProcess = null;
  });
}

// ── Python 서버 준비 대기 ─────────────────────────────────────────────────────
function waitForServer(retries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const check = () => {
      http.get(`${SERVER_URL}/health`, (res) => {
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (++count >= retries) reject(new Error('Python 서버 시작 실패'));
      else setTimeout(check, interval);
    };
    check();
  });
}

// ── Electron 창 생성 ──────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 1000,
    minHeight: 700,
    resizable: true,
    title: 'LinkDrop 영상 생성',
    backgroundColor: '#0f0f1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
    globalShortcut.unregisterAll();
  });
}

function registerShortcuts() {
  globalShortcut.register('F5', () => {
    if (mainWindow) mainWindow.reload();
  });
  globalShortcut.register('F12', () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools();
  });
  globalShortcut.register('CommandOrControl+R', () => {
    if (mainWindow) mainWindow.reload();
  });
}

// ── IPC: 렌더러 → 메인 ───────────────────────────────────────────────────────
ipcMain.handle('api-call', async (_, { method, path: apiPath, body }) => {
  return new Promise((resolve) => {
    const url = `${SERVER_URL}${apiPath}`;
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      method: method || 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ ok: true, data: JSON.parse(data) }); }
        catch { resolve({ ok: true, data }); }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
});

ipcMain.handle('open-folder', async (_, folderPath) => {
  shell.openPath(folderPath);
});

// ── 앱 생명주기 ───────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  await killPortProcess(SERVER_PORT);
  startPythonServer();
  createWindow();
  registerShortcuts();

  // 시작 시 딥링크 인자 처리 (linkdrop://start?... 로 실행된 경우)
  const deepUrl = process.argv.find(a => a.startsWith(`${PROTOCOL}://`));
  if (deepUrl) handleDeepLink(deepUrl);

  // 서버 준비되면 UI에 알림
  waitForServer()
    .then(() => {
      console.log('[Electron] Python 서버 준비 완료');
      if (mainWindow) mainWindow.webContents.send('server-ready');
    })
    .catch((e) => {
      console.error('[Electron] 서버 대기 실패:', e.message);
      if (mainWindow) mainWindow.webContents.send('server-error', e.message);
    });
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill();
    pythonProcess = null;
  }
  app.quit();
});

app.on('before-quit', () => {
  if (pythonProcess) pythonProcess.kill();
});
