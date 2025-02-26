# Secure Messenger Frontend

This is the frontend for the Secure Messenger application, a peer-to-peer encrypted chat application built with React, TypeScript, and Firebase.

## Features

- User authentication (login, registration, logout)
- End-to-end encrypted messaging
- Real-time chat updates
- Responsive design for mobile and desktop

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Running the Development Server

```
npm start
```
or
```
yarn start
```

This will start the development server at [http://localhost:3000](http://localhost:3000).

### Building for Production

```
npm run build
```
or
```
yarn build
```

This will create an optimized production build in the `build` folder.

## Project Structure

- `public/` - Static assets and HTML template
- `src/` - Source code
  - `components/` - React components
  - `contexts/` - React contexts (e.g., AuthContext)
  - `services/` - API and utility services
  - `types/` - TypeScript type definitions
  - `App.tsx` - Main application component
  - `index.tsx` - Application entry point

## Technologies Used

- React
- TypeScript
- React Router
- Axios
- Firebase Authentication
- CryptoJS for encryption 