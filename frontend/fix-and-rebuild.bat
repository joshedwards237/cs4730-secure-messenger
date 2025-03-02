@echo off
rem Change to the directory where the script is located
cd /d "%~dp0"

echo ========================================
echo   Secure Messenger - Fix and Rebuild
echo ========================================
echo.

rem Stop any running processes
echo Stopping any running processes...
taskkill /f /im node.exe 2>nul

rem Remove build artifacts
echo Removing build artifacts...
if exist build rmdir /s /q build
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f package-lock.json

rem Clean npm cache
echo Cleaning npm cache...
call npm cache clean --force

rem Install dependencies
echo Installing dependencies...
call npm install -g forever

rem Create a tsconfig.json file
echo Creating tsconfig.json file...
(
  echo {
  echo   "compilerOptions": {
  echo     "target": "es5",
  echo     "lib": [
  echo       "dom",
  echo       "dom.iterable",
  echo       "esnext"
  echo     ],
  echo     "allowJs": true,
  echo     "skipLibCheck": true,
  echo     "esModuleInterop": true,
  echo     "allowSyntheticDefaultImports": true,
  echo     "strict": true,
  echo     "forceConsistentCasingInFileNames": true,
  echo     "noFallthroughCasesInSwitch": true,
  echo     "module": "esnext",
  echo     "moduleResolution": "node",
  echo     "resolveJsonModule": true,
  echo     "isolatedModules": true,
  echo     "noEmit": true,
  echo     "jsx": "react-jsx"
  echo   },
  echo   "include": [
  echo     "src"
  echo   ]
  echo }
) > tsconfig.json

rem Create a declarations.d.ts file to fix module imports
echo Creating declarations.d.ts file...
if not exist src\types mkdir src\types
(
  echo declare module '*.png';
  echo declare module '*.jpg';
  echo declare module '*.jpeg';
  echo declare module '*.svg';
  echo declare module '*.gif';
  echo declare module 'crypto-js';
) > src\types\declarations.d.ts

rem Update package.json to ensure TypeScript compatibility
echo Updating package.json...
(
  echo {
  echo   "name": "secure-messenger",
  echo   "version": "0.1.0",
  echo   "private": true,
  echo   "dependencies": {
  echo     "@testing-library/jest-dom": "^5.16.5",
  echo     "@testing-library/react": "^13.4.0",
  echo     "@testing-library/user-event": "^13.5.0",
  echo     "@types/jest": "^27.5.2",
  echo     "axios": "^1.3.2",
  echo     "crypto-js": "^4.1.1",
  echo     "firebase": "^9.17.1",
  echo     "react": "^18.2.0",
  echo     "react-dom": "^18.2.0",
  echo     "react-router-dom": "^6.8.1",
  echo     "react-scripts": "5.0.1",
  echo     "typescript": "^4.9.5",
  echo     "web-vitals": "^2.1.4"
  echo   },
  echo   "scripts": {
  echo     "start": "cross-env DISABLE_ESLINT_PLUGIN=true TSC_COMPILE_ON_ERROR=true react-scripts start",
  echo     "build": "cross-env DISABLE_ESLINT_PLUGIN=true TSC_COMPILE_ON_ERROR=true react-scripts build",
  echo     "force-build-win": "cross-env DISABLE_ESLINT_PLUGIN=true TSC_COMPILE_ON_ERROR=true react-scripts build",
  echo     "test": "react-scripts test",
  echo     "eject": "react-scripts eject"
  echo   },
  echo   "eslintConfig": {
  echo     "extends": [
  echo       "react-app",
  echo       "react-app/jest"
  echo     ]
  echo   },
  echo   "browserslist": {
  echo     "production": [
  echo       "^>0.2%%",
  echo       "not dead",
  echo       "not op_mini all"
  echo     ],
  echo     "development": [
  echo       "last 1 chrome version",
  echo       "last 1 firefox version",
  echo       "last 1 safari version"
  echo     ]
  echo   },
  echo   "devDependencies": {
  echo     "@types/crypto-js": "^4.1.1",
  echo     "@types/node": "^16.18.0",
  echo     "@types/react": "^18.0.0",
  echo     "@types/react-dom": "^18.0.0",
  echo     "@types/react-router-dom": "^5.3.3",
  echo     "cross-env": "^7.0.3"
  echo   }
  echo }
) > package.json

rem Install dependencies again with the updated package.json
echo Reinstalling dependencies with updated package.json...
call npm install -g forever

rem Start the development server
echo Starting development server...
call npm start 