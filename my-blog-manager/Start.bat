@echo off
chcp 65001 >nul 2>&1  :: 解决中文乱码问题
cd /d "%~dp0"


echo [调试] 脚本所在目录：%~dp0
echo [调试] 开始检测Python环境...

:: 1. 优先尝试 py -3.10（兼容多Python版本）
py -3.10 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [状态] 正在调用 Python 3.10 环境...
    py -3.10 run_me.py
    if %errorlevel% neq 0 (
        echo ❌ 错误：Python 3.10 执行 run_me.py 失败！
        pause
        exit /b 1
    )
    goto end
)

:: 2. 尝试直接调用 python（检测是否是3.10+）
python --version >nul 2>&1
if %errorlevel% equ 0 (
    :: 额外检测Python版本是否≥3.10
    for /f "tokens=2 delims=." %%i in ('python --version 2^>^&1') do set "py_major=%%i"
    for /f "tokens=3 delims=. " %%j in ('python --version 2^>^&1') do set "py_minor=%%j"
    if %py_major% equ 3 if %py_minor% geq 10 (
        echo [状态] 正在调用默认 Python 3.10+ 环境...
        python run_me.py
        if %errorlevel% neq 0 (
            echo ❌ 错误：默认Python执行 run_me.py 失败！
            pause
            exit /b 1
        )
        goto end
    ) else (
        echo ❌ 错误：默认Python版本不是3.10！当前版本：
        python --version
        pause
        exit /b 1
    )
)

:: 3. 兜底：未找到Python环境
echo ❌ 错误：未找到 Python 3.10 环境，请确保已安装并添加到系统PATH！
echo 🔍 排查步骤：
echo    1. 确认安装Python 3.10（官网：https://www.python.org/downloads/release/python-3100/）
echo    2. 安装时勾选 "Add Python 3.10 to PATH"
echo    3. 重启命令行/电脑后重试
pause

:end
echo ✅ 程序执行完成
exit /b 0