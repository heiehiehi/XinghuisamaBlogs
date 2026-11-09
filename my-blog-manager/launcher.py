import sys
import os

# 🌟 路径定位逻辑
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
    EXE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXE_DIR = BASE_DIR

import webview
import threading
import uvicorn
import time
import socket
import json
import subprocess
import traceback
from pathlib import Path
os.environ.setdefault("XHS_MANAGER_ROOT", EXE_DIR)
from cms_core.main import app

frontend_process = None
WINDOW_CONFIG_FILE = os.path.join(EXE_DIR, 'window_config.json')

def load_window_size():
    try:
        if os.path.exists(WINDOW_CONFIG_FILE):
            with open(WINDOW_CONFIG_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    return {"width": 1440, "height": 900}

def save_window_size(width, height):
    try:
        with open(WINDOW_CONFIG_FILE, 'w') as f:
            json.dump({"width": int(width), "height": int(height)}, f)
    except:
        pass

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]

def write_port_config(port, standalone_dir=None):
    # 写入解压目录供前端读取
    public_dir = os.path.join(BASE_DIR, 'public')
    os.makedirs(public_dir, exist_ok=True)
    with open(os.path.join(public_dir, 'backend_config.json'), 'w', encoding='utf-8') as f:
        json.dump({"api_port": port}, f)

    if standalone_dir:
        standalone_public = os.path.join(standalone_dir, 'public')
        os.makedirs(standalone_public, exist_ok=True)
        with open(os.path.join(standalone_public, 'backend_config.json'), 'w', encoding='utf-8') as f:
            json.dump({"api_port": port}, f)

def wait_for_port(port, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if frontend_process and frontend_process.poll() is not None:
            raise RuntimeError(f"Frontend exited with code {frontend_process.returncode}.")
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=1):
                return True
        except (ConnectionRefusedError, socket.timeout, OSError):
            time.sleep(1)
    return False

class WindowAPI:
    def resize_window(self, width, height):
        save_window_size(width, height)
        webview.windows[0].resize(int(width), int(height))
        return True
    def minimize_window(self): webview.windows[0].minimize()
    def maximize_window(self): webview.windows[0].toggle_fullscreen()
    def close_window(self): webview.windows[0].destroy()

def run_api(port):
    # 🌟 强制后端在 EXE 所在的真实目录工作，确保能读取到旁边的 data/ 等数据
    os.chdir(EXE_DIR)
    print(f"🟢 [后端] 工作路径已锁定: {EXE_DIR}")
    try:
        uvicorn.run(app, host="127.0.0.1", port=port, log_level="info")
    except Exception as e:
        print("❌ [后端] 崩溃报错：")
        traceback.print_exc()

def stop_frontend():
    if frontend_process is None or frontend_process.poll() is not None:
        return
    if os.name == 'nt':
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(frontend_process.pid)],
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    if frontend_process.poll() is None:
        frontend_process.terminate()

def on_shown():
    win_size = load_window_size()
    webview.windows[0].resize(int(win_size["width"]), int(win_size["height"]))

def main():
    global frontend_process
    frontend_port = get_free_port()
    backend_port = get_free_port()
    while backend_port == frontend_port:
        backend_port = get_free_port()

    env_vars = os.environ.copy()
    env_vars["XHS_MANAGER_ROOT"] = EXE_DIR
    env_vars["XHS_BRIEFING_API_PORT"] = str(backend_port)
    env_vars["PORT"] = str(frontend_port)

    standalone_dir = os.path.join(BASE_DIR, '.next', 'standalone')
    server_js = os.path.join(standalone_dir, 'server.js')

    # A source checkout must not load a standalone build left by an older version.
    use_standalone = os.path.exists(server_js) and (
        getattr(sys, 'frozen', False) or not (Path(BASE_DIR) / 'package.json').is_file()
    )
    write_port_config(backend_port, standalone_dir if use_standalone else None)
    if use_standalone:
        print("🚀 [生产模式] 使用 127.0.0.1 强制同步...")
        env_vars["HOSTNAME"] = "127.0.0.1"
        frontend_process = subprocess.Popen(["node", "server.js"], cwd=standalone_dir, env=env_vars)
    else:
        print("🛠️ [开发模式] 启动本地控制台源码...")
        frontend_process = subprocess.Popen(
            ["node", str(Path(BASE_DIR) / "node_modules/next/dist/bin/next"),
             "dev", "--hostname", "127.0.0.1", "--port", str(frontend_port)],
            cwd=BASE_DIR, env=env_vars,
        )
    window_url = f"http://127.0.0.1:{frontend_port}"

    threading.Thread(target=run_api, args=(backend_port,), daemon=True).start()

    if not wait_for_port(backend_port):
        raise RuntimeError("The local Python backend did not start. Check the errors above.")
    if not wait_for_port(frontend_port):
        raise RuntimeError("The local Next.js frontend did not start. Check the errors above.")

    time.sleep(1.5)

    api = WindowAPI()
    window = webview.create_window(
        title='星辉云端·控制台',
        url=window_url,
        width=1440, height=900, min_size=(1024, 768),
        background_color='#0f172a', resizable=True, frameless=True, easy_drag=False, js_api=api
    )

    window.events.shown += on_shown
    webview.start(debug=False)


if __name__ == "__main__":
    try:
        main()
    finally:
        stop_frontend()
