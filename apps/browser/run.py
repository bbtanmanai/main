# -*- coding: utf-8 -*-
"""
LinkDrop 링크브라우저 — 분할뷰 이미지 생성 도구
- 외부 도구를 메인 페이지로 직접 로드 (iframe 금지)
- 좌측 400px에 image-browser iframe 오버레이 주입
- 최초 흰색 로딩 페이지 → 외부 도구로 이동
- Windows 11 전용 (WebView2)
"""

import sys
import os
import argparse

def _check_win11():
    if sys.platform != 'win32':
        return False
    v = sys.getwindowsversion()
    return v.major == 10 and v.build >= 22000

def _show_unsupported():
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        messagebox.showwarning(
            'LinkDrop 브라우저',
            'Windows 11 전용 기능입니다.\n\n'
            'Windows 10 환경에서는 사용할 수 없습니다.\n'
            '일반 웹 브라우저(Chrome, Edge)로 이용해 주세요.'
        )
        root.destroy()
    except Exception:
        print('[LinkDrop] Windows 11 전용 기능입니다.')
    sys.exit(0)

if not _check_win11():
    _show_unsupported()

import webview
import ctypes
import json

HOME_URL = 'http://localhost:3000'
LEFT_WIDTH = 400
SETTINGS_FILE = os.path.expanduser('~/.linkdrop-browser/settings.json')
window = None


def _get_chrome_download_path():
    """Chrome 브라우저의 다운로드 경로 읽기"""
    try:
        prefs_path = os.path.expanduser(
            '~/AppData/Local/Google/Chrome/User Data/Default/Preferences'
        )
        with open(prefs_path, encoding='utf-8') as f:
            prefs = json.loads(f.read())
        return prefs.get('download', {}).get('default_directory', '')
    except Exception:
        return ''


def _get_download_path():
    """저장된 다운로드 경로 반환 (설정파일 → Chrome → 기본 Downloads)"""
    # 1. 사용자 설정 파일
    if os.path.exists(SETTINGS_FILE):
        try:
            with open(SETTINGS_FILE, encoding='utf-8') as f:
                settings = json.loads(f.read())
            path = settings.get('download_path', '')
            if path and os.path.isdir(path):
                return path
        except Exception:
            pass
    # 2. Chrome 다운로드 경로
    chrome_path = _get_chrome_download_path()
    if chrome_path and os.path.isdir(chrome_path):
        _save_download_path(chrome_path)
        return chrome_path
    # 3. 기본 Downloads 폴더
    default = os.path.expanduser('~/Downloads')
    _save_download_path(default)
    return default


def _save_download_path(path):
    """다운로드 경로 설정 저장"""
    try:
        os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
        settings = {}
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, encoding='utf-8') as f:
                settings = json.loads(f.read())
        settings['download_path'] = path
        with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False)
    except Exception:
        pass


def _get_screen_size():
    try:
        user32 = ctypes.windll.user32
        return user32.GetSystemMetrics(0), user32.GetSystemMetrics(1)
    except Exception:
        return 1920, 1080


TOOLBAR_H = 44

TOOLS = [
    ("google-flow", "구글 Flow", "https://labs.google/fx/ko/tools/flow/", "#4285f4"),
    ("adobe-firefly", "어도비", "https://firefly.adobe.com/generate/images", "#ff4500"),
    ("leonardo", "레오나르도", "https://app.leonardo.ai/image-generation", "#8b5cf6"),
    ("mixboard", "믹스보드", "https://labs.google.com/mixboard/welcome", "#34a853"),
    ("yupp", "옙", "https://yupp.ai/get-started", "#f97316"),
    ("bing-creator", "빙 이미지", "https://www.bing.com/images/create", "#0078d4"),
]


