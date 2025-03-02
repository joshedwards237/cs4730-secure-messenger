@echo off
rem Change to the directory where the script is located
cd /d "%~dp0"

echo ========================================
echo   Fixing crypto-js type declarations
echo ========================================
echo.

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

rem Install crypto-js type definitions
echo Installing crypto-js type definitions...
call npm install --save-dev @types/crypto-js

echo Done! The crypto-js type issue should be fixed. 