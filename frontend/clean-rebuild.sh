#!/bin/bash

echo "========================================"
echo "  Secure Messenger - Frontend Rebuild"
echo "========================================"
echo ""

# Stop any running processes
echo "Stopping any running processes..."
pkill -f "react-scripts start" || true

# Remove build artifacts
echo "Removing build artifacts..."
rm -rf build
rm -rf node_modules
rm -f package-lock.json

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install

# Create a tsconfig.json file if it doesn't exist
if [ ! -f "tsconfig.json" ]; then
  echo "Creating tsconfig.json file..."
  cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}
EOF
fi

# Start the development server
echo "Starting development server..."
npm start 