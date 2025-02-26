@echo off
echo ========================================
echo   Secure Messenger - Startup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH
    exit /b 1
)

REM Check if Node.js is installed
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js/npm is not installed or not in PATH
    exit /b 1
)

REM Create and activate virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to create virtual environment
        exit /b 1
    )
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to activate virtual environment
    exit /b 1
)

REM Install backend dependencies
echo Installing backend dependencies...
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install backend dependencies
    exit /b 1
)

REM Apply database migrations
echo Applying database migrations...
cd backend
python manage.py migrate
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to apply migrations
    exit /b 1
)
cd ..

REM Start Django backend server in a new window
echo Starting Django backend server...
start "Django Backend Server" cmd /c "cd backend && python manage.py runserver"

echo Backend server running at http://localhost:8000/

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to install frontend dependencies
    exit /b 1
)

REM Start React frontend server in a new window
echo Starting React frontend server...
start "React Frontend Server" cmd /c "npm start"

echo Frontend server running at http://localhost:3000/
echo.
echo ========================================
echo   Servers are now running!
echo   - Backend: http://localhost:8000/
echo   - Frontend: http://localhost:3000/
echo   - Admin: http://localhost:8000/admin/
echo ========================================
echo.
echo Close the server windows to stop the servers
echo Press any key to exit this window...
pause > nul 