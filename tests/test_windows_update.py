import importlib.util
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("xh_update", ROOT / "update.py")
update = importlib.util.module_from_spec(spec)
spec.loader.exec_module(update)


def git(path, *args):
    result = subprocess.run(
        ["git", "-C", str(path), *args], stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT, text=True,
    )
    if result.returncode:
        raise AssertionError(result.stdout)
    return result.stdout.strip()


def put(root, name, content):
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def commit(path):
    git(path, "add", "--all")
    git(path, "-c", "user.name=Test", "-c", "user.email=test@example.invalid",
        "commit", "-qm", "fixture")
    return git(path, "rev-parse", "HEAD")


class UpgradeTests(unittest.TestCase):
    def test_partial_legacy_update_repairs_modules_without_overwriting_personal_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            source, site = (Path(tmp) / name for name in ("upstream", "博客 old"))
            for repo in (source, site):
                repo.mkdir()
                git(repo, "init", "-q")
            home = "XHBlogs/app/page.tsx"
            launcher = "my-blog-manager/launcher.py"
            put(site, home, b"old home\n")
            put(site, launcher, b"old launcher\n")
            old_head = commit(site)
            for name in update.REQUIRED_BRIEFING:
                put(source, name, (ROOT / name).read_bytes())
            put(source, home, b"upstream home\n")
            put(source, launcher, b"legacy launcher\n")
            legacy = commit(source)
            git(site, "fetch", str(source), legacy)
            put(site, launcher, b"legacy launcher\r\n")
            put(site, home, b"upstream home\r\n")
            git(site, "add", "--", home, launcher)
            put(source, launcher, b"fixed launcher\n")
            personal = {
                "XHBlogs/siteConfig.ts": b"local configuration",
                "XHBlogs/data/dailyBriefing.json": b"local issue",
                "XHBlogs/posts/post.md": b"local article",
                "XHBlogs/data/friends.ts": b"local site friend links",
                "my-blog-manager/data/friends.ts": b"local console friend links",
                "my-blog-manager/posts/post.md": b"local console article",
                "XHBlogs/public/images/my-cover.png": b"local image",
                "my-blog-manager/manager_data/briefing/auth.json": b"local credentials",
            }
            for name, value in personal.items():
                put(source, name, b"upstream default")
                put(site, name, value)
            release = commit(source)
            index_before = git(site, "ls-files", "--stage")
            with patch.object(update, "LEGACY_RELEASE", legacy):
                backup = update.apply_update(site, source, release)
                self.assertEqual((backup / launcher).read_bytes(), b"legacy launcher\r\n")
                for name in update.REQUIRED_BRIEFING:
                    self.assertEqual((site / name).read_bytes(), update.git(source, "show", release + ":" + name))
                for name, value in personal.items():
                    self.assertEqual((site / name).read_bytes(), value)
                self.assertEqual(git(site, "rev-parse", "HEAD"), old_head)
                self.assertEqual(git(site, "ls-files", "--stage"), index_before)
                self.assertIsNone(update.apply_update(site, source, release))
                put(site, launcher, b"my own edit\n")
                put(source, launcher, b"another upstream fix\n")
                with self.assertRaisesRegex(RuntimeError, "Local program edits"):
                    update.apply_update(site, source, commit(source))
                self.assertEqual((site / launcher).read_bytes(), b"my own edit\n")


@unittest.skipUnless(os.name == "nt", "Windows batch startup")
class BatchTests(unittest.TestCase):
    def test_batch_propagates_python_failure_from_a_path_with_spaces(self):
        with tempfile.TemporaryDirectory(prefix="xh test ") as tmp:
            env = dict(os.environ, PATH=str(Path(sys.executable).parent) + ";" + os.environ["PATH"])
            for batch, target in (("my-blog-manager/Start.bat", "run_me.py"),
                                  ("update.bat", "update.py")):
                with self.subTest(batch=batch):
                    dest = Path(tmp) / Path(batch).name
                    shutil.copyfile(ROOT / batch, dest)
                    put(Path(tmp), target, b"print('expected failure'); raise SystemExit(23)\n")
                    result = subprocess.run(
                        ["cmd.exe", "/d", "/c", "call", str(dest), "--no-pause"],
                        cwd=ROOT, env=env, capture_output=True, text=True, timeout=20,
                    )
                    self.assertEqual(result.returncode, 23, result.stdout + result.stderr)
                    self.assertIn("expected failure", result.stdout)
                    self.assertIn("exit code 23", result.stdout)

    def test_missing_node_is_written_to_the_startup_log(self):
        with tempfile.TemporaryDirectory(prefix="xh log ") as tmp:
            root = Path(tmp)
            script = root / "run_me.py"
            shutil.copyfile(ROOT / "my-blog-manager/run_me.py", script)
            result = subprocess.run(
                [sys.executable, str(script)], cwd=root, env=dict(os.environ, PATH=tmp),
                capture_output=True, text=True, timeout=20,
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("Node.js 20.9 or newer is required", result.stderr)
            self.assertIn("Node.js 20.9 or newer is required",
                          (root / "startup.log").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
