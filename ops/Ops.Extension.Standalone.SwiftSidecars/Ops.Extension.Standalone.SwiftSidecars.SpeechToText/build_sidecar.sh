#!/bin/bash
cd "$(dirname "$0")"
echo "🛠️ Compiling CablesSpeechToText..."
swift build -c release
if [ $? -eq 0 ]; then
  mkdir -p swift_bin
  cp .build/release/CablesSpeechToText swift_bin/CablesSpeechToText
  echo "✅ Compilation successful! Binary placed in swift_bin/CablesSpeechToText"
else
  echo "❌ Compilation failed!"
  exit 1
fi
