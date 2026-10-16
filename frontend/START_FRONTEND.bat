@echo off
setlocal
cd /d "%~dp0"
if errorlevel 1 goto failed
echo Starting V9 frontend at http://127.0.0.1:5173
 echo If port 5173 is occupied, stop the old Vite terminal first using Ctrl+C.
echo.
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
pause
exit /b %ERRORLEVEL%
:failed
echo [ERROR] Frontend folder not found.
pause
exit /b 1
