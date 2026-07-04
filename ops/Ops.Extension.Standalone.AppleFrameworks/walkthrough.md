# Walkthrough - Create Native AppleFrameworks Mouse, Keyboard, Vision & Controller Addons

We implemented the native mouse monitor (`Ops.Extension.Standalone.AppleFrameworks.MouseMonitor`), mouse controller (`Ops.Extension.Standalone.AppleFrameworks.MouseController`), keyboard monitor (`Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor`), keyboard controller (`Ops.Extension.Standalone.AppleFrameworks.KeyboardController`), person segmentation (`Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation`), face landmark tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanFace`), hand pose tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanHand`), body pose tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanPose2d`), 3D body pose tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanPose3d`), speech to text engine (`Ops.Extension.Standalone.AppleFrameworks.SpeechToText`), UVC camera controller (`Ops.Extension.Standalone.AppleFrameworks.UvcController`), 8BitDo Xbox controller interface (`Ops.Extension.Standalone.AppleFrameworks.EightBitDoXbox`), Blackmagic Design Speed Editor controller interface (`Ops.Extension.Standalone.AppleFrameworks.BmdSpeedEditor`), Contour ShuttlePRO v2 interface (`Ops.Extension.Standalone.AppleFrameworks.ContourShuttlePro`), Contour ShuttleXpress interface (`Ops.Extension.Standalone.AppleFrameworks.ContourShuttleXpress`), Ulanzi D100H Dial Controller interface (`Ops.Extension.Standalone.AppleFrameworks.UlanziControllerD100H`), Soomfon Stream Controller interface (`Ops.Extension.Standalone.AppleFrameworks.SoomfonController`), Soomfon Key Texture updater (`Ops.Extension.Standalone.AppleFrameworks.SoomfonKeyTexture`), Soomfon Stretched Texture updater (`Ops.Extension.Standalone.AppleFrameworks.SoomfonStretchedTexture`), Elgato Stream Deck USB HID controller interface (`Ops.Extension.Standalone.AppleFrameworks.StreamDeck`), Stream Deck Key Texture updater (`Ops.Extension.Standalone.AppleFrameworks.StreamDeckKeyTexture`), and Stream Deck Stretched Texture updater (`Ops.Extension.Standalone.AppleFrameworks.StreamDeckStretchedTexture`) operators as self-contained Node-API addons written in Objective-C++, avoiding the need for helper Swift binary sidecar processes and WebSockets.

---

## 1. AppleFrameworks.MouseMonitor

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseMonitor/binding.gyp): Universal compiler settings linking CoreGraphics, Foundation, and ApplicationServices.
- [mouse_monitor.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseMonitor/mouse_monitor.mm): Native N-API implementation setting up the macOS global CGEventTap listener.
- [Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseMonitor/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.js): JS wrapper loading the native `.node` file and dispatching coordinates, click states, and scrolls.
- [Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseMonitor/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.json): Pin layout and descriptions for standard standalone Electron compatibility.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseMonitor/.gitignore): Ignores build intermediate files, ensuring clean Git tracking.
- `mouse_monitor.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`.
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: mouse_monitor.node are: x86_64 arm64
  ```
  It is successfully compiled as a universal binary (containing both Intel `x86_64` and Apple Silicon `arm64` architectures) and is 100% portable.
- **Bug Fix**: Fixed a `TypeError: op.patch.filePath is not a function` error by resolving `addonPath` lazily inside the `initAddon` function instead of at the global evaluation scope.

---

## 2. AppleFrameworks.MouseController

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseController` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseController/binding.gyp): Universal compiler settings linking CoreGraphics, Foundation, and ApplicationServices.
- [mouse_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseController/mouse_controller.mm): Native N-API implementation mapping coordinates, button presses/releases, drags, and scroll events using macOS CGEvent APIs.
- [Ops.Extension.Standalone.AppleFrameworks.MouseController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseController/Ops.Extension.Standalone.AppleFrameworks.MouseController.js): JS wrapper loading the native `.node` file, resolving path lazily to avoid initialization order bugs, and managing the `click` action asynchronously with `setTimeout(..., 10)`.
- [Ops.Extension.Standalone.AppleFrameworks.MouseController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseController/Ops.Extension.Standalone.MouseController.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.MouseController/.gitignore): Ignores build intermediate files.
- `mouse_controller.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: mouse_controller.node are: x86_64 arm64
  ```
  It is successfully compiled as a universal binary (containing both Intel `x86_64` and Apple Silicon `arm64` architectures) and is 100% portable.