def _make_inject_js(scene, tool_id):
    """외부 사이트 위에 상단 툴바 + 좌측 패널 iframe을 오버레이하는 JS"""
    panel_url = f'{HOME_URL}/image-browser?scene={scene}&tool={tool_id}&mode=split'

    # 도구 목록을 JSON 배열로 전달 (따옴표 충돌 방지)
    import json
    tools_json = json.dumps([
        {"id": tid, "name": name, "url": url, "color": color, "active": tid == tool_id}
        for tid, name, url, color in TOOLS
    ], ensure_ascii=False)

    return f"""
(function() {{
    var TBH = {TOOLBAR_H};
    var LW = {LEFT_WIDTH};
    var tools = {tools_json};

    function injectAll() {{
    if (document.getElementById('__ld_toolbar')) return;

    // ── 상단 툴바 ──
    var tb = document.createElement('div');
    tb.id = '__ld_toolbar';
    tb.style.cssText = 'position:fixed;top:0;left:0;right:0;height:'+TBH+'px;z-index:2147483647;background:linear-gradient(135deg,#f8fafc,#fff);border-bottom:1px solid #e2e8f0;display:flex;align-items:center;padding:0 16px;gap:4px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.06)';

    function makeNav(svg, title, fn) {{
        var b = document.createElement('button');
        b.innerHTML = svg;
        b.title = title;
        b.style.cssText = 'width:34px;height:34px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.04)';
        b.onmouseenter = function() {{ b.style.background='#f1f5f9';b.style.borderColor='#cbd5e1';b.style.color='#334155';b.style.transform='scale(1.05)'; }};
        b.onmouseleave = function() {{ b.style.background='#fff';b.style.borderColor='#e2e8f0';b.style.color='#64748b';b.style.transform='scale(1)'; }};
        b.onclick = fn;
        return b;
    }}

    tb.appendChild(makeNav('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>', '뒤로가기', function() {{ history.back(); }}));
    tb.appendChild(makeNav('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>', '앞으로가기', function() {{ history.forward(); }}));
    tb.appendChild(makeNav('<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>', '새로고침', function() {{ location.reload(); }}));

    // 주소창
    var addr = document.createElement('input');
    addr.type = 'text';
    addr.value = window.location.href;
    addr.readOnly = true;
    addr.style.cssText = 'width:400px;height:32px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;color:#475569;font-size:12px;padding:0 12px;margin:0 8px;outline:none;font-family:inherit;cursor:text;transition:all 0.2s;box-shadow:inset 0 1px 2px rgba(0,0,0,0.04)';
    addr.onfocus = function() {{ addr.readOnly=false;addr.select();addr.style.borderColor='#818cf8';addr.style.background='#fff';addr.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)'; }};
    addr.onblur = function() {{ addr.readOnly=true;addr.value=window.location.href;addr.style.borderColor='#e2e8f0';addr.style.background='#f8fafc';addr.style.boxShadow='inset 0 1px 2px rgba(0,0,0,0.04)'; }};
    addr.onkeydown = function(e) {{ if(e.key==='Enter'){{ var v=addr.value.trim(); if(v&&!v.startsWith('http'))v='https://'+v; window.location.href=v; }} }};
    tb.appendChild(addr);
    // 주소창 자동 업데이트
    setInterval(function(){{ if(document.activeElement!==addr) addr.value=window.location.href; }}, 1000);

    // 구분선
    var sep = document.createElement('div');
    sep.style.cssText = 'width:1px;height:26px;background:linear-gradient(to bottom,transparent,#cbd5e1,transparent);margin:0 6px';
    tb.appendChild(sep);

    // 도구 버튼 컨테이너
    var toolsWrap = document.createElement('div');
    toolsWrap.style.cssText = 'display:flex;gap:5px;align-items:center';

    tools.forEach(function(t, i) {{
        var b = document.createElement('button');
        b.textContent = t.name;
        var c = t.color || '#4f46e5';
        if (t.active) {{
            b.style.cssText = 'border:none;padding:6px 14px;border-radius:10px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap;transition:all 0.2s;background:'+c+';color:#fff;box-shadow:0 2px 8px '+c+'44;letter-spacing:0.02em';
        }} else {{
            b.style.cssText = 'border:1px solid #e2e8f0;padding:6px 14px;border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all 0.2s;background:#fff;color:#475569;box-shadow:0 1px 2px rgba(0,0,0,0.04);letter-spacing:0.02em';
            b.onmouseenter = function() {{ b.style.background='#f8fafc';b.style.borderColor='#cbd5e1';b.style.transform='translateY(-1px)';b.style.boxShadow='0 3px 8px rgba(0,0,0,0.08)'; }};
            b.onmouseleave = function() {{ b.style.background='#fff';b.style.borderColor='#e2e8f0';b.style.transform='translateY(0)';b.style.boxShadow='0 1px 2px rgba(0,0,0,0.04)'; }};
        }}
        b.onclick = function() {{ if(t.id==='mixboard'){{ window.open(t.url,'_blank'); }}else{{ window.location.href = t.url; }} }};
        toolsWrap.appendChild(b);
    }});
    tb.appendChild(toolsWrap);

    // 우측 여백
    var spacer = document.createElement('div');
    spacer.style.cssText = 'flex:1';
    tb.appendChild(spacer);

    // 다운로드 폴더 버튼
    var btnDownload = document.createElement('button');
    btnDownload.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
    btnDownload.title = '다운로드 폴더 열기';
    btnDownload.style.cssText = 'width:34px;height:34px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;box-shadow:0 1px 2px rgba(0,0,0,0.04)';
    btnDownload.onmouseenter = function() {{ btnDownload.style.background='#f1f5f9';btnDownload.style.color='#334155'; }};
    btnDownload.onmouseleave = function() {{ btnDownload.style.background='#fff';btnDownload.style.color='#64748b'; }};
    btnDownload.onclick = function() {{
        if (window.pywebview) {{ window.pywebview.api.open_downloads(); }}
    }};
    btnDownload.oncontextmenu = function(e) {{
        e.preventDefault();
        if (window.pywebview) {{
            window.pywebview.api.change_download_path().then(function(p) {{
                if(p) alert('다운로드 경로 변경됨:\\n' + p);
            }});
        }}
    }};

    // 구분선
    var sep2 = document.createElement('div');
    sep2.style.cssText = 'width:1px;height:26px;background:linear-gradient(to bottom,transparent,#cbd5e1,transparent);margin:0 6px';

    // 줌 컨트롤
    var zoomLevel = 100;
    var zoomLabel = document.createElement('span');
    zoomLabel.textContent = '100%';
    zoomLabel.style.cssText = 'font-size:11px;font-weight:700;color:#64748b;min-width:36px;text-align:center';

    function applyZoom() {{
        document.body.style.zoom = (zoomLevel / 100).toString();
        zoomLabel.textContent = zoomLevel + '%';
    }}

    var btnMinus = document.createElement('button');
    btnMinus.textContent = '\\u2212';
    btnMinus.title = '축소';
    btnMinus.style.cssText = 'width:30px;height:30px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#475569;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s';
    btnMinus.onmouseenter = function() {{ btnMinus.style.background='#f1f5f9'; }};
    btnMinus.onmouseleave = function() {{ btnMinus.style.background='#fff'; }};
    btnMinus.onclick = function() {{ if(zoomLevel>50) {{ zoomLevel-=10; applyZoom(); }} }};

    var btnPlus = document.createElement('button');
    btnPlus.textContent = '+';
    btnPlus.title = '확대';
    btnPlus.style.cssText = 'width:30px;height:30px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#475569;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s';
    btnPlus.onmouseenter = function() {{ btnPlus.style.background='#f1f5f9'; }};
    btnPlus.onmouseleave = function() {{ btnPlus.style.background='#fff'; }};
    btnPlus.onclick = function() {{ if(zoomLevel<200) {{ zoomLevel+=10; applyZoom(); }} }};

    var rightWrap = document.createElement('div');
    rightWrap.style.cssText = 'display:flex;align-items:center;gap:4px;margin-right:8px';
    rightWrap.appendChild(btnDownload);
    rightWrap.appendChild(sep2);
    rightWrap.appendChild(btnMinus);
    rightWrap.appendChild(zoomLabel);
    rightWrap.appendChild(btnPlus);
    tb.appendChild(rightWrap);

    document.body.appendChild(tb);

    // ── 좌측 패널 ──
    if (!document.getElementById('__ld_panel')) {{
        var p = document.createElement('div');
        p.id = '__ld_panel';
        p.style.cssText = 'position:fixed;left:0;top:'+TBH+'px;width:'+LW+'px;height:calc(100vh - '+TBH+'px);z-index:2147483647;background:#fff;box-shadow:4px 0 12px rgba(0,0,0,0.08);border-right:1px solid #e2e8f0';
        var f = document.createElement('iframe');
        f.src = '{panel_url}';
        f.style.cssText = 'width:100%;height:100%;border:none';
        f.allow = 'clipboard-write';
        p.appendChild(f);
        document.body.appendChild(p);
    }}

    // 외부 사이트 콘텐츠를 패널 오른쪽 + 툴바 아래로 밀기
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.marginLeft = LW+'px';
    document.body.style.paddingTop = (TBH + 56)+'px';
    document.body.style.width = 'calc(100vw - '+LW+'px)';
    }} // end injectAll

    // 즉시 실행 + 주기적 재주입 (SPA가 DOM을 교체하는 경우 대응)
    injectAll();
    setInterval(function() {{
        if (!document.getElementById('__ld_toolbar') || !document.getElementById('__ld_panel')) {{
            injectAll();
        }}
        // body 스타일도 SPA가 리셋할 수 있으므로 재적용
        if (document.body.style.marginLeft !== LW+'px') {{
            document.documentElement.style.overflowX = 'hidden';
            document.body.style.marginLeft = LW+'px';
            document.body.style.paddingTop = (TBH + 56)+'px';
            document.body.style.width = 'calc(100vw - '+LW+'px)';
        }}
    }}, 500);
}})();
"""


