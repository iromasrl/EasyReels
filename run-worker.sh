#!/bin/bash

# Load .env.local and export all variables
set -a
source .env.local
set +a

# Run the worker
npx tsx src/workers/run.ts
