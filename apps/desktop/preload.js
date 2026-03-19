const { contextBridge, ipcRenderer } = require('electron');

// 렌더러(HTML)에서 window.api 로 접근 가능
contextBridge.exposeInMainWorld('api', {
  // Python 서버 API 호출
  call: (method, path, body) =>
    ipcRenderer.invoke('api-call', { method, path, body }),

  // 폴더 열기
  openFolder: (path) => ipcRenderer.invoke('open-folder', path),

  // 서버 이벤트 수신
  onServerReady: (cb) => ipcRenderer.on('server-ready', cb),
  onServerError: (cb) => ipcRenderer.on('server-error', (_, msg) => cb(msg)),
  onServerLog:   (cb) => ipcRenderer.on('server-log',   (_, msg) => cb(msg)),
});
