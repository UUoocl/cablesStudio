#!/bin/bash
cd "$(dirname "$0")"
echo "🛠️ Compiling CablesActiveAppMonitor..."
swift build -c release
if [ $? -eq 0 ]; then
  mkdir -p swift_bin
  cp .build/release/CablesActiveAppMonitor swift_bin/CablesActiveAppMonitor
  echo "✅ Compilation successful! Binary placed in swift_bin/CablesActiveAppMonitor"
else
  echo "❌ Compilation failed!"
  exit 1
fi