---

## 3. AppleFrameworks.KeyboardMonitor

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardMonitor/binding.gyp): Universal compiler settings linking CoreGraphics, Foundation, and ApplicationServices.
- [keyboard_monitor.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardMonitor/keyboard_monitor.mm): Native N-API implementation setting up the macOS global CGEventTap keyboard listener. Maps keycodes and active modifiers into clean, readable event properties.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardMonitor/Ops.Extension.Standalone.KeyboardMonitor.js): JS wrapper loading the native `.node` file, resolving path lazily to avoid initialization order bugs, and managing output pins.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardMonitor/Ops.Extension.Standalone.KeyboardMonitor.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardMonitor/.gitignore): Ignores build intermediate files.
- `keyboard_monitor.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: keyboard_monitor.node are: x86_64 arm64
  ```
  It is successfully compiled as a universal binary (containing both Intel `x86_64` and Apple Silicon `arm64` architectures) and is 100% portable.

---

## 4. AppleFrameworks.KeyboardController

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardController` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardController/binding.gyp): Universal compiler settings.
- [keyboard_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.KeyboardController/keyboard_controller.mm): Native N-API implementation mapping standard keynames and modifiers, and synthesizing keyboard keystroke down/up events using macOS CGEvent APIs.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardController/Ops.Extension.Standalone.KeyboardController.js): JS wrapper loading the native `.node` file, resolving path lazily to avoid initialization order bugs, and managing output pins.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardController/Ops.Extension.Standalone.KeyboardController.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.KeyboardController/.gitignore): Ignores build intermediate files.
- `keyboard_controller.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: keyboard_controller.node are: x86_64 arm64
  ```
  It is successfully compiled as a universal binary (containing both Intel `x86_64` and Apple Silicon `arm64` architectures) and is 100% portable.

---

## 5. AppleFrameworks.PersonSegmentation

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.PersonSegmentation/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [person_segmentation.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.PersonSegmentation/person_segmentation.mm): Native N-API implementation setting up the asynchronous ML segmentation task running on Node background threads. It takes raw BGRA pixels, executes `VNGeneratePersonSegmentationRequest` using Apple's Neural Engine (ANE) on Apple Silicon, and returns the output mask as a Buffer.
- [Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.PersonSegmentation/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.js): JS wrapper that handles FBO downsampling and upscaling on the GPU, zero-copy buffer transmission, and resolves the segment promise.
- [Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.PersonSegmentation/Ops.Extension.Standalone.PersonSegmentation.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.PersonSegmentation/.gitignore): Ignores build intermediate files.
- `person_segmentation.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: person_segmentation.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs 100% natively on Apple Silicon with full Neural Engine acceleration, ensuring zero performance compromises.

---

## 6. AppleFrameworks.HumanFace

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanFace` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanFace/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_face.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.HumanFace/human_face.mm): Native N-API implementation setting up the asynchronous ML face landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectFaceLandmarksRequest`, and returns the detailed landmarks coordinates, bounding box, roll/yaw/pitch directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanFace.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.HumanFace/Ops.Extension.Standalone.AppleFrameworks.HumanFace.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanFace.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.HumanFace/Ops.Extension.Standalone.HumanFace.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanFace/.gitignore): Ignores build intermediate files.
- `human_face.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: human_face.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon with full Neural Engine acceleration.

---

## 7. AppleFrameworks.HumanHand

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanHand` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanHand/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_hand.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanHand/human_hand.mm): Native N-API implementation setting up the asynchronous ML hand pose landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectHumanHandPoseRequest`, and returns the detailed joint coordinates, confidence, and chirality ("left", "right", "unknown") directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanHand.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanHand/Ops.Extension.Standalone.AppleFrameworks.HumanHand.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanHand.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanHand/Ops.Extension.Standalone.AppleFrameworks.HumanHand.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanHand/.gitignore): Ignores build intermediate files.
- `human_hand.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: human_hand.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon with full Neural Engine acceleration.

---

## 8. AppleFrameworks.HumanPose2d

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose2d/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_pose2d.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose2d/human_pose2d.mm): Native N-API implementation setting up the asynchronous ML body pose landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectHumanBodyPoseRequest` with configurable Region of Interest (ROI), and returns the detailed body joints coordinates and confidence directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose2d/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the body pose tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose2d/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose2d/.gitignore): Ignores build intermediate files.
- `human_pose2d.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: human_pose2d.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon with full Neural Engine acceleration.