def _make_loading_html(tool_url):
    """흰색 로딩 페이지 — 1초 후 외부 사이트로 이동"""
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#64748b">
<p style="font-size:15px">도구 로딩 중...</p>
<script>setTimeout(function(){{ window.location.href='{tool_url}'; }}, 500);</script>
</body></html>"""


class LinkBrowserAPI:
    def close_browser(self):
        if window:
            window.destroy()

    def open_downloads(self):
        """다운로드 폴더 열기"""
        import subprocess
        subprocess.Popen(['explorer', _get_download_path()])

    def change_download_path(self):
        """다운로드 경로 변경 (폴더 선택 다이얼로그)"""
        result = window.create_file_dialog(
            webview.FOLDER_DIALOG,
            directory=_get_download_path(),
        )
        if result and len(result) > 0:
            _save_download_path(result[0])
            return result[0]
        return _get_download_path()

    def get_download_path(self):
        return _get_download_path()


def main():
    global window

    parser = argparse.ArgumentParser()
    parser.add_argument('--tool-url', required=True)
    parser.add_argument('--tool-id', default='')
    parser.add_argument('--scene', type=int, default=0)
    args = parser.parse_args()

    storage = os.path.expanduser('~/.linkdrop-browser')
    os.makedirs(storage, exist_ok=True)

    screen_w, screen_h = _get_screen_size()
    api = LinkBrowserAPI()
    inject_js = _make_inject_js(args.scene, args.tool_id)

    # 흰색 로딩 페이지 생성
    loading_path = os.path.join(storage, '_loading.html')
    with open(loading_path, 'w', encoding='utf-8') as f:
        f.write(_make_loading_html(args.tool_url))

    def on_loaded():
        """페이지 로드 시마다 좌측 패널 주입 (외부 사이트 위에)"""
        if window:
            try:
                window.evaluate_js(inject_js)
            except Exception:
                pass

    window = webview.create_window(
        title='LinkDrop — 이미지 생성',
        url=loading_path,
        width=screen_w,
        height=screen_h - 40,
        x=0, y=0,
        resizable=True,
        js_api=api,
        text_select=True,
    )
    window.events.loaded += on_loaded

    def on_shown():
        """창 표시 후 타이틀바를 밝은 테마로 변경"""
        import threading
        def _apply_light_titlebar():
            import time
            time.sleep(1)  # 창이 완전히 표시될 때까지 대기
            try:
                import ctypes.wintypes
                user32 = ctypes.windll.user32
                dwm = ctypes.windll.dwmapi
                # 창 제목으로 HWND 찾기
                found = []
                def cb(hwnd, _):
                    length = user32.GetWindowTextLengthW(hwnd)
                    if length > 0:
                        buf = ctypes.create_unicode_buffer(length + 1)
                        user32.GetWindowTextW(hwnd, buf, length + 1)
                        if 'LinkDrop' in buf.value:
                            found.append(hwnd)
                    return True
                WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.wintypes.HWND, ctypes.wintypes.LPARAM)
                user32.EnumWindows(WNDENUMPROC(cb), 0)
                for hwnd in found:
                    val = ctypes.c_int(0)
                    dwm.DwmSetWindowAttribute(hwnd, 20, ctypes.byref(val), ctypes.sizeof(val))
                    color = ctypes.c_int(0x00FFFFFF)
                    dwm.DwmSetWindowAttribute(hwnd, 35, ctypes.byref(color), ctypes.sizeof(color))
                    user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, 0x0027)
            except Exception:
                pass
        threading.Thread(target=_apply_light_titlebar, daemon=True).start()

    window.events.shown += on_shown

    webview.settings['ALLOW_DOWNLOADS'] = True

    # pywebview 다운로드 핸들러 오버라이드 — 저장 경로 기억
    def _patch_download_handler():
        """WebView2 다운로드 핸들러를 커스텀 핸들러로 교체"""
        import time
        time.sleep(2)  # WebView2 초기화 대기
        try:
            from webview.platforms.edgechromium import EdgeChrome
            original_handler = EdgeChrome.on_download_starting

            def custom_download_handler(self_ref, sender, args):
                import clr
                clr.AddReference('System.Windows.Forms')
                from System.Windows.Forms import SaveFileDialog, DialogResult

                dialog = SaveFileDialog()
                dialog.InitialDirectory = _get_download_path()
                dialog.RestoreDirectory = False
                dialog.FileName = os.path.basename(str(args.ResultFilePath))
                dialog.Filter = '모든 파일 (*.*)|*.*'

                args.Handled = True  # WebView2 기본 다운로드 알림바 숨김

                result = dialog.ShowDialog()
                if result == DialogResult.OK:
                    save_path = str(dialog.FileName)
                    args.ResultFilePath = save_path
                    args.Handled = False  # 실제 다운로드 진행
                    # 저장 경로 기억
                    new_dir = os.path.dirname(save_path)
                    if new_dir:
                        _save_download_path(new_dir)
                    # 커스텀 토스트 알림 (3초 후 사라짐)
                    fname = os.path.basename(save_path)
                    import threading
                    def _show_toast():
                        import time
                        time.sleep(0.5)
                        if window:
                            try:
                                window.evaluate_js(f"""
(function(){{
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:24px;right:24px;z-index:2147483647;background:#1e293b;color:#fff;padding:12px 20px;border-radius:12px;font-size:13px;font-weight:600;font-family:-apple-system,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.2);display:flex;align-items:center;gap:8px;opacity:0;transform:translateY(10px);transition:all 0.3s ease';
    t.innerHTML='<span style="color:#4ade80">✓</span> 다운로드 완료: {fname}';
    document.body.appendChild(t);
    requestAnimationFrame(function(){{t.style.opacity='1';t.style.transform='translateY(0)'}});
    setTimeout(function(){{t.style.opacity='0';t.style.transform='translateY(10px)';setTimeout(function(){{t.remove()}},300)}},3000);
}})();""")
                            except Exception:
                                pass
                    threading.Thread(target=_show_toast, daemon=True).start()
                else:
                    args.Cancel = True

            EdgeChrome.on_download_starting = custom_download_handler
        except Exception:
            pass

    import threading
    threading.Thread(target=_patch_download_handler, daemon=True).start()

    webview.start(storage_path=storage, private_mode=False, debug=False)


if __name__ == '__main__':
    main()
