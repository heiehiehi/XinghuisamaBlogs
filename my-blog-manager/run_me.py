"""Prepare the source console and keep a readable log of startup failures."""
import importlib.util
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import traceback

ROOT = Path(__file__).resolve().parent
PACKAGES = {
    "webview": "pywebview", "fastapi": "fastapi", "uvicorn": "uvicorn",
    "multipart": "python-multipart", "requests": "requests", "yaml": "PyYAML",
    "markdown": "markdown", "markdownify": "markdownify", "httpx": "httpx",
}


def main(log):
    def report(message):
        print(message, flush=True)
        print(message, file=log, flush=True)

    def run(args):
        env = os.environ.copy()
        env.update(PYTHONIOENCODING="utf-8", PYTHONUNBUFFERED="1")
        shell = os.name == "nt" and Path(args[0]).suffix.lower() in {".cmd", ".bat"}
        with subprocess.Popen(
            args, cwd=ROOT, env=env, shell=shell, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, encoding="utf-8", errors="replace",
        ) as child:
            for line in child.stdout:
                report(line.rstrip("\r\n"))
            code = child.wait()
            if code:
                raise RuntimeError(f"{Path(args[0]).name} exited with code {code}")

    report(f"Python {sys.version.split()[0]}: {sys.executable}")
    if sys.version_info < (3, 10):
        raise RuntimeError("Python 3.10 or newer is required.")
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js 20.9 or newer is required. Add it to PATH.")
    version = subprocess.check_output([node, "--version"], text=True).strip()
    match = re.fullmatch(r"v(\d+)\.(\d+)\.(\d+).*", version)
    if not match or tuple(map(int, match.groups())) < (20, 9, 0):
        raise RuntimeError(f"Node.js 20.9 or newer is required; found {version}.")
    report(f"Node.js {version}: {node}")

    if not (ROOT / "node_modules/next/dist/bin/next").is_file():
        npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
        if not npm:
            raise RuntimeError("npm is missing. Reinstall Node.js with npm.")
        report("Installing console frontend dependencies...")
        run([npm, "install"])
        if not (ROOT / "node_modules/next/dist/bin/next").is_file():
            raise RuntimeError("Next.js is still missing after npm install.")

    missing = [pkg for module, pkg in PACKAGES.items() if importlib.util.find_spec(module) is None]
    if missing:
        report("Installing Python dependencies: " + ", ".join(missing))
        run([sys.executable, "-m", "pip", "install", *missing])

    report("Starting the console...")
    # Keep this process attached to Start.bat so a child crash cannot look like success.
    run([sys.executable, "-u", str(ROOT / "launcher.py")])


if __name__ == "__main__":
    log_path = ROOT / "startup.log"
    try:
        with log_path.open("w", encoding="utf-8", buffering=1) as log:
            try:
                main(log)
            except Exception:
                traceback.print_exc(file=log)
                raise
    except Exception as error:
        print(f"Startup failed: {error}", file=sys.stderr)
        print(f"Startup log (if writable): {log_path}", file=sys.stderr)
        raise SystemExit(1)
