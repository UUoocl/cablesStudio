#!/bin/bash
cd "$(dirname "$0")"
echo "🛠️ Compiling CablesPersonSegmentation..."
swift build -c release
if [ $? -eq 0 ]; then
  mkdir -p swift_bin
  cp .build/release/CablesPersonSegmentation swift_bin/CablesPersonSegmentation
  echo "✅ Compilation successful! Binary placed in swift_bin/CablesPersonSegmentation"
else
  echo "❌ Compilation failed!"
  exit 1
fi
