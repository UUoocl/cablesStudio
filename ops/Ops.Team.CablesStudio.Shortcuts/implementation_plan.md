# Implementation Plan - Apple Shortcuts Integration Op

This plan outlines the design and implementation of the `Ops.Team.CablesStudio.Shortcuts` operator. The operator will open a dedicated child window, execute Apple Shortcuts via a hidden iframe using the `shortcuts://` URI protocol, and receive results injected from macOS JavaScript for Automation (JXA) back through a `BroadcastChannel`.

## User Review Required

> [!IMPORTANT]
> Since JXA executes javascript inside target browser windows, the browser running Cables must support execution of scripts via JXA.
> - **Google Chrome**: Requires enabling "Allow JavaScript from AppleEvents" in the **Developer** menu.
> - **Safari**: Requires enabling "Allow JavaScript from AppleEvents" in the **Develop** menu.

## Proposed Changes

### Cables Studio Operator (Ops.Team.CablesStudio.Shortcuts)

We will create two files in `ops/Ops.Team.CablesStudio.Shortcuts/`:
1. `Ops.Team.CablesStudio.Shortcuts.json` (metadata for cables studio)
2. `Ops.Team.CablesStudio.Shortcuts.js` (logic)

---

### [Component Name] Cables Studio Op

#### [NEW] [Ops.Team.CablesStudio.Shortcuts.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.Shortcuts/Ops.Team.CablesStudio.Shortcuts.json)
This JSON file defines the operator's metadata, category, and ports list.

#### [NEW] [Ops.Team.CablesStudio.Shortcuts.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.Shortcuts/Ops.Team.CablesStudio.Shortcuts.js)
This file defines the Cables operator. It handles:
- Opening the child window with a custom HTML template.
- Injecting the Broadcast Channel Name and UUID.
- Setting up the host Broadcast Channel to listen for results.
- Sending a trigger command over the Broadcast Channel when the shortcut execution is requested.
- Exposing the result object and trigger output ports when the result is returned.
- Documenting the JXA scripts that the user should run from their Shortcut.

The HTML template rendered in the child window will:
- Set `window.location.hash = UUID`.
- Render a premium UI showing status (Active UUID, status, connection ready).
- Set up a hidden `iframe` for launching the `shortcuts://` scheme.
- Expose a global `window.receiveJxaResult` callback function.
- Forward received results back to the parent op via the `BroadcastChannel`.

## Verification Plan

### Manual Verification
1. We will verify the creation of the files and structure.
2. We will check that the Cables operator defines the correct ports:
   - **Inputs**: `UUID`, `ShortcutName`, `Data`, `Open Window`, `Close Window`, `Broadcast channel name`, `send shortcut request`.
   - **Outputs**: `Shortcut Result Object`, `On Result Received`, `Window Status`, `Error`.
3. We will write a test HTML or run a quick syntax verification to ensure the generated JS code is syntactically valid.
