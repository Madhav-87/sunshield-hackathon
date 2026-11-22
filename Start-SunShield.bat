@echo off
setlocal
cd /d "%~dp0"
echo SunShield local development - press Ctrl+C to stop.
call npm.cmd run dev
set "SUNSHIELD_EXIT=%ERRORLEVEL%"
if not "%SUNSHIELD_EXIT%"=="0" pause
exit /b %SUNSHIELD_EXIT%
