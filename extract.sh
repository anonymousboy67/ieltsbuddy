#!/bin/bash
source .env.local
export ANTHROPIC_API_KEY
export MONGODB_URI
npx tsx scripts/extract-with-ai.ts "$@"
chmod +x extract.sh