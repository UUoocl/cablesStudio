#!/bin/bash
cd "$(dirname "$0")"
echo "🛠️ Compiling CablesUvcGetDevices..."
swift build -c release
if [ $? -eq 0 ]; then
  mkdir -p swift_bin
  cp .build/release/CablesUvcGetDevices swift_bin/CablesUvcGetDevices
  echo "✅ Compilation successful! Binary placed in swift_bin/CablesUvcGetDevices"
else
  echo "❌ Compilation failed!"
  exit 1
fi