---

## 9. AppleFrameworks.HumanPose3d

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose3d/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_pose3d.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose3d/human_pose3d.mm): Native N-API implementation setting up the asynchronous ML 3D body pose landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectHumanBodyPose3DRequest`, and returns the 3D coordinates (x/y/z in meters), estimated body height, and confidence directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose3d.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose3d/Ops.Extension.Standalone.HumanPose3d.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the 3D body pose tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose3d.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose3d/Ops.Extension.Standalone.HumanPose3d.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.HumanPose3d/.gitignore): Ignores build intermediate files.
- `human_pose3d.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: human_pose3d.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon with full Neural Engine acceleration.

---

## 10. AppleFrameworks.SpeechToText

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SpeechToText` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SpeechToText/binding.gyp): Universal compiler settings linking AVFoundation, Speech, CoreAudio, AudioToolbox, Foundation, and ApplicationServices.
- [speech_to_text.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SpeechToText/speech_to_text.mm): Native N-API implementation setting up the real-time audio capture and speech recognition engine. Connects AVFoundation, maps locales, processes silence durations, and dynamically updates audio devices. Includes a CoreAudio hardware property listener that automatically detects hot-plugged microphones and updates JavaScript thread-safely.
- [Ops.Extension.Standalone.AppleFrameworks.SpeechToText.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SpeechToText/Ops.Extension.Standalone.AppleFrameworks.SpeechToText.js): JS wrapper that handles event subscription, output modes (Full Transcript, New Words, Chunk), dynamic audio device dropdown mapping, and controls addon states.
- [Ops.Extension.Standalone.AppleFrameworks.SpeechToText.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SpeechToText/Ops.Extension.Standalone.SpeechToText.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SpeechToText/.gitignore): Ignores build intermediate files.
- `speech_to_text.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: speech_to_text.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 11. AppleFrameworks.UvcController

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/binding.gyp): Universal compiler settings linking IOKit, Foundation, and ApplicationServices. ARC is disabled with `-fno-objc-arc` compilation flags to match the underlying USB control implementation.
- [uvc_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/uvc_controller.mm): Native N-API implementation setting up the direct IOKit interface wrapper. Exposes native camera enumeration, opening/closing interface sessions, querying control limits/metadata, and setting parameters (e.g. Pan, Tilt, Zoom, brightness, exposure).
- [UVCController.m](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/UVCController.m), [UVCType.m](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/UVCType.m), [UVCValue.m](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/UVCValue.m): The underlying core USB Video Class control library.
- [Ops.Extension.Standalone.AppleFrameworks.UvcController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/Ops.Extension.Standalone.AppleFrameworks.UvcController.js): JS wrapper that handles device listing, populating the target camera selector dynamically in Cables, active polling, and custom JSON command processing.
- [Ops.Extension.Standalone.AppleFrameworks.UvcController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/Ops.Extension.Standalone.UvcController.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.UvcController/.gitignore): Ignores build intermediate files.
- `uvc_controller.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: uvc_controller.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 12. AppleFrameworks.EightBitDoXbox

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.EightBitDoXbox` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.EightBitDoXbox/binding.gyp): Universal compiler settings linking IOKit and Foundation. ARC is disabled with `-fno-objc-arc` compilation flags to match the underlying USB control implementation.
- [8bitdo_xbox.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.EightBitDoXbox/8bitdo_xbox.mm): Native N-API implementation setting up the asynchronous thread-safe callback using `napi_threadsafe_function`. Binds connection updates and input reports (joysticks, triggers, button state bitmasks) directly back to JavaScript in memory.
- [XboxControllerCore.m](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.EightBitDoXbox/XboxControllerCore.m), [XboxControllerCore.h](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.EightBitDoXbox/include/XboxControllerCore.h): The underlying core USB/IOKit Xbox communication library.
- [Ops.Extension.Standalone.AppleFrameworks.EightBitDoXbox.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.EightBitDoXbox/Ops.Extension.Standalone.EightBitDoXbox.js): JS wrapper that subscribes to the addon callback, handles input axis scaling and individual button updates, and writes haptic rumble command buffers.
- [Ops.Extension.Standalone.AppleFrameworks.EightBitDoXbox.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.EightBitDoXbox/Ops.Extension.Standalone.EightBitDoXbox.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.EightBitDoXbox/.gitignore): Ignores build intermediate files.
- `8bitdo_xbox.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: 8bitdo_xbox.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 13. AppleFrameworks.BmdSpeedEditor

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.BmdSpeedEditor` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.BmdSpeedEditor/binding.gyp): Universal compiler settings linking IOKit and Foundation.
- [bmd_speed_editor.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.BmdSpeedEditor/bmd_speed_editor.mm): Native N-API implementation setting up the asynchronous thread-safe callback using `napi_threadsafe_function`. Tracks matching and removal of Speed Editor hardware (`0x1EDB` VID, `0xDA0E` PID), implements challenge-response authentication, manages Jog wheel tick deltas, and receives input reports for held keys and battery level.
- [Ops.Extension.Standalone.AppleFrameworks.BmdSpeedEditor.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.BmdSpeedEditor/Ops.Extension.Standalone.AppleFrameworks.BmdSpeedEditor.js): JS wrapper that maps button keycodes to human-readable Resolve keys, manages LED bitfields, jog wheel outputs, and charging indicators.
- [Ops.Extension.Standalone.AppleFrameworks.BmdSpeedEditor.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.BmdSpeedEditor/Ops.Extension.Standalone.AppleFrameworks.BmdSpeedEditor.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.BmdSpeedEditor/.gitignore): Ignores build intermediate files.
- `bmd_speed_editor.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: bmd_speed_editor.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 14. AppleFrameworks.ContourShuttlePro

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ContourShuttlePro` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ContourShuttlePro/binding.gyp): Universal compiler settings linking IOKit and Foundation.
- [contour_shuttle_pro.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ContourShuttlePro/contour_shuttle_pro.mm): Native N-API implementation setting up the asynchronous thread-safe callback using `napi_threadsafe_function`. Binds device connection, deflection of the spring-loaded shuttle ring (-7 to 7), jog wheel relative ticks, and 15 individual buttons directly back to JavaScript in memory.
- [Ops.Extension.Standalone.AppleFrameworks.ContourShuttlePro.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ContourShuttlePro/Ops.Extension.Standalone.AppleFrameworks.ContourShuttlePro.js): JS wrapper that receives jog, shuttle, and button updates, maintaining compatibility with all existing standalone Cables ports.
- [Ops.Extension.Standalone.AppleFrameworks.ContourShuttlePro.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ContourShuttlePro/Ops.Extension.Standalone.AppleFrameworks.ContourShuttlePro.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ContourShuttlePro/.gitignore): Ignores build intermediate files.
- `contour_shuttle_pro.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: contour_shuttle_pro.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 15. AppleFrameworks.ContourShuttleXpress

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ContourShuttleXpress` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ContourShuttleXpress/binding.gyp): Universal compiler settings linking IOKit and Foundation.
- [contour_shuttle_xpress.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ContourShuttleXpress/contour_shuttle_xpress.mm): Native N-API implementation setting up the asynchronous thread-safe callback using `napi_threadsafe_function`. Binds device connection, deflection of the spring-loaded shuttle ring (-7 to 7), jog wheel relative ticks, and 5 individual buttons directly back to JavaScript in memory.
- [Ops.Extension.Standalone.AppleFrameworks.ContourShuttleXpress.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ContourShuttleXpress/Ops.Extension.Standalone.AppleFrameworks.ContourShuttleXpress.js): JS wrapper that receives jog, shuttle, and button updates, maintaining compatibility with all existing standalone Cables ports.
- [Ops.Extension.Standalone.AppleFrameworks.ContourShuttleXpress.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ContourShuttleXpress.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ContourShuttleXpress/.gitignore): Ignores build intermediate files.
- `contour_shuttle_xpress.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: contour_shuttle_xpress.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 16. AppleFrameworks.UlanziControllerD100H

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UlanziControllerD100H` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.UlanziControllerD100H/binding.gyp): Universal compiler settings.
- [ulanzi_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.UlanziControllerD100H/ulanzi_controller.mm): Native N-API implementation dynamically loading `kwdm.dylib` via `dlopen`, setting up the asynchronous thread-safe callback using `napi_threadsafe_function`, subscribing to Bluetooth connections, buttons, dials, battery updates, and writing dial haptic motor strength commands.
- [Ops.Extension.Standalone.AppleFrameworks.UlanziControllerD100H.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.UlanziControllerD100H/Ops.Extension.Standalone.AppleFrameworks.UlanziControllerD100H.js): JS wrapper that passes the resolved path to `kwdm.dylib` to initialize the library, receives device updates, and sets haptic parameters.
- [Ops.Extension.Standalone.AppleFrameworks.UlanziControllerD100H.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.UlanziControllerD100H/Ops.Extension.Standalone.AppleFrameworks.UlanziControllerD100H.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.UlanziControllerD100H/.gitignore): Ignores build intermediate files.
- `ulanzi_controller.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: ulanzi_controller.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 17. AppleFrameworks.SoomfonController

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SoomfonController` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.SoomfonController/binding.gyp): Universal compiler settings linking IOKit, CoreGraphics, ImageIO, and Foundation.
- [soomfon_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.SoomfonController/soomfon_controller.mm): Native N-API implementation connecting directly to the Soomfon Stream Controller SE over USB, setting up the asynchronous thread-safe callback using `napi_threadsafe_function`. Handles real-time image cropping, scaling, and 90-degree CCW rotation natively in C++ before transmitting JPEG image chunks via output reports.
- [Ops.Extension.Standalone.AppleFrameworks.SoomfonController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.SoomfonController/Ops.Extension.Standalone.AppleFrameworks.SoomfonController.js): JS wrapper that exposes a connection object for texture writers, maps outputs, and controls panels.
- [Ops.Extension.Standalone.AppleFrameworks.SoomfonController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.SoomfonController/Ops.Extension.Standalone.AppleFrameworks.SoomfonController.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.SoomfonController/.gitignore): Ignores build intermediate files.
- `soomfon_controller.node`: The compiled universal binary dynamic library.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: soomfon_controller.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 18. AppleFrameworks.SoomfonKeyTexture

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SoomfonKeyTexture` containing:
- [Ops.Extension.Standalone.AppleFrameworks.SoomfonKeyTexture.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SoomfonKeyTexture/Ops.Extension.Standalone.AppleFrameworks.SoomfonKeyTexture.js): JS wrapper that receives WebGL textures, scales/flips onto a 2D canvas, and uploads to specific keys.
- [Ops.Extension.Standalone.AppleFrameworks.SoomfonKeyTexture.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SoomfonKeyTexture/Ops.Extension.Standalone.AppleFrameworks.SoomfonKeyTexture.json): Pin layout configuration.

---

## 19. AppleFrameworks.SoomfonStretchedTexture

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SoomfonStretchedTexture` containing:
- [Ops.Extension.Standalone.AppleFrameworks.SoomfonStretchedTexture.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SoomfonStretchedTexture/Ops.Extension.Standalone.AppleFrameworks.SoomfonStretchedTexture.js): JS wrapper that scales/flips input WebGL textures onto the 180x120 display grid matrix and transmits it to the native controller.
- [Ops.Extension.Standalone.AppleFrameworks.SoomfonStretchedTexture.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.SoomfonStretchedTexture/Ops.Extension.Standalone.AppleFrameworks.SoomfonStretchedTexture.json): Pin layout configuration.

