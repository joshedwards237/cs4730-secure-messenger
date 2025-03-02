@echo off
echo ========================================
echo   Secure Messenger - Frontend Rebuild
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
call npm install

rem Create a tsconfig.json file if it doesn't exist
if not exist tsconfig.json (
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
)

rem Start the development server
echo Starting development server...
call npm start 