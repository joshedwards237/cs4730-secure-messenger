#!/bin/bash

# Display banner
echo "========================================"
echo "  Secure Messenger - Startup Script"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

# Check if Node.js is installed
if ! command -v npm &> /dev/null; then
    echo "Error: Node.js/npm is not installed or not in PATH"
    exit 1
fi

# Function to handle errors
handle_error() {
    echo "Error: $1"
    exit 1
}

# Detect operating system and set virtual environment path
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    VENV_ACTIVATE="venv/Scripts/activate"
else
    VENV_ACTIVATE="venv/bin/activate"
fi

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv || handle_error "Failed to create virtual environment"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source "$VENV_ACTIVATE" || handle_error "Failed to activate virtual environment"

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt || handle_error "Failed to install backend dependencies"

# Apply database migrations
echo "Applying database migrations..."
cd backend
python manage.py migrate || handle_error "Failed to apply migrations"
cd ..

# Start Django backend server in the background
echo "Starting Django backend server..."
cd backend
python manage.py runserver &
BACKEND_PID=$!
cd ..

echo "Backend server running at http://localhost:8000/"

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install || handle_error "Failed to install frontend dependencies"

# Start React frontend server
echo "Starting React frontend server..."
npm start &
FRONTEND_PID=$!

echo "Frontend server running at http://localhost:3000/"
echo ""
echo "========================================"
echo "  Servers are now running!"
echo "  - Backend: http://localhost:8000/"
echo "  - Frontend: http://localhost:3000/"
echo "  - Admin: http://localhost:8000/admin/"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo "Servers stopped"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT

# Wait for user to press Ctrl+C
wait 