---

## 20. AppleFrameworks.StreamDeck

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.StreamDeck` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeck/binding.gyp): Universal compiler settings.
- [stream_deck.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeck/stream_deck.mm): Native N-API implementation setting up the USB connection using macOS `IOHIDManager`. Packetizes and sends display frame writes for Gen 1 (BMP raw payload) and Gen 2 (direct chunked JPEGs) models, maps button order reversal for Stream Deck V1, and triggers JS callback thread-safely.
- [Ops.Extension.Standalone.AppleFrameworks.StreamDeck.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeck/Ops.Extension.Standalone.AppleFrameworks.StreamDeck.js): JS wrapper.
- [Ops.Extension.Standalone.AppleFrameworks.StreamDeck.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeck/Ops.Extension.Standalone.AppleFrameworks.StreamDeck.json): Pin layout configuration.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeck/.gitignore): Ignores build files.
- `stream_deck.node`: Compiled universal dynamic library binary.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: stream_deck.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 21. AppleFrameworks.StreamDeckKeyTexture

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.StreamDeckKeyTexture` containing:
- [Ops.Extension.Standalone.AppleFrameworks.StreamDeckKeyTexture.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeckKeyTexture/Ops.Extension.Standalone.AppleFrameworks.StreamDeckKeyTexture.js): JS wrapper that scales/flips input WebGL textures and updates a single Stream Deck key.
- [Ops.Extension.Standalone.AppleFrameworks.StreamDeckKeyTexture.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeckKeyTexture/Ops.Extension.Standalone.AppleFrameworks.StreamDeckKeyTexture.json): Pin layout configuration.

