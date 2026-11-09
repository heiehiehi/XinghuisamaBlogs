@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "status=1"
pushd "%~dp0" || goto folder_error
set "PYTHONUTF8=1"
if not exist "run_me.py" goto missing_script

rem Test the actual interpreter; do not parse localized version output.
set "version_check=import sys; sys.exit(0 if sys.version_info >= (3,10) else 1)"
where.exe py.exe >nul 2>&1
if errorlevel 1 goto find_python
py -3.10 -c "%version_check%" >nul 2>&1
if not errorlevel 1 goto run_py310
py -3 -c "%version_check%" >nul 2>&1
if not errorlevel 1 goto run_py3

:find_python
for /f "delims=" %%P in ('where.exe python.exe python3.exe 2^>nul') do (
    if /i not "%%~dpP"=="%LOCALAPPDATA%\Microsoft\WindowsApps\" (
        "%%P" -c "%version_check%" >nul 2>&1
        if not errorlevel 1 (
            set "python_path=%%P"
            goto run_path
        )
    )
)
echo [ERROR] Python 3.10 or newer is required. Install it from python.org.
goto finish

:run_py310
py -3.10 -u "run_me.py"
goto save_status

:run_py3
py -3 -u "run_me.py"
goto save_status

:run_path
"%python_path%" -u "run_me.py"

:save_status
set "status=%errorlevel%"
if not "%status%"=="0" echo [ERROR] Console startup failed with exit code %status%.
goto finish

:missing_script
echo [ERROR] Missing run_me.py. Keep this script in the original project directory.

:finish
popd
if not "%~1"=="--no-pause" if not "%status%"=="0" pause
exit /b %status%

:folder_error
echo [ERROR] Could not open the project directory.
if not "%~1"=="--no-pause" pause
exit /b 1
