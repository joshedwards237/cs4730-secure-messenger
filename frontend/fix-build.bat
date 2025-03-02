@echo off
echo Fixing build process for Node.js compatibility...

:: Create a temporary JavaScript file to update package.json
echo const fs = require('fs'); > cross-env-fix.js
echo const path = require('path'); >> cross-env-fix.js
echo. >> cross-env-fix.js
echo const packageJsonPath = path.join(__dirname, 'package.json'); >> cross-env-fix.js
echo const packageJson = require(packageJsonPath); >> cross-env-fix.js
echo. >> cross-env-fix.js
echo // Update scripts to use cross-platform environment variables >> cross-env-fix.js
echo packageJson.scripts.start = "react-scripts --openssl-legacy-provider start"; >> cross-env-fix.js
echo packageJson.scripts.build = "react-scripts --openssl-legacy-provider build"; >> cross-env-fix.js
echo. >> cross-env-fix.js
echo // Write the updated package.json >> cross-env-fix.js
echo fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2)); >> cross-env-fix.js
echo console.log('Updated package.json scripts for Node.js compatibility'); >> cross-env-fix.js

:: Run the fix script
node cross-env-fix.js

:: Create a .env file with the necessary settings
echo NODE_OPTIONS=--openssl-legacy-provider > .env

:: Set the environment variable for the current session
set NODE_OPTIONS=--openssl-legacy-provider

echo Fix applied. You can now run 'npm run build' or 'npm start' without OpenSSL errors.
echo You may need to restart your terminal for the changes to take effect. 