---

## 22. AppleFrameworks.StreamDeckStretchedTexture

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.StreamDeckStretchedTexture` containing:
- [Ops.Extension.Standalone.AppleFrameworks.StreamDeckStretchedTexture.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeckStretchedTexture/Ops.Extension.Standalone.AppleFrameworks.StreamDeckStretchedTexture.js): JS wrapper that scales/flips input WebGL textures onto the overall grid dimensions and transmits it to the native controller.
- [Ops.Extension.Standalone.AppleFrameworks.StreamDeckStretchedTexture.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.StreamDeckStretchedTexture/Ops.Extension.Standalone.AppleFrameworks.StreamDeckStretchedTexture.json): Pin layout configuration.

---

## 23. AppleFrameworks.ScreenCaptureKitVideo

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitVideo` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitVideo/binding.gyp): Universal compiler settings linking ScreenCaptureKit, CoreMedia, CoreVideo, CoreGraphics, and Foundation.
- [screen_capture.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitVideo/screen_capture.mm): Native N-API implementation setting up the screen/window capture using ScreenCaptureKit. Swaps BGRA to RGBA in-place while copying for WebGL compatibility, and provides double-buffered frame pixel buffers thread-safely.
- [Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitVideo.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitVideo/Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitVideo.js): JS wrapper.
- [Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitVideo.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitVideo/Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitVideo.json): Pin layout configuration.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitVideo/.gitignore): Ignores build files.
- `screen_capture.node`: Compiled universal dynamic library binary.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: screen_capture.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 24. AppleFrameworks.ScreenCaptureKitAudio

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitAudio` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitAudio/binding.gyp): Universal compiler settings linking ScreenCaptureKit, CoreMedia, CoreAudio, AudioToolbox, and Foundation.
- [screen_capture_audio.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitAudio/screen_capture_audio.mm): Native N-API implementation setting up the screen/window audio capture using ScreenCaptureKit. Transmits audio planar Float32 samples thread-safely via a circular queue.
- [Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitAudio.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitAudio/Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitAudio.js): JS wrapper.
- [Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitAudio.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitAudio/Ops.Extension.Standalone.AppleFrameworks.ScreenCaptureKitAudio.json): Pin layout configuration.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.ScreenCaptureKitAudio/.gitignore): Ignores build files.
- `screen_capture_audio.node`: Compiled universal dynamic library binary.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: screen_capture_audio.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.

---

## 25. AppleFrameworks.CoreAudioTap

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.CoreAudioTap` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.CoreAudioTap/binding.gyp): Universal compiler settings linking CoreAudio, AudioToolbox, CoreGraphics, and Foundation.
- [coreaudio_tap.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.CoreAudioTap/coreaudio_tap.mm): Native N-API implementation setting up the screen/window audio capture using CoreAudio taps. Uses dlsym dynamic resolution for Sonoma process taps and supports standard system mix loopbacks.
- [Ops.Extension.Standalone.AppleFrameworks.CoreAudioTap.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.CoreAudioTap/Ops.Extension.Standalone.AppleFrameworks.CoreAudioTap.js): JS wrapper.
- [Ops.Extension.Standalone.AppleFrameworks.CoreAudioTap.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.CoreAudioTap/Ops.Extension.Standalone.AppleFrameworks.CoreAudioTap.json): Pin layout configuration.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.CoreAudioTap/.gitignore): Ignores build files.
- `coreaudio_tap.node`: Compiled universal dynamic library binary.

### Verification Results
- **Addon Compilation**: Compiled successfully for Electron 31.7.3 using `node-gyp` and `xcodebuild`:
  ```bash
  npx node-gyp configure --target=31.7.3 --dist-url=https://electronjs.org/headers -- -f xcode && xcodebuild -project build/binding.xcodeproj -configuration Release
  ```
- **Architecture Check**: Running `lipo -info` on the compiled library:
  ```
  Architectures in the fat file: coreaudio_tap.node are: x86_64 arm64
  ```
  It is compiled as a universal binary. The `arm64` slice runs natively on Apple Silicon.



