@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

echo [信息] 脚本所在目录：%~dp0
echo [信息] 正在检测 Python 环境...

set "PYTHON_CMD="

rem 优先使用 Windows Python Launcher 指定 Python 3.10+
py -3.10 --version >nul 2>nul
if not errorlevel 1 set "PYTHON_CMD=py -3.10"

rem 如果没有 py -3.10，则检查默认 python 是否可用且版本满足 3.10+
if not defined PYTHON_CMD (
    python -c "import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>nul
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD (
    echo [错误] 未找到可用的 Python 3.10 或以上版本。
    echo [排查] 请安装 Python 3.10+，并在安装时勾选 Add Python to PATH。
    echo [排查] 如果已安装多个 Python 版本，可尝试安装/修复 Python Launcher 后重试。
    pause
    exit /b 1
)

echo [状态] 使用命令：%PYTHON_CMD%
%PYTHON_CMD% run_me.py
set "EXIT_CODE=%errorlevel%"

if not "%EXIT_CODE%"=="0" (
    echo [错误] run_me.py 执行失败，退出码：%EXIT_CODE%
    echo [提示] 请保留当前窗口内容，并复制上方错误信息到 GitHub issue。
    pause
    exit /b %EXIT_CODE%
)

echo [完成] 程序执行完成。
pause
exit /b 0
