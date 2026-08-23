# Ops.Extension.Standalone.AppleFrameworks.EightBitDoXbox

This operator provides a native, high-performance interface for **8BitDo controllers in Xbox Mode** under a standalone Electron environment on macOS using Apple's IOKit USB framework.

---

> [!WARNING]
> **Wired USB Connection Required**: Because this operator communicates directly via low-level raw USB IOKit interface pipes (matching Vendor ID `0x2dc8` and Product ID `0x2008`), **the controller must be connected directly via a USB cable**.
> If connected via Bluetooth, macOS routes it through standard HID drivers, which bypasses the raw USB IOKit interface, and this operator will not detect the device.

---

## 1. Features
- Natively reads axis values (Left Stick, Right Stick, Left Trigger, Right Trigger).
- Decodes all standard buttons (A, B, X, Y, Menu, View, Guide, Share, DPad, Shoulders, Thumb clicks).
- Supports sending haptic feedback / rumble commands directly to all 4 rumble motors.

## 2. Troubleshooting & Compilation
If the native Node addon is not loaded, rebuild it using `node-gyp`:
```bash
cd ops/Ops.Extension.Standalone.AppleFrameworks/Ops.Extension.Standalone.AppleFrameworks.EightBitDoXbox
npm install node-addon-api --no-save
npx node-gyp rebuild --target=31.7.3 --dist-url=https://electronjs.org/headers
```
