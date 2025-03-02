#!/bin/bash

echo "Fixing build process for Node.js compatibility..."

# Update package.json scripts for cross-platform compatibility
cat > ./cross-env-fix.js << 'EOL'
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = require(packageJsonPath);

// Update scripts to use cross-platform environment variables
packageJson.scripts.start = "react-scripts --openssl-legacy-provider start";
packageJson.scripts.build = "react-scripts --openssl-legacy-provider build";

// Write the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('Updated package.json scripts for Node.js compatibility');
EOL

# Run the fix script
node ./cross-env-fix.js

# Create a .env file with the necessary settings
echo "NODE_OPTIONS=--openssl-legacy-provider" > .env

echo "Fix applied. You can now run 'npm run build' or 'npm start' without OpenSSL errors." 