// LinkDrop 씬 패널 — background service worker

// 아이콘 클릭 시 사이드패널 자동 열기
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);
