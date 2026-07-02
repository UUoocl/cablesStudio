# Walkthrough - Create Native AppleFrameworks Mouse Monitor & Controller Addons

We implemented the native mouse monitor (`Ops.Extension.Standalone.AppleFrameworks.MouseMonitor`) and mouse controller (`Ops.Extension.Standalone.AppleFrameworks.MouseController`) operators as self-contained Node-API addons written in Objective-C++, avoiding the need for helper Swift binary sidecar processes and WebSockets.

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
