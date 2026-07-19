import os
import shutil
import subprocess
import sys
from pathlib import Path

# 强制切换到脚本所在目录
ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)

FILES_TO_UPDATE = [
    "update.py", "update.bat",
    "LICENSE", "README.md", "scripts/checkConfig.mjs", "README_en.md",

    # 前端文件
    "XHBlogs/app/about/page.tsx", "XHBlogs/app/api", "XHBlogs/app/chatter",
    "XHBlogs/app/friends", "XHBlogs/app/moments", "XHBlogs/app/music",
    "XHBlogs/app/photowall", "XHBlogs/app/posts", "XHBlogs/app/projects",
    "XHBlogs/app/timeline", "XHBlogs/app/globals.css", "XHBlogs/app/layout.tsx",
    "XHBlogs/app/page.tsx", "XHBlogs/components", "XHBlogs/public", "XHBlogs/app/tree",
    "XHBlogs/.gitignore", "XHBlogs/package.json", "XHBlogs/package-lock.json",
    "XHBlogs/postcss.config.mjs", "XHBlogs/tsconfig.json",

    # 后台文件
    "my-blog-manager/app/about/page.tsx", "my-blog-manager/app/admin",
    "my-blog-manager/app/api", "my-blog-manager/app/chatter",
    "my-blog-manager/app/drafts", "my-blog-manager/app/editor",
    "my-blog-manager/app/friends", "my-blog-manager/app/moments",
    "my-blog-manager/app/music", "my-blog-manager/app/photowall",
    "my-blog-manager/app/posts", "my-blog-manager/app/projects",
    "my-blog-manager/app/settings", "my-blog-manager/app/timeline",
    "my-blog-manager/app/globals.css", "my-blog-manager/app/layout.tsx",
    "my-blog-manager/app/page.tsx", "my-blog-manager/cms_core",
    "my-blog-manager/components", "my-blog-manager/context", "my-blog-manager/app/tree",
    "my-blog-manager/.gitignore", "my-blog-manager/launcher.py", "my-blog-manager/public",
    "my-blog-manager/package.json", "my-blog-manager/package-lock.json",
    "my-blog-manager/postcss.config.mjs", "my-blog-manager/run_me.py",
    "my-blog-manager/Start.bat", "my-blog-manager/tsconfig.json",
]


def print_step(msg):
    print(f"\n{'=' * 55}\n🐱 {msg}\n{'=' * 55}")


def run_cmd(args, cwd=None, required=True):
    """Run a command without shell quoting issues and print clear failures."""
    display = " ".join(str(x) for x in args)
    try:
        subprocess.run(args, check=True, cwd=cwd)
        return True
    except FileNotFoundError:
        print(f"❌ 未找到命令: {args[0]}")
    except subprocess.CalledProcessError as exc:
        print(f"❌ 命令执行失败({exc.returncode}): {display}")
    if required:
        sys.exit(1)
    return False


def ensure_remote():
    if not (ROOT / ".git").exists():
        print("🪄 初始化 Git 环境...")
        run_cmd(["git", "init"])
        run_cmd(["git", "remote", "add", "origin", "https://github.com/heiehiehi/XinghuisamaBlogs.git"])
        return

    remotes = subprocess.run(
        ["git", "remote"], capture_output=True, text=True, check=False
    ).stdout.split()
    if "origin" not in remotes:
        run_cmd(["git", "remote", "add", "origin", "https://github.com/heiehiehi/XinghuisamaBlogs.git"])


def checkout_updates(paths, batch_size=12):
    failed = []
    for start in range(0, len(paths), batch_size):
        batch = paths[start:start + batch_size]
        ok = run_cmd(["git", "checkout", "origin/main", "--", *batch], required=False)
        if not ok:
            # Retry one by one so users can see exactly what failed.
            for item in batch:
                if not run_cmd(["git", "checkout", "origin/main", "--", item], required=False):
                    failed.append(item)
    if failed:
        print("\n⚠️ 以下路径未能从 origin/main 更新，可能是旧版本没有该文件或目录：")
        for item in failed:
            print(f"  - {item}")
        print("其余文件已继续更新。若功能缺失，请重新下载完整项目包。")


def npm_install_if_exists(folder):
    if not (ROOT / folder).exists():
        print(f"⚠️ 未找到 {folder}，跳过依赖安装。")
        return
    package_json = ROOT / folder / "package.json"
    if not package_json.exists():
        print(f"⚠️ {folder} 缺少 package.json，跳过 npm install。")
        return
    run_cmd(["npm", "install"], cwd=folder)


def main():
    print_step("XingHuiSama升级程序 (Python 稳定版)")

    if not shutil.which("git"):
        print("❌ 致命错误：未找到 Git！请前往 git-scm.com 下载安装。")
        sys.exit(1)
    if not shutil.which("node") or not shutil.which("npm"):
        print("❌ 致命错误：未找到 Node.js/npm！请先安装 Node.js。")
        sys.exit(1)

    ensure_remote()

    print_step("[1/4] 连接云端获取最新代码...")
    run_cmd(["git", "fetch", "origin", "main"])

    print_step("[2/4] 执行核心文件精准替换...")
    checkout_updates(FILES_TO_UPDATE)

    print_step("[3/4] 同步依赖包...")
    npm_install_if_exists("XHBlogs")
    npm_install_if_exists("my-blog-manager")

    print_step("[4/4] 智能修补 siteConfig 配置文件...")
    check_config = ROOT / "scripts" / "checkConfig.mjs"
    if check_config.exists():
        run_cmd(["node", str(check_config)])
    else:
        print("⚠️ 未找到 scripts/checkConfig.mjs，跳过配置修补。")

    print_step("✨ 升级完毕！如果有遗漏，请再次启动本程序！")


if __name__ == "__main__":
    main()
