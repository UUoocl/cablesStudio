#!/bin/bash
cd "$(dirname "$0")"
echo "🛠️ Compiling CablesUvcController..."
swift build -c release
if [ $? -eq 0 ]; then
  mkdir -p swift_bin
  cp .build/release/CablesUvcController swift_bin/CablesUvcController
  echo "✅ Compilation successful! Binary placed in swift_bin/CablesUvcController"
else
  echo "❌ Compilation failed!"
  exit 1
fi
