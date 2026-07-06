# Ops.Extension.Standalone.SwiftSidecars.ActiveApp

This operator monitors the active frontmost application and its window title on macOS. It runs a completely self-contained background sidecar process (`CablesActiveAppMonitor`) and streams updates over a local WebSocket connection.

---

## 1. Native Architectural Design

```
┌────────────────────────────────────────────────────────┐
│                   Cables GL Patch UI                   │
│          (Electron Standalone WebGL Context)           │
└────────────────────────────────────────────────────────┘
    │                                              ▲
    │ 1. Active = true starts private server       │ 4. Streams active app info
    │    & spawns sidecar monitor daemon           │    as JSON (AppName, PID,
    ▼                                              │    BundleID, WindowTitle)
┌────────────────────────────────────────────────────────┐
│              Private Local WS Connection               │
│          (Direct, zero middleman middle-pipe)         │
└────────────────────────────────────────────────────────┘
    ▲                                              │
    │ 2. Queries NSWorkspace.shared.frontmostApp   │ 3. Compares with last values
    │    and CGWindowListCopyWindowInfo            │    on timer tick
    ▼                                              ▼
┌────────────────────────────────────────────────────────┐
│                     macOS CoreServices                 │
│                 (WindowServer & Workspace)             │
└────────────────────────────────────────────────────────┘
```

1. **Private Local Pipe**: The JS operator spins up a private WebSocket server on a dynamically allocated local port and spawns the `CablesActiveAppMonitor` background daemon with `--port <port>` arguments.
2. **Application State Querying**: The Swift sidecar queries `NSWorkspace.shared.frontmostApplication` for active application properties (localized name, bundle identifier, process ID).
3. **Window Title Extraction**: The sidecar uses `CGWindowListCopyWindowInfo` to extract the active window title of the frontmost application.
4. **Change Detection**: State checks are executed periodically (default 500ms). When a change in the application or window title is detected, the sidecar pushes a JSON message back to the Cables editor.

---

## 2. Compilation & Building

To compile the Swift binary, run:
```bash
cd ops/Ops.Extension.Standalone.SwiftSidecars/Ops.Extension.Standalone.SwiftSidecars.ActiveApp
swift build -c release
mkdir -p swift_bin
cp .build/release/CablesActiveAppMonitor swift_bin/CablesActiveAppMonitor
```

---

## 3. Permissions

- Getting active application info (name, bundle ID, PID) does not require any special macOS permissions.
- To get window titles (such as tab names in browsers, file names in editors), the host app (e.g. Electron) must have **Screen Recording** permissions. If not granted, window title will be returned as an empty string.
