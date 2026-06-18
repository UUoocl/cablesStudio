# Standalone Swift Operators - Walkthrough

This document summarizes the native compiled Swift standalone operators developed to replicate the Python-based hardware operators in Cables.

---

## 1. Stream Deck Operators

We replicated the three Python-based Stream Deck operators as native Swift operators communicating over WebSockets.

### Components
*   **Main Operator (`SwiftStreamDeck`)**:
    *   Location: [Ops.Extension.Standalone.Swift.SwiftStreamDeck](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftStreamDeck/)
    *   JS code: [Ops.Extension.Standalone.Swift.SwiftStreamDeck.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftStreamDeck/Ops.Extension.Standalone.Swift.SwiftStreamDeck.js)
    *   Config: [Ops.Extension.Standalone.Swift.SwiftStreamDeck.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftStreamDeck/Ops.Extension.Standalone.Swift.SwiftStreamDeck.json)
    *   Swift Sidecar: Binary compiled in release mode to `swift_bin/SwiftStreamDeck` from embedded packages (`Codedeck` & `HIDSwift`).
*   **Key Texture Operator (`SwiftStreamDeckKeyTexture`)**:
    *   Location: [Ops.Extension.Standalone.Swift.SwiftStreamDeckKeyTexture](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftStreamDeckKeyTexture/)
    *   Logic: Extracts, scales, and Y-flips WebGL texture to a 72x72 / 96x96 base64 JPEG, sending it to the sidecar.
*   **Stretched Texture Operator (`SwiftStreamDeckStretchedTexture`)**:
    *   Location: [Ops.Extension.Standalone.Swift.SwiftStreamDeckStretchedTexture](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftStreamDeckStretchedTexture/)
    *   Logic: Scales WebGL texture to full key matrix canvas, sending one large base64 JPEG to the sidecar for native slicing.

---

## 2. Soomfon Stream Controller Operators

We replicated the three Python-based Soomfon Stream Controller SE (Ajazz AKP03E clone) operators as native Swift standalone operators.

### Components
*   **Main Operator (`SwiftSoomfonController`)**:
    *   Location: [Ops.Extension.Standalone.Swift.SwiftSoomfonController](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/)
    *   JS code: [Ops.Extension.Standalone.Swift.SwiftSoomfonController.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/Ops.Extension.Standalone.Swift.SwiftSoomfonController.js)
    *   Config: [Ops.Extension.Standalone.Swift.SwiftSoomfonController.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonController/Ops.Extension.Standalone.Swift.SwiftSoomfonController.json)
    *   Swift Sidecar: Pre-compiled release binary deployed to `swift_bin/SwiftSoomfonController`.
*   **Key Texture Operator (`SwiftSoomfonKeyTexture`)**:
    *   Location: [Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture/)
    *   JS code: [Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture/Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture.js)
    *   Config: [Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture/Ops.Extension.Standalone.Swift.SwiftSoomfonKeyTexture.json)
*   **Stretched Texture Operator (`SwiftSoomfonStretchedTexture`)**:
    *   Location: [Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture/)
    *   JS code: [Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture.js](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture/Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture.js)
    *   Config: [Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture.json](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture/Ops.Extension.Standalone.Swift.SwiftSoomfonStretchedTexture.json)

### Implementation Highlights
*   **Physical Orientation Correction**: Rotates images 270 degrees (90 CCW) using hardware-accelerated `CGContext` rotation.
*   **USB Double-Open Wake Sequence**: Programmed dynamic reset sequence to ensure reliable hardware initialization.
*   **Asynchronous HID Monitoring**: Utilizes Apple's `IOHIDManager` runloop scheduling for thread-safe input reports (dial turn directions, dial clicks, and button state presses).

---

## 3. Verification & Testing Instructions

### Step 1: Interface Exclusivity
*   Close official StreamDock, Soomfon, and Elgato companion applications to release the exclusive locks on USB HID interfaces.

### Step 2: Running Operators in Cables
1.  Place the main controller operator (`SwiftStreamDeck` or `SwiftSoomfonController`) in the patch.
2.  Set `Active` to `true`.
3.  Verify the status changes to `Connected` and that dial/knob values change when manipulated.
4.  Attach texture mapping operators to map textures directly onto the display keys.
