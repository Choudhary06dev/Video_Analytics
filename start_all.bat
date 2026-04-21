@echo off
set PROJECT_ROOT=%~dp0
echo Starting Matrix AI Analytics System...
echo Project Root: %PROJECT_ROOT%

:: Start the Main Backend (Port 8000)
echo Lauching Main Backend...
start "Matrix: Backend" cmd /k "cd /d %PROJECT_ROOT%backend && venv\Scripts\activate && python main.py"

:: Start the AI Microservice (Port 8001)
echo Lauching AI Microservice...
start "Matrix: AI Service" cmd /k "cd /d %PROJECT_ROOT%backend && venv\Scripts\activate && cd /d %PROJECT_ROOT%ai-services && python main.py"

:: Start the Frontend (Port 3000)
echo Lauching Frontend...
start "Matrix: Frontend" cmd /k "cd /d %PROJECT_ROOT%frontend && npm start"

echo.
echo All services triggered.
echo ------------------------------------------
echo Backend:    http://127.0.0.1:8000
echo AI Service: http://127.0.0.1:8001
echo Frontend:   http://localhost:3000
echo ------------------------------------------
pause
