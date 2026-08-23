# Ops.Extension.Standalone.MacOs.Hid.StreamDeck

Native macOS IOKit / `IOHIDManager` controller for Elgato Stream Deck devices in Cables Standalone.

---

## Description
Communicates directly with connected Elgato hardware via Apple's native `IOKit` framework, bypassing browser sandbox permissions with zero `main.js` configuration.

Supports:
- **Stream Deck V1 / V2 / MK.2** (15 keys)
- **Stream Deck Mini V1 / V2** (6 keys)
- **Stream Deck XL V1 / Gen 2** (32 keys)
- **Stream Deck Plus** (8 keys + 4 rotary encoders + LCD touch strip)
- **Stream Deck Pedal** (3 foot pedals)

---

## Ports

### Inputs
* **`Active`**: Connect or disconnect from the hardware.
* **`Device Index`**: Index if multiple Stream Deck devices are connected.
* **`Brightness`**: Display backlight brightness (`0` to `100`).
* **`Clear All Keys`**: Resets and clears all key screens to black.

### Outputs
* **`Connection`**: Connection handle passed downstream to `StreamDeckKeyTexture`.
* **`Is Connected`**: `true` when hardware is opened and active.
* **`Status`**: Diagnostic state string.
* **`Device Info`**: Hardware metadata (key count, icon resolution, product name).
* **`Key Event`**: Trigger fired on any hardware button press or release.
* **`Event Key Index`**: Zero-based key index (`0` to `keyCount - 1`).
* **`Event Pressed`**: `true` when pressed, `false` when released.
* **`Dial Event`**: Trigger fired on rotary dial turns or clicks (Stream Deck Plus).
* **`Dial Index`**: Dial index (`0` to `3`).
* **`Dial Value`**: Direction (`+1` clockwise, `-1` counter-clockwise).
* **`Dial Pressed`**: `true` if dial knob is pushed.
* **`Touchpad Event`**: Trigger fired on LCD touchscreen interaction.
* **`Touchpad Data`**: Touch coordinates and gesture payload.
