#!/bin/bash

# Load environment variables
if [ -f "$(dirname "$0")/.env" ]; then
  export $(grep -v '^'#'' $(dirname "$0")/.env | xargs)
fi

# Ensure API_ID and API_HASH are set
if [ -z "$TELEGRAM_API_ID" ] || [ -z "$TELEGRAM_API_HASH" ]; then
  echo "Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in the .env file."
  exit 1
fi

# Navigate to the script directory
cd "$(dirname "$0")"

# Run the Python script
python telegramStats.py 