# Secure Messenger

A peer-to-peer encrypted web messaging application developed by Josh Edwards, Brendan Sullivan, and Jake Quinn for CS 4730 Privacy and Censorship.

## Tech Stack

- **Backend**: Django/Flask with Python
- **Frontend**: React with TypeScript
- **Database/Auth**: Firebase
- **Encryption**: AES, RSA, ECC
- **Real-time Communication**: WebRTC

## Features

- Peer-to-peer encrypted messaging
- Ephemeral conversations (messages deleted after session ends)
- Lightweight identity system
- Multiple encryption methods
- No server-side message storage

## Setup Instructions

### Prerequisites

- Python 3.8+ with pip
- Node.js 14+ with npm
- Git

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/cs4730-secure-messenger.git
   cd cs4730-secure-messenger
   ```

2. Set up the Python virtual environment:
   ```
   python -m venv venv
   source venv/Scripts/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the database:
   ```
   cd backend
   python manage.py migrate
   python manage.py createsuperuser  # Follow prompts to create an admin user
   cd ..
   ```

4. Install frontend dependencies:
   ```
   cd frontend
   npm install
   cd ..
   ```

### Running the Application

#### Option 1: Using the Startup Script (Recommended)

For Unix/Linux/Mac or Git Bash on Windows:
```
./start.sh
```

For Windows Command Prompt:
```
start.bat
```

This will start both the backend and frontend servers in one command.

#### Option 2: Manual Startup

1. Start the backend server:
   ```
   cd backend
   python manage.py runserver
   ```
   The backend will be available at http://localhost:8000/

2. In a separate terminal, start the frontend server:
   ```
   cd frontend
   npm start
   ```
   The frontend will be available at http://localhost:3000/

### Accessing the Application

- Frontend: http://localhost:3000/
- Backend API: http://localhost:8000/api/
- Admin Interface: http://localhost:8000/admin/ (use the superuser credentials)

## Development

### Backend

The backend is built with Django and Django REST Framework. Key components:

- `users/`: Custom user model and authentication
- `chat/`: Chat session and message models
- `encryption/`: Encryption utilities

### Frontend

The frontend is built with React and TypeScript. Key components:

- `src/components/Auth/`: Authentication components
- `src/components/Chat/`: Chat interface components
- `src/services/`: API and WebSocket services
- `src/utils/encryption.ts`: Client-side encryption utilities

## License

[MIT License](LICENSE)
