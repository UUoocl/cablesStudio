# STG Cylinder (Headless & Remote Controlled)

This version of the Space Type Generator (Cylinder) is designed for headless rendering within a Cables `IframeCanvasCopy` operator and remote control via a `BcPubSub` (BroadcastChannel) operator.

## Integration

1. **Host URL**: `http://127.0.0.1:8080/Ops.User.IframeCanvasCopy/space_type_generator/cylinder/index.html?channel=YOUR_CHANNEL_NAME`
2. **Control**: Use the `Ops.User.BroadcastChannel.BcPubSub` operator in Cables with the same channel name to send settings objects.

## Settings Schema

All values are optional. The sketch updates only the keys provided in the JSON object.

| Key | Type | Description | Range |
| :--- | :--- | :--- | :--- |
| `text` | `string` | The text content to render | Any |
| `preset` | `string` | Apply a predefined visual style | `simple`, `jellyfish`, `crown`, `complex`, `weave`, `zebra`, `hoops`, `pride`, `reset` |
| `radius` | `number` | Cylinder radius | 0 - 1000 |
| `stackNum` | `number` | Number of text rings in the stack | 1 - 30 |
| `rRotate` | `number` | Constant rotation speed | -100 - 100 |
| `rOffset` | `number` | Step rotation between rings | 0 - 1.57 (PI/2) |
| `rWaveCount` | `number` | Number of wave peaks | 0 - 10 |
| `rWaveSpeed` | `number` | Speed of wave animation | 0 - 100 |
| `rWave` | `number` | Latitude wave intensity | 0 - 200 |
| `rZaxis` | `number` | Ripple/Depth intensity | 0 - 100 |
| `strecherX` | `number` | Horizontal wave scaling | 0 - 80 |
| `strecherY` | `number` | Vertical wave scaling | 0 - 100 |
| `typeX` | `number` | Font width scaling | 0 - 100 |
| `typeY` | `number` | Font height scaling | 0 - 100 |
| `typeStroke` | `number` | Outline thickness | 0 - 10 |
| `xRotCamera` | `number` | Camera X rotation | -180 - 180 |
| `yRotCamera` | `number` | Camera Y rotation | -180 - 180 |
| `zRotCamera` | `number` | Camera Z rotation | -180 - 180 |
| `zoomCamera` | `number` | Camera zoom (Z-translate) | -500 - 500 |
| `bkgdColor` | `string` | Background color (Hex) | e.g. "#FF0000" |
| `color1` | `string` | Text/Stroke color (Hex) | e.g. "#000000" |

## Example Payload

Copy this into a Cables **Object** node and send it to the `BcPubSub` operator:

```json
{
  "preset": "jellyfish",
  "text": "MODERNIZED",
  "zoomCamera": -100
}
```

```json
{
  "text": "CABLES.GL",
  "radius": 350,
  "stackNum": 5,
  "rRotate": -15,
  "rOffset": 0.25,
  "rWaveSpeed": 40,
  "rWave": 20,
  "typeX": 25,
  "typeY": 50,
  "typeStroke": 1.5,
  "xRotCamera": 20,
  "bkgdColor": "#000000",
  "color1": "#00FF00"
}
```

## Internal Bridge Logic

- **ImageBitmap Transfer**: The sketch calls `captureFrame()` every frame to send `ImageBitmap` data to the parent window via `postMessage`.
- **Dynamic Resizing**: The sketch listens for `resize` messages from the parent to call `resizeCanvas()` without a reload.
