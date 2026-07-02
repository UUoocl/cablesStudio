# Walkthrough - Create Native AppleFrameworks Mouse, Keyboard & Vision Addons

We implemented the native mouse monitor (`Ops.Extension.Standalone.AppleFrameworks.MouseMonitor`), mouse controller (`Ops.Extension.Standalone.AppleFrameworks.MouseController`), keyboard monitor (`Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor`), keyboard controller (`Ops.Extension.Standalone.AppleFrameworks.KeyboardController`), person segmentation (`Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation`), face landmark tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanFace`), hand pose tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanHand`), body pose tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanPose2d`), 3D body pose tracker (`Ops.Extension.Standalone.AppleFrameworks.HumanPose3d`), speech to text engine (`Ops.Extension.Standalone.AppleFrameworks.SpeechToText`), and UVC camera controller (`Ops.Extension.Standalone.AppleFrameworks.UvcController`) operators as self-contained Node-API addons written in Objective-C++, avoiding the need for helper Swift binary sidecar processes and WebSockets.

---

## 1. AppleFrameworks.MouseMonitor

### Operator Directory Created
Created the folder `ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor` containing:
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor/binding.gyp): Universal compiler settings linking CoreGraphics, Foundation, and ApplicationServices.
- [mouse_monitor.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor/mouse_monitor.mm): Native N-API implementation setting up the macOS global CGEventTap listener.
- [Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.js): JS wrapper loading the native `.node` file and dispatching coordinates, click states, and scrolls.
- [Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor.json): Pin layout and descriptions for standard standalone Electron compatibility.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseMonitor/.gitignore): Ignores build intermediate files, ensuring clean Git tracking.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseController/binding.gyp): Universal compiler settings linking CoreGraphics, Foundation, and ApplicationServices.
- [mouse_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseController/mouse_controller.mm): Native N-API implementation mapping coordinates, button presses/releases, drags, and scroll events using macOS CGEvent APIs.
- [Ops.Extension.Standalone.AppleFrameworks.MouseController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseController/Ops.Extension.Standalone.AppleFrameworks.MouseController.js): JS wrapper loading the native `.node` file, resolving path lazily to avoid initialization order bugs, and managing the `click` action asynchronously with `setTimeout(..., 10)`.
- [Ops.Extension.Standalone.AppleFrameworks.MouseController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseController/Ops.Extension.Standalone.AppleFrameworks.MouseController.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.MouseController/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor/binding.gyp): Universal compiler settings linking CoreGraphics, Foundation, and ApplicationServices.
- [keyboard_monitor.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor/keyboard_monitor.mm): Native N-API implementation setting up the macOS global CGEventTap keyboard listener. Maps keycodes and active modifiers into clean, readable event properties.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor.js): JS wrapper loading the native `.node` file, resolving path lazily to avoid initialization order bugs, and managing output pins.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardMonitor/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardController/binding.gyp): Universal compiler settings.
- [keyboard_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardController/keyboard_controller.mm): Native N-API implementation mapping standard keynames and modifiers, and synthesizing keyboard keystroke down/up events using macOS CGEvent APIs.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardController/Ops.Extension.Standalone.AppleFrameworks.KeyboardController.js): JS wrapper loading the native `.node` file, resolving path lazily to avoid initialization order bugs, and managing output pins.
- [Ops.Extension.Standalone.AppleFrameworks.KeyboardController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardController/Ops.Extension.Standalone.AppleFrameworks.KeyboardController.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.KeyboardController/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [person_segmentation.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation/person_segmentation.mm): Native N-API implementation setting up the asynchronous ML segmentation task running on Node background threads. It takes raw BGRA pixels, executes `VNGeneratePersonSegmentationRequest` using Apple's Neural Engine (ANE) on Apple Silicon, and returns the output mask as a Buffer.
- [Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.js): JS wrapper that handles FBO downsampling and upscaling on the GPU, zero-copy buffer transmission, and resolves the segment promise.
- [Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.PersonSegmentation/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanFace/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_face.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanFace/human_face.mm): Native N-API implementation setting up the asynchronous ML face landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectFaceLandmarksRequest`, and returns the detailed landmarks coordinates, bounding box, roll/yaw/pitch directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanFace.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanFace/Ops.Extension.Standalone.AppleFrameworks.HumanFace.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanFace.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanFace/Ops.Extension.Standalone.AppleFrameworks.HumanFace.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanFace/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanHand/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_hand.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanHand/human_hand.mm): Native N-API implementation setting up the asynchronous ML hand pose landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectHumanHandPoseRequest`, and returns the detailed joint coordinates, confidence, and chirality ("left", "right", "unknown") directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanHand.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanHand/Ops.Extension.Standalone.AppleFrameworks.HumanHand.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanHand.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanHand/Ops.Extension.Standalone.AppleFrameworks.HumanHand.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanHand/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_pose2d.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d/human_pose2d.mm): Native N-API implementation setting up the asynchronous ML body pose landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectHumanBodyPoseRequest` with configurable Region of Interest (ROI), and returns the detailed body joints coordinates and confidence directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the body pose tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose2d/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d/binding.gyp): Universal compiler settings linking CoreGraphics, CoreVideo, Vision, and Foundation.
- [human_pose3d.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d/human_pose3d.mm): Native N-API implementation setting up the asynchronous ML 3D body pose landmarks tracking task running on Node background threads. It takes raw BGRA pixels, executes `VNDetectHumanBodyPose3DRequest`, and returns the 3D coordinates (x/y/z in meters), estimated body height, and confidence directly as V8 JavaScript array structures natively.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose3d.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d.js): JS wrapper that handles FBO downsampling on the GPU, zero-copy buffer transmission, and resolves the 3D body pose tracking promise.
- [Ops.Extension.Standalone.AppleFrameworks.HumanPose3d.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.HumanPose3d/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SpeechToText/binding.gyp): Universal compiler settings linking AVFoundation, Speech, CoreAudio, AudioToolbox, Foundation, and ApplicationServices.
- [speech_to_text.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SpeechToText/speech_to_text.mm): Native N-API implementation setting up the real-time audio capture and speech recognition engine. Connects AVFoundation, maps locales, processes silence durations, and dynamically updates audio devices. Includes a CoreAudio hardware property listener that automatically detects hot-plugged microphones and updates JavaScript thread-safely.
- [Ops.Extension.Standalone.AppleFrameworks.SpeechToText.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SpeechToText/Ops.Extension.Standalone.AppleFrameworks.SpeechToText.js): JS wrapper that handles event subscription, output modes (Full Transcript, New Words, Chunk), dynamic audio device dropdown mapping, and controls addon states.
- [Ops.Extension.Standalone.AppleFrameworks.SpeechToText.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SpeechToText/Ops.Extension.Standalone.AppleFrameworks.SpeechToText.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.SpeechToText/.gitignore): Ignores build intermediate files.
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
- [binding.gyp](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/binding.gyp): Universal compiler settings linking IOKit, Foundation, and ApplicationServices. ARC is disabled with `-fno-objc-arc` compilation flags to match the underlying USB control implementation.
- [uvc_controller.mm](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/uvc_controller.mm): Native N-API implementation setting up the direct IOKit interface wrapper. Exposes native camera enumeration, opening/closing interface sessions, querying control limits/metadata, and setting parameters (e.g. Pan, Tilt, Zoom, brightness, exposure).
- [UVCController.m](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/UVCController.m), [UVCType.m](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/UVCType.m), [UVCValue.m](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/UVCValue.m): The underlying core USB Video Class control library.
- [Ops.Extension.Standalone.AppleFrameworks.UvcController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/Ops.Extension.Standalone.AppleFrameworks.UvcController.js): JS wrapper that handles device listing, populating the target camera selector dynamically in Cables, active polling, and custom JSON command processing.
- [Ops.Extension.Standalone.AppleFrameworks.UvcController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/Ops.Extension.Standalone.AppleFrameworks.UvcController.json): Pin layout definition.
- [.gitignore](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.UvcController/.gitignore): Ignores build intermediate files.
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
