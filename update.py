"""Apply official program files while preserving personal content and Git edits."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import stat
import subprocess
import sys
from tempfile import TemporaryDirectory
from datetime import datetime

ROOT = Path(__file__).resolve().parent
UPSTREAM = "https://github.com/heiehiehi/XinghuisamaBlogs.git"
# The old updater staged files from this release without updating HEAD.
LEGACY_RELEASE = "8633e983371acc3b627b88b911143ff0fd31ea23"
APPS = ("XHBlogs", "my-blog-manager")
INITIAL_DATA = {
    "briefingConfig.json", "dailyBriefing.json", "dailyBriefingArchive.json",
    "dailyBriefingCovers.json", "dailyBriefing-history.json", "dailyBriefing.ts",
    "terraReadingNotes.ts",
}
REQUIRED_BRIEFING = (
    "XHBlogs/lib/briefingWindow.ts",
    "XHBlogs/data/dailyBriefing.ts",
    "my-blog-manager/app/briefing/BriefingGuide.tsx",
    "my-blog-manager/app/api/briefing/[...path]/route.ts",
    "my-blog-manager/components/settings/briefingApi.ts",
)


def managed_path(name):
    parts = PurePosixPath(name).parts
    if len(parts) == 1:
        return name in {"update.py", "update.bat", "LICENSE", "README.md",
                        "README_en.md", "UpdateLog.md", ".gitignore"}
    if parts[0] == "scripts":
        return True
    if parts[0] not in APPS:
        return False
    if parts[-1] in {"siteConfig.ts", "deploy_config.json", "backend_config.json", "window_config.json"}:
        return False
    if parts[1] == "data":
        return parts[0] == "XHBlogs" and len(parts) == 3 and parts[-1] in INITIAL_DATA
    if parts[1] == "app" and PurePosixPath(name).suffix == ".md":
        return False
    return parts[1] in {"app", "components", "context", "lib", "cms_core", "public"} or (
        len(parts) == 2 and parts[1] in {
            "package.json", "package-lock.json", "postcss.config.mjs", "tsconfig.json",
            "tsconfig.briefing.json", "next.config.ts", "eslint.config.mjs",
            "launcher.py", "run_me.py", "Start.bat", ".gitignore",
        }
    )


def preserve_existing(name, exists):
    parts = PurePosixPath(name).parts
    return exists and len(parts) > 2 and (
        parts[1] == "data" and parts[-1] != "dailyBriefing.ts"
        or parts[1] == "public" and name != "my-blog-manager/public/briefing_agent.py"
    )


def git(repo, *args, quiet=False):
    return subprocess.check_output(["git", "-C", str(repo), *args],
                                   stderr=subprocess.DEVNULL if quiet else None)


def git_paths(data):
    return data.decode("utf-8").rstrip("\0").split("\0") if data else []


def same_bytes(name, local, upstream):
    if local == upstream:
        return True
    if name.startswith(("XHBlogs/public/", "my-blog-manager/public/")) and not name.endswith(".py"):
        return False
    # Git for Windows commonly checks tracked text out as CRLF.
    return local.replace(b"\r\n", b"\n") == upstream.replace(b"\r\n", b"\n")


def existing_changes(root):
    if not (root / ".git").exists():
        return set()
    if git(root, "rev-parse", "--is-inside-work-tree").strip() != b"true":
        raise RuntimeError("The project has Git metadata but is not a Git working directory.")
    head = subprocess.run(["git", "-C", str(root), "rev-parse", "--verify", "HEAD"],
                          capture_output=True)
    if head.returncode:
        # ZIP installations initialized by the legacy updater may have no commits.
        return set(git_paths(git(root, "diff", "--name-only", "-z")))
    return set(git_paths(git(root, "diff", "HEAD", "--name-only", "-z")))


def apply_update(root, source, revision):
    state_path = root / ".update-backups" / "last-applied.json"
    if not state_path.resolve().is_relative_to(root.resolve()):
        raise RuntimeError("The backup directory points outside the project.")
    state = json.loads(state_path.read_text(encoding="utf-8")) if state_path.exists() else {}
    if not isinstance(state, dict):
        raise ValueError("Invalid update state in .update-backups/last-applied.json.")
    paths = set(git_paths(git(source, "ls-tree", "-r", "--name-only", "-z", revision)))
    missing = set(REQUIRED_BRIEFING) - paths
    if missing:
        raise RuntimeError("The official update is incomplete: " + ", ".join(sorted(missing)))
    changed = existing_changes(root)
    has_legacy = (root / ".git").exists() and subprocess.run(
        ["git", "-C", str(root), "cat-file", "-e", f"{LEGACY_RELEASE}^{{commit}}"], capture_output=True
    ).returncode == 0
    pending = []
    conflicts = []
    for name in sorted(paths):
        if not managed_path(name):
            continue
        path = root / name
        if not path.resolve().is_relative_to(root.resolve()):
            raise RuntimeError("Refusing a path outside the project: " + name)
        old = path.read_bytes() if path.exists() else None
        if preserve_existing(name, old is not None):
            continue
        content = git(source, "show", revision + ":" + name)
        if old is not None and same_bytes(name, old, content):
            continue
        if os.name == "nt" and name.endswith(".bat"):
            content = content.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")
        if name in changed and name not in {"update.bat", "update.py"}:
            matches_state = old is not None and (
                hashlib.sha256(old).hexdigest() == state.get(name)
                or hashlib.sha256(old.replace(b"\r\n", b"\n")).hexdigest() == state.get(name)
            )
            matches_legacy = False
            if old is not None and has_legacy and not matches_state:
                try:
                    matches_legacy = same_bytes(name, old, git(root, "show", LEGACY_RELEASE + ":" + name, quiet=True))
                except subprocess.CalledProcessError:
                    pass
            if not (matches_state or matches_legacy):
                conflicts.append(name)
        pending.append((name, content, old is not None))
    if conflicts:
        raise RuntimeError("Local program edits were left unchanged. Save/commit them before updating: "
                           + ", ".join(conflicts))
    if not pending:
        return None

    backup = state_path.parent / datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    applied = []
    try:
        backup.mkdir(parents=True, exist_ok=False)
        for name, content, existed in pending:
            path = root / name
            if existed:
                copy = backup / name
                copy.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(path, copy)
                if not path.stat().st_mode & stat.S_IWRITE:
                    raise PermissionError(f"File is read-only: {path}")
            path.parent.mkdir(parents=True, exist_ok=True)
            applied.append((name, existed))
            path.write_bytes(content)
            state[name] = hashlib.sha256(content).hexdigest()
        temporary_state = backup / "last-applied.tmp"
        temporary_state.write_text(json.dumps(state, indent=2), encoding="utf-8")
        temporary_state.replace(state_path)
    except OSError:
        for name, existed in reversed(applied):
            path = root / name
            if existed:
                shutil.copy2(backup / name, path)
            else:
                path.unlink(missing_ok=True)
        raise
    return backup


def main():
    if sys.version_info < (3, 10):
        raise RuntimeError("Python 3.10 or newer is required.")
    if not all((ROOT / app / "package.json").is_file() for app in APPS):
        raise RuntimeError("Put update.bat and update.py next to XHBlogs and my-blog-manager.")
    node = shutil.which("node")
    npm = shutil.which("npm.cmd" if os.name == "nt" else "npm")
    if not shutil.which("git") or not node or not npm:
        raise RuntimeError("Please install Git, Node.js (>=20.9) and npm first.")
    version = subprocess.check_output([node, "--version"], text=True).strip()
    match = re.fullmatch(r"v(\d+)\.(\d+)\.(\d+).*", version)
    if not match or tuple(map(int, match.groups())) < (20, 9, 0):
        raise RuntimeError(f"Node.js 20.9 or newer is required; found {version}.")

    print("Fetching the official main branch...", flush=True)
    with TemporaryDirectory(prefix="xhblogs-update-") as source:
        git(source, "init", "--bare", "--quiet")
        git(source, "fetch", "--depth=1", "--no-tags", UPSTREAM, "refs/heads/main")
        revision = git(source, "rev-parse", "FETCH_HEAD").decode().strip()
        backup = apply_update(ROOT, source, revision)
    if backup:
        print("Program files updated. Backup:", backup, flush=True)
    else:
        print("Program files already match the release.", flush=True)

    for app in APPS:
        print(f"Installing dependencies in {app}...", flush=True)
        try:
            subprocess.run([npm, "install"], cwd=ROOT / app, shell=os.name == "nt", check=True)
        except (OSError, subprocess.CalledProcessError) as error:
            raise RuntimeError(f"{app} dependency installation failed. Source files have been "
                               "applied; fix the npm error above and run the updater again.") from error
        if not (ROOT / app / "node_modules/next/dist/bin/next").is_file():
            raise RuntimeError(f"{app} is still missing Next.js. Fix npm installation and retry.")
    print("Update complete. Start the console and review your settings before publishing.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError, subprocess.CalledProcessError) as error:
        print("Update stopped:", error, file=sys.stderr)
        raise SystemExit(1)
