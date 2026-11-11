"""
Shihab AI - Local PC Windows Agent Service
============================================
A lightweight, zero-dependency Python service that enables Shihab AI to securely
interact with your Windows PC.

Features:
- Bearer token authentication (secure authorization)
- Windows application launching (Chrome, Notepad, VS Code, Explorer, etc.)
- Safe file system browsing and inspection
- System commands (Lock workstation, volume adjustment, battery/telemetry query)
- Standard HTTP REST API with CORS enabled for desktop/browser integration

Usage:
    python shihab_agent.py [--port PORT] [--token TOKEN]

Default:
    Port: 5678
    Token: shihab-secret-key-2026
"""

import sys
import os
import json
import subprocess
import argparse
import platform
import socket
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

# Windows-specific imports when on Windows
IS_WINDOWS = platform.system().lower() == "windows"
if IS_WINDOWS:
    import ctypes

DEFAULT_PORT = 5678
DEFAULT_TOKEN = "shihab-secret-key-2026"
CONFIG_TOKEN = os.environ.get("SHIHAB_AGENT_TOKEN", DEFAULT_TOKEN)

# Common Windows applications lookup
KNOWN_APPS = {
    "notepad": "notepad.exe",
    "calculator": "calc.exe",
    "calc": "calc.exe",
    "explorer": "explorer.exe",
    "file explorer": "explorer.exe",
    "chrome": "chrome.exe",
    "google chrome": "chrome.exe",
    "edge": "msedge.exe",
    "microsoft edge": "msedge.exe",
    "cmd": "cmd.exe",
    "terminal": "wt.exe",
    "powershell": "powershell.exe",
    "vscode": "code",
    "code": "code",
    "taskmgr": "taskmgr.exe",
    "task manager": "taskmgr.exe",
    "paint": "mspaint.exe",
    "word": "winword.exe",
    "excel": "excel.exe",
    "settings": "start ms-settings:",
}

