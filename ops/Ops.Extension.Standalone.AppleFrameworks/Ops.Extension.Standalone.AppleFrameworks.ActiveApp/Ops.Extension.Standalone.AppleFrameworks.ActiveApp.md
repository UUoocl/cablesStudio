# Ops.Extension.Standalone.AppleFrameworks.ActiveApp

This operator monitors the active frontmost application and its window title on macOS using a native Node Addon (N-API).

---

## 1. Native Architectural Design

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│          (Electron Standalone WebGL Context)           │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Active = true starts polling interval     │ 3. Returns active app details
    │    and calls native getActiveApp()           │    synchronously (name, pid,
    ▼                                              │    bundleID, windowTitle)
┌────────────────────────────────────────────────────────┐
│                   active_app.node                      │
│             (Direct native N-API Addon)                │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 2. Queries AppKit & CoreGraphics APIs        │ 2. Converts Objective-C strings
    ▼                                              │    to Napi::String objects
┌────────────────────────────────────────────────────────┐
│                     macOS CoreServices                 │
│                 (WindowServer & Workspace)             │
└────────────────────────────────────────────────────────┘
```

1. **Direct Native Interface**: The JS operator loads the `active_app.node` compiled binary directly. No child processes are spawned, and no WebSockets/network sockets are allocated.
2. **AppKit Integration**: The C++ code queries `[NSWorkspace sharedWorkspace].frontmostApplication` and `CGWindowListCopyWindowInfo` directly on the main thread, wrapping the result inside Node.js objects.
3. **Synchronous Polling**: Node.js polls the native method at the specified interval (default 500ms).

---

## 2. Compilation & Building

To compile the native Node addon, run:
```bash
cd ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.ActiveApp
npm install node-addon-api --no-save
npx node-gyp rebuild --target=31.7.3 --dist-url=https://electronjs.org/headers
```

---

## 3. Permissions

- Active application details (name, bundle ID, PID) are permission-free.
- Window title querying (`kCGWindowName`) requires **Screen Recording** permissions in macOS. If permission is not granted, window title will be returned as an empty string.
