#!/bin/bash
set -e
echo "=== Build web ==="
cd web && npm install && npm run build
echo "=== Build api ==="
cd ../api && npm install
echo "=== Build done ==="
