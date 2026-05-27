# SwiftKeyboardController

Emits virtual keyboard keystrokes and modifier key combinations globally on macOS using CGEvent synthesis and a high-performance native background sidecar process.

## Description

This operator utilizes a private WebSocket server to send text commands to a compiled macOS Swift sidecar executable. The sidecar synthesizes the virtual key-down and key-up events using CoreGraphics C-APIs (`CGEvent`) and posts them globally to the macOS Window Server.

This allows Cables standalone applications to control external macOS applications, trigger global OS shortcuts, automate presentations (such as Keynote/PowerPoint), or emulate standard keyboard interfaces.

## Inputs

* **Active**: Starts or stops the native Swift KeyboardController sidecar process and its WebSocket server.
* **Emit**: Fires a trigger to synthesize and emit the virtual keystroke globally.
* **Keystroke Object**: A JSON object specifying the keystroke parameters. It must contain:
  - `key` (String): The keyboard key character or label to press (e.g. `"a"`, `"space"`, `"return"`, `"escape"`, `"left"`).
  - `modifier` / `modifiers` (String, Optional): Modifiers to hold (e.g. `"cmd"`, `"shift"`, `"cmd + shift"`, `"None"`).

  **Example Keystroke Objects:**
  ```json
  {
    "key": "a",
    "modifiers": "cmd + shift"
  }
  ```
  ```json
  {
    "key": "space"
  }
  ```

## Outputs

* **Emitted Keystroke**: The formatted string of the last successfully emitted key and modifier combination (e.g. `cmd + shift + a`).
* **On Emitted**: Fires a trigger every time a virtual keystroke is successfully emitted globally.
* **Running**: True if the native keyboard control sidecar process is running.
* **Status**: Human-readable status of the Swift sidecar process (e.g. Spawning, Running, Stopped).

---

## Modifiers and Keys

The sidecar performs case-insensitive parsing and supports flexible formats for keys and modifiers:

### Supported Modifiers
Modifiers can be separated by spaces, commas, or `+` signs.
* **Command / Cmd**: `cmd`, `command`, `⌘`
* **Shift**: `shift`, `⇧`
* **Option / Alt**: `alt`, `option`, `opt`, `⌥`
* **Control / Ctrl**: `ctrl`, `control`, `⌃`

### Supported Keys
* **Letters & Numbers**: `a` to `z` and `0` to `9`
* **Special Keys**: `space`, `return`, `enter`, `tab`, `escape` (or `esc`), `delete` (backspace), `clear`
* **Arrow Keys**: `left`, `right`, `up`, `down`
* **Navigation Keys**: `home`, `end`, `pageup` (or `pgup`), `pagedown` (or `pgdn`)
* **Function Keys**: `f1` through `f20`
* **Symbols**: `=`, `-`, `[`, `]`, `'`, `;`, `\`, `,`, `.`, `/`, `` ` ``

---

## System Requirements & Accessibility Entitlements

> [!IMPORTANT]
> Synthesizing global virtual keystrokes requires macOS Accessibility entitlements.
> When executing, you may be prompted to allow the parent application (Cables Studio or the exported standalone binary) in:
> **System Settings ➔ Privacy & Security ➔ Accessibility**
> If the keystroke fails to emit, ensure this permission is turned ON for the parent application.

---

## Technical Details & Performance Optimizations

1. **HID Integration**: Keystroke synthesis is injected directly into the Human Interface Device (HID) layer using `CGEvent.post(tap: .cghidEventTap)`. This ensures that virtual keystrokes behave exactly like physical hardware inputs and are received by whatever window has active system focus.
2. **Strict Concurrency Safety**: The native Swift codebase is built under Swift 6's compilation specifications, ensuring thread safety and strict concurrency isolation without memory race conditions.
3. **Automatic Orphan Garbage Collection**: The native sidecar monitors its parent process PID. If the parent Cables application exits, the sidecar instantly self-terminates (`getppid() == 1`), avoiding background zombie processes.
