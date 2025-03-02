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
