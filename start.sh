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

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Start application with dependency reinstallation"
echo "2) Start application without reinstalling dependencies"
echo "3) Fix migration conflicts and start application"
echo "4) Reset database and migrations completely"
echo "5) Fix frontend TypeScript errors and conflicts"
echo "6) Reinstall frontend node modules only"
echo "7) Clean build and start application (removes previous builds)"
read -p "Enter your choice (1/2/3/4/5/6/7): " user_choice

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

# Clean build if requested
if [ "$user_choice" = "7" ]; then
    echo "Cleaning previous builds..."
    
    # Clean frontend build
    cd frontend
    echo "Removing frontend build directory..."
    rm -rf build
    
    # Clean cache
    echo "Clearing npm cache..."
    npm cache clean --force
    
    # Remove node_modules (optional but thorough)
    echo "Removing node_modules..."
    rm -rf node_modules
    
    # Reinstall dependencies
    echo "Reinstalling dependencies..."
    npm install || handle_error "Failed to reinstall frontend dependencies"
    
    cd ..
fi

# Install backend dependencies if requested
if [ "$user_choice" = "1" ] || [ "$user_choice" = "7" ]; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt || handle_error "Failed to install backend dependencies"
else
    echo "Skipping backend dependency installation..."
fi

# Handle migration conflicts if requested
if [ "$user_choice" = "3" ]; then
    echo "Fixing migration conflicts..."
    cd backend
    
    # Remove conflicting migrations
    echo "Removing conflicting migrations..."
    find . -path "*/migrations/*" -name "*.py" | grep -E ".*_initial-.*\.py" | xargs rm -f
    
    # Make fresh migrations
    echo "Creating fresh migrations..."
    python manage.py makemigrations
    
    cd ..
elif [ "$user_choice" = "4" ]; then
    echo "Resetting database and migrations completely..."
    cd backend
    
    # Remove database
    echo "Removing database..."
    rm -f db.sqlite3
    
    # Remove all migrations
    echo "Removing all migrations..."
    find . -path "*/migrations/*" -name "*.py" | grep -v "__init__.py" | xargs rm -f
    
    # Make fresh migrations
    echo "Creating fresh migrations..."
    python manage.py makemigrations users chat encryption
    
    cd ..
elif [ "$user_choice" = "5" ]; then
    echo "Fixing frontend TypeScript errors and conflicts..."
    cd frontend
    
    # Remove machine-specific component files
    echo "Removing machine-specific component files..."
    find ./src -name "*-DESKTOP-*.tsx" -o -name "*-DESKTOP-*.ts" | while read file; do
        base_name=$(basename "$file" | sed 's/-DESKTOP-.*\.tsx$/\.tsx/' | sed 's/-DESKTOP-.*\.ts$/\.ts/')
        dir_name=$(dirname "$file")
        echo "Renaming $file to $dir_name/$base_name"
        mv "$file" "$dir_name/$base_name"
    done
    
    # Fix AuthContext type issues
    echo "Fixing AuthContext type issues..."
    if [ -f "./src/types/index.ts" ]; then
        # Update AuthState interface to include session_id and private_key
        sed -i 's/export interface AuthState {/export interface AuthState {\n  session_id: string | null;\n  private_key: string | null;/g' ./src/types/index.ts
        
        # Update AuthContextType to include isLoading
        sed -i 's/export interface AuthContextType {/export interface AuthContextType {\n  isLoading: boolean;/g' ./src/types/index.ts
        
        # Add Chat type if missing
        if ! grep -q "export interface Chat" ./src/types/index.ts; then
            echo "Adding Chat interface to types..."
            echo "
export interface Chat {
  id: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}" >> ./src/types/index.ts
        fi
        
        # Update Message interface if needed
        if grep -q "export interface Message" ./src/types/index.ts; then
            echo "Updating Message interface..."
            sed -i 's/export interface Message {/export interface Message {\n  sender_username?: string;\n  encrypted_content?: string;\n  encryption_method?: string;/g' ./src/types/index.ts
        fi
    else
        echo "Warning: types/index.ts file not found. Cannot fix type definitions."
    fi
    
    # Fix API service issues
    echo "Fixing API service issues..."
    if [ -f "./src/services/api.ts" ]; then
        # Update chatAPI to include missing methods
        sed -i 's/export const chatAPI = {/export const chatAPI = {\n  getChatSessions: async () => {\n    return await api.get<ChatSession[]>(`\/api\/chats\/`);\n  },\n  getChatSession: async (chatId: number) => {\n    return await api.get<ChatSession>(`\/api\/chats\/${chatId}\/`);\n  },\n  createChatSession: async (participants: string[]) => {\n    return await api.post<ChatSession>(`\/api\/chats\/`, { participants });\n  },/g' ./src/services/api.ts
    else
        echo "Warning: services/api.ts file not found. Cannot fix API services."
    fi
    
    # Fix useParams type issue in ChatRoom
    echo "Fixing useParams type issue in ChatRoom..."
    if [ -f "./src/components/Chat/ChatRoom.tsx" ]; then
        sed -i 's/useParams<ChatRoomParams>()/useParams<{ id: string }>()/g' ./src/components/Chat/ChatRoom.tsx
    fi
    
    # Create a backup of the original files
    echo "Creating backup of original files..."
    mkdir -p ./src/backup
    cp -r ./src/components ./src/backup/
    cp -r ./src/contexts ./src/backup/
    cp -r ./src/services ./src/backup/
    cp -r ./src/types ./src/backup/
    
    echo "TypeScript fixes applied. Rebuilding..."
    npm run build || echo "Build failed, but we can still try to run the app."
    
    cd ..
elif [ "$user_choice" = "6" ]; then
    echo "Reinstalling frontend node modules..."
    cd frontend
    
    # Remove node_modules directory
    echo "Removing node_modules directory..."
    rm -rf node_modules
    
    # Remove package-lock.json
    echo "Removing package-lock.json..."
    rm -f package-lock.json
    
    # Clean npm cache
    echo "Cleaning npm cache..."
    npm cache clean --force
    
    # Reinstall dependencies
    echo "Reinstalling npm dependencies..."
    npm install -g forever || handle_error "Failed to reinstall frontend dependencies"
    
    cd ..
fi

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

# Install frontend dependencies if requested
cd frontend
if [ "$user_choice" = "1" ] && [ "$user_choice" != "6" ] && [ "$user_choice" != "7" ]; then
    echo "Installing frontend dependencies..."
    npm install -g forever || handle_error "Failed to install frontend dependencies"
else
    echo "Skipping frontend dependency installation..."
fi

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