class ShihabAgentHandler(BaseHTTPRequestHandler):
    server_version = "ShihabAIAgent/1.2"

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Agent-Token")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def _verify_auth(self) -> bool:
        auth_header = self.headers.get("Authorization", "")
        token_header = self.headers.get("X-Agent-Token", "")
        
        expected_bearer = f"Bearer {CONFIG_TOKEN}"
        if auth_header == expected_bearer or auth_header == CONFIG_TOKEN:
            return True
        if token_header == CONFIG_TOKEN:
            return True
        return False

    def _respond_json(self, status_code: int, data: dict):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_GET(self):
        if self.path == "/" or self.path == "/api/status" or self.path == "/health":
            # Return live telemetry
            info = {
                "service": "Shihab AI Windows Agent",
                "version": "1.2.0",
                "status": "online",
                "hostname": socket.gethostname(),
                "platform": platform.platform(),
                "system": platform.system(),
                "release": platform.release(),
                "python_version": platform.python_version(),
                "cpu_count": os.cpu_count(),
                "timestamp": datetime.datetime.now().isoformat(),
                "user": os.environ.get("USERNAME") or os.environ.get("USER", "User"),
            }
            if IS_WINDOWS:
                try:
                    class SYSTEM_POWER_STATUS(ctypes.Structure):
                        _fields_ = [
                            ('ACLineStatus', ctypes.c_byte),
                            ('BatteryFlag', ctypes.c_byte),
                            ('BatteryLifePercent', ctypes.c_byte),
                            ('SystemStatusFlag', ctypes.c_byte),
                            ('BatteryLifeTime', ctypes.c_ulong),
                            ('BatteryFullLifeTime', ctypes.c_ulong),
                        ]
                    status = SYSTEM_POWER_STATUS()
                    if ctypes.windll.kernel32.GetSystemPowerStatus(ctypes.byref(status)):
                        info["battery"] = {
                            "ac_online": status.ACLineStatus == 1,
                            "percentage": status.BatteryLifePercent if status.BatteryLifePercent <= 100 else None,
                        }
                except Exception:
                    pass
            self._respond_json(200, {"success": True, "data": info})
            return

        if not self._verify_auth():
            self._respond_json(401, {"success": False, "error": "Unauthorized: Invalid or missing token"})
            return

        if self.path == "/api/apps":
            self._respond_json(200, {
                "success": True,
                "apps": list(KNOWN_APPS.keys())
            })
            return

        self._respond_json(404, {"success": False, "error": "Not Found"})

    def do_POST(self):
        if not self._verify_auth():
            self._respond_json(401, {"success": False, "error": "Unauthorized: Invalid or missing token"})
            return

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)
        try:
            body = json.loads(post_data.decode("utf-8")) if post_data else {}
        except Exception as e:
            self._respond_json(400, {"success": False, "error": f"Invalid JSON payload: {str(e)}"})
            return

        if self.path == "/api/launch":
            app_name = body.get("app", "").strip().lower()
            args = body.get("args", "")
            
            if not app_name:
                self._respond_json(400, {"success": False, "error": "Parameter 'app' is required"})
                return

            command = KNOWN_APPS.get(app_name, app_name)
            
            try:
                if IS_WINDOWS and command.startswith("start "):
                    # Protocol / URI scheme launch (e.g. start ms-settings:)
                    proc = subprocess.Popen(command, shell=True)
                    pid = proc.pid
                elif IS_WINDOWS and (command.endswith(".exe") or command in ["calc", "code", "notepad", "explorer"]):
                    full_cmd = [command]
                    if args:
                        full_cmd.append(args)
                    proc = subprocess.Popen(full_cmd, shell=True)
                    pid = proc.pid
                else:
                    # Generic invocation
                    full_cmd = [command] if not args else [command, args]
                    proc = subprocess.Popen(full_cmd, shell=True)
                    pid = proc.pid

                self._respond_json(200, {
                    "success": True,
                    "action": "launch_app",
                    "app": app_name,
                    "command": command,
                    "pid": pid,
                    "timestamp": datetime.datetime.now().isoformat(),
                    "message": f"Successfully launched {app_name} (PID: {pid})"
                })
            except Exception as ex:
                self._respond_json(500, {
                    "success": False,
                    "action": "launch_app",
                    "app": app_name,
                    "error": str(ex),
                    "message": f"Failed to launch {app_name}: {str(ex)}"
                })
            return

        if self.path == "/api/files":
            operation = body.get("operation", "list")
            raw_path = body.get("path", "").strip() or os.path.expanduser("~")
            
            # Expand environment variables like %USERPROFILE% or ~
            expanded_path = os.path.expandvars(os.path.expanduser(raw_path))

            if operation == "list":
                if not os.path.exists(expanded_path):
                    self._respond_json(404, {"success": False, "error": f"Path does not exist: {expanded_path}"})
                    return

                try:
                    entries = []
                    for item in os.listdir(expanded_path):
                        item_path = os.path.join(expanded_path, item)
                        is_dir = os.path.isdir(item_path)
                        try:
                            stat = os.stat(item_path)
                            size = stat.st_size if not is_dir else 0
                            modified = datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
                        except Exception:
                            size = 0
                            modified = None
                        entries.append({
                            "name": item,
                            "path": item_path,
                            "isDirectory": is_dir,
                            "size": size,
                            "modified": modified
                        })
                    self._respond_json(200, {
                        "success": True,
                        "path": expanded_path,
                        "count": len(entries),
                        "items": entries[:100]  # limit to top 100 entries
                    })
                except Exception as ex:
                    self._respond_json(500, {"success": False, "error": str(ex)})
                return

            elif operation == "read":
                if not os.path.exists(expanded_path) or os.path.isdir(expanded_path):
                    self._respond_json(404, {"success": False, "error": f"File does not exist: {expanded_path}"})
                    return
                try:
                    # Safe read up to 50KB
                    with open(expanded_path, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read(51200)
                    self._respond_json(200, {
                        "success": True,
                        "path": expanded_path,
                        "content": content,
                        "size": len(content)
                    })
                except Exception as ex:
                    self._respond_json(500, {"success": False, "error": str(ex)})
                return

            elif operation == "open_explorer":
                try:
                    if IS_WINDOWS:
                        os.startfile(expanded_path)
                    else:
                        subprocess.Popen(["xdg-open", expanded_path])
                    self._respond_json(200, {
                        "success": True,
                        "message": f"Opened {expanded_path} in Explorer"
                    })
                except Exception as ex:
                    self._respond_json(500, {"success": False, "error": str(ex)})
                return

            self._respond_json(400, {"success": False, "error": f"Unsupported file operation: {operation}"})
            return

        if self.path == "/api/system":
            action = body.get("action", "")
            if action == "lock":
                if IS_WINDOWS:
                    try:
                        ctypes.windll.user32.LockWorkStation()
                        self._respond_json(200, {"success": True, "message": "Workstation locked successfully."})
                    except Exception as ex:
                        self._respond_json(500, {"success": False, "error": str(ex)})
                else:
                    self._respond_json(200, {"success": True, "message": "Simulated lock (non-Windows host)"})
                return

            elif action == "volume_mute" or action == "volume_up" or action == "volume_down":
                if IS_WINDOWS:
                    try:
                        VK_VOLUME_MUTE = 0xAD
                        VK_VOLUME_DOWN = 0xAE
                        VK_VOLUME_UP = 0xAF
                        key = VK_VOLUME_MUTE if action == "volume_mute" else (VK_VOLUME_UP if action == "volume_up" else VK_VOLUME_DOWN)
                        ctypes.windll.user32.keybd_event(key, 0, 0, 0)
                        ctypes.windll.user32.keybd_event(key, 0, 2, 0)
                        self._respond_json(200, {"success": True, "message": f"Executed system action: {action}"})
                    except Exception as ex:
                        self._respond_json(500, {"success": False, "error": str(ex)})
                else:
                    self._respond_json(200, {"success": True, "message": f"Volume action {action} triggered"})
                return

            self._respond_json(400, {"success": False, "error": f"Unknown system action: {action}"})
            return

        self._respond_json(404, {"success": False, "error": "Endpoint not found"})

def run_server(port=DEFAULT_PORT):
    server_address = ("0.0.0.0", port)
    httpd = HTTPServer(server_address, ShihabAgentHandler)
    print("=" * 60)
    print("   SHIHAB AI - LOCAL PC WINDOWS AGENT SERVICE")
    print("=" * 60)
    print(f" -> Status: RUNNING on http://localhost:{port}")
    print(f" -> System: {platform.system()} {platform.release()} ({socket.gethostname()})")
    print(f" -> Auth Token: {CONFIG_TOKEN}")
    print(" -> Press Ctrl+C to terminate.")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShihab AI Agent shutting down safely.")
        httpd.server_close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Shihab AI Local Windows Agent")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT, help="Port to listen on (default 5678)")
    parser.add_argument("--token", type=str, default=DEFAULT_TOKEN, help="Secret authentication token")
    args = parser.parse_args()
    
    CONFIG_TOKEN = args.token
    run_server(args.port)
