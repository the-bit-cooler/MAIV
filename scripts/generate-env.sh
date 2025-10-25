#!/bin/bash

# Exit if any command fails
set -e

# Path to .env file
ENV_FILE=".env"

echo "Generating $ENV_FILE from Codespaces secrets..."

# Overwrite existing .env
cat > $ENV_FILE <<EOL
EXPO_PUBLIC_AZURE_FUNCTION_URL=${AZURE_FUNCTION_URL}
EXPO_PUBLIC_AZURE_FUNCTION_KEY=${AZURE_FUNCTION_KEY}
EXPO_PUBLIC_AZURE_STORAGE_URL=${AZURE_STORAGE_URL}
# Add more secrets here as needed
EOL

echo "$ENV_FILE generated successfully."