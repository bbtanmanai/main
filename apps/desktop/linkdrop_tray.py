#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LinkDrop 트레이 앱
==================
시스템 트레이에 아이콘 표시 + Python 파이프라인 서버(7788) 실행.
웹(localhost:3000)에서 시나리오를 전송하면 영상을 생성합니다.

사용법:
  python linkdrop_tray.py          (개발)
  LinkDrop.exe                     (PyInstaller 빌드 후)
"""

import os
import sys
import subprocess
import threading
import time
import socket
from pathlib import Path

# ── 경로 설정 ─────────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    # PyInstaller 빌드 시
    BASE_DIR = Path(sys._MEIPASS)
    ROOT_DIR = Path(sys.executable).parent
else:
    # 개발 모드
    BASE_DIR = Path(__file__).parent
    ROOT_DIR = BASE_DIR.parent.parent  # C:\LinkDropV2

SERVER_SCRIPT = BASE_DIR / "server" / "pipeline_server.py"
SERVER_PORT = 7788

# ── 포트 정리 ─────────────────────────────────────────────────────────────────
def kill_port(port: int):
    """이미 점유된 포트의 프로세스를 종료."""
    if sys.platform != 'win32':
        return
    try:
        out = subprocess.check_output(
            f'netstat -ano | findstr :{port} | findstr LISTENING',
            shell=True, text=True
        )
        pids = set()
        for line in out.strip().split('\n'):
            parts = line.split()
            if parts:
                try:
                    pids.add(int(parts[-1]))
                except ValueError:
                    pass
        for pid in pids:
            if pid > 0:
                try:
                    subprocess.run(f'taskkill /PID {pid} /F', shell=True,
                                   capture_output=True)
                    print(f"[Port] {port} 포트 프로세스 종료 (PID {pid})")
                except Exception:
                    pass
    except subprocess.CalledProcessError:
        pass  # LISTENING 없음 = 포트 비어있음


# ── 서버 프로세스 관리 ────────────────────────────────────────────────────────
server_process: subprocess.Popen | None = None


def start_server():
    global server_process
    kill_port(SERVER_PORT)
    time.sleep(0.5)

    python_exe = sys.executable if getattr(sys, 'frozen', False) else 'python'

    server_process = subprocess.Popen(
        [python_exe, '-X', 'utf8', str(SERVER_SCRIPT)],
        cwd=str(ROOT_DIR),
        env={**os.environ, 'PYTHONIOENCODING': 'utf-8', 'PYTHONUTF8': '1'},
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == 'win32' else 0,
    )
    print(f"[Server] 시작 (PID {server_process.pid})")

    # stdout/stderr 로깅 (백그라운드)
    def log_stream(stream, prefix):
        for line in iter(stream.readline, b''):
            print(f"[{prefix}] {line.decode('utf-8', errors='replace').rstrip()}")

    threading.Thread(target=log_stream, args=(server_process.stdout, 'Server'), daemon=True).start()
    threading.Thread(target=log_stream, args=(server_process.stderr, 'Server ERR'), daemon=True).start()


def stop_server():
    global server_process
    if server_process:
        server_process.terminate()
        try:
            server_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server_process.kill()
        server_process = None
        print("[Server] 종료")


def is_server_alive() -> bool:
    try:
        import urllib.request
        r = urllib.request.urlopen(f'http://localhost:{SERVER_PORT}/health', timeout=2)
        return r.status == 200
    except Exception:
        return False


def wait_for_server(retries=15, interval=0.5) -> bool:
    for _ in range(retries):
        if is_server_alive():
            return True
        time.sleep(interval)
    return False


# ── 트레이 아이콘 ─────────────────────────────────────────────────────────────
def create_tray():
    import pystray
    from PIL import Image, ImageDraw

    # 아이콘 생성 (indigo 원 + L 텍스트)
    icon_img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(icon_img)
    d.ellipse([4, 4, 60, 60], fill=(99, 102, 241))
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 36)
        d.text((18, 8), "L", fill="white", font=font)
    except Exception:
        d.text((22, 12), "L", fill="white")

    def on_open_web(icon, item):
        import webbrowser
        webbrowser.open('http://localhost:3000/content/longform')

    def on_restart(icon, item):
        stop_server()
        start_server()
        if wait_for_server():
            icon.notify("서버가 재시작되었습니다", "LinkDrop")

    def on_quit(icon, item):
        stop_server()
        icon.stop()

    def get_status(item):
        return f"{'● 연결됨' if is_server_alive() else '○ 꺼짐'} (포트 {SERVER_PORT})"

    menu = pystray.Menu(
        pystray.MenuItem(get_status, None, enabled=False),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('영상 제작 페이지 열기', on_open_web, default=True),
        pystray.MenuItem('서버 재시작', on_restart),
        pystray.Menu.SEPARATOR,
        pystray.MenuItem('종료', on_quit),
    )

    icon = pystray.Icon('LinkDrop', icon_img, 'LinkDrop 영상 생성', menu)
    return icon


# ── 커스텀 프로토콜 등록 (Windows 레지스트리) ─────────────────────────────────
def register_protocol():
    if sys.platform != 'win32':
        return
    try:
        import winreg
        exe_path = sys.executable if getattr(sys, 'frozen', False) else f'"{sys.executable}" "{__file__}"'

        key_path = r'Software\Classes\linkdrop'
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as key:
            winreg.SetValue(key, '', winreg.REG_SZ, 'URL:LinkDrop Protocol')
            winreg.SetValueEx(key, 'URL Protocol', 0, winreg.REG_SZ, '')

        cmd_path = rf'{key_path}\shell\open\command'
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, cmd_path) as key:
            winreg.SetValue(key, '', winreg.REG_SZ, f'{exe_path} "%1"')

        print("[Protocol] linkdrop:// 등록 완료")
    except Exception as e:
        print(f"[Protocol] 등록 실패: {e}")


# ── 단일 인스턴스 확인 ────────────────────────────────────────────────────────
def is_already_running() -> bool:
    """다른 인스턴스가 이미 실행 중인지 확인."""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        sock.connect(('127.0.0.1', SERVER_PORT))
        sock.close()
        return True
    except (ConnectionRefusedError, socket.timeout, OSError):
        return False


# ── 메인 ─────────────────────────────────────────────────────────────────────
def main():
    # 딥링크 인자 처리 (linkdrop://start 등)
    deep_url = None
    for arg in sys.argv[1:]:
        if arg.startswith('linkdrop://'):
            deep_url = arg
            break

    # 이미 실행 중이면 포커스만 하고 종료
    if is_already_running():
        print("[Tray] 이미 실행 중 — 기존 인스턴스에 위임")
        if deep_url:
            # 이미 실행 중인 서버에 헬스체크만 하고 종료
            print(f"[DeepLink] {deep_url}")
        return

    print("=" * 50)
    print("  LinkDrop 영상 생성 프로그램")
    print("=" * 50)

    # 프로토콜 등록
    register_protocol()

    # 서버 시작
    start_server()
    if wait_for_server():
        print(f"[Server] 준비 완료 (http://localhost:{SERVER_PORT})")
    else:
        print("[Server] 시작 실패!")

    # 딥링크 처리
    if deep_url:
        print(f"[DeepLink] {deep_url}")

    # 트레이 실행 (메인 스레드 블로킹)
    icon = create_tray()
    icon.run()


if __name__ == '__main__':
    main()
