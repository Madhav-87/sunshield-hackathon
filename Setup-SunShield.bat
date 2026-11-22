@echo off
setlocal
cd /d "%~dp0"
call npm.cmd run setup
set "SUNSHIELD_EXIT=%ERRORLEVEL%"
if not "%SUNSHIELD_EXIT%"=="0" pause
exit /b %SUNSHIELD_EXIT%
