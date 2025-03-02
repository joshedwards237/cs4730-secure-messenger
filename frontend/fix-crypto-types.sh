#!/bin/bash

# Make sure we're in the frontend directory
cd "$(dirname "$0")" || exit 1

echo "========================================"
echo "  Fixing crypto-js type declarations"
echo "========================================"
echo ""

# Create a declarations.d.ts file to fix module imports
echo "Creating declarations.d.ts file..."
mkdir -p src/types
cat > src/types/declarations.d.ts << EOF
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module 'crypto-js';
EOF

# Install crypto-js type definitions
echo "Installing crypto-js type definitions..."
npm install --save-dev @types/crypto-js

echo "Done! The crypto-js type issue should be fixed." 