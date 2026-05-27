# SwiftHumanFace

Captures 2D human facial landmarks, bounding boxes, and head orientation (roll, yaw, pitch) in real-time from a WebGL texture using native macOS Apple Vision neural models and a high-performance background sidecar process.

## Description

This operator utilizes a private WebSocket server to pipe downsampled WebGL frames to a compiled macOS Swift sidecar executable. The sidecar feeds the frames to the Apple Vision framework (`VNDetectFaceLandmarksRequest`) for ultra-low latency, hardware-accelerated 2D face tracking (macOS 14.0+ required).

It outputs a highly detailed, structured array of faces containing bounding boxes, roll/yaw/pitch angles, and normalized landmark coordinate lists for key facial regions (eyes, eyebrows, nose, lips, jaw contour, pupils).

## Inputs

* **Active**: Starts or stops the native Swift HumanFace sidecar process.
* **Render**: Trigger rendering loop to process the incoming texture.
* **Texture**: WebGL input texture containing the subject's face to track.

## Outputs

* **Faces Array**: An array of detected face objects.
* **Detected Faces**: Number of human faces currently tracked in the active frame.
* **On Faces Detected**: Fires a trigger every time a new set of facial landmarks is received.
* **Running**: True if the native face-tracking sidecar is running in the background.
* **Status**: Human-readable status of the sidecar daemon (e.g. Spawning, Running, Stopped).

---

## Output Data Structure

The **Faces Array** outputs an array of tracked face objects formatted as follows:

```json
[
  {
    "confidence": 0.9992,
    "roll": 2.45,
    "yaw": -0.89,
    "pitch": 0.12,
    "boundingBox": {
      "x": 0.354,
      "y": 0.210,
      "w": 0.285,
      "h": 0.380
    },
    "landmarks": {
      "faceContour": [
        { "x": 0.354, "y": 0.298 },
        { "x": 0.362, "y": 0.342 }
      ],
      "leftEye": [
        { "x": 0.421, "y": 0.312 },
        { "x": 0.445, "y": 0.315 }
      ],
      "rightEye": [
        { "x": 0.518, "y": 0.311 },
        { "x": 0.542, "y": 0.314 }
      ],
      "leftEyebrow": [
        { "x": 0.405, "y": 0.278 }
      ],
      "rightEyebrow": [
        { "x": 0.535, "y": 0.276 }
      ],
      "nose": [
        { "x": 0.481, "y": 0.355 }
      ],
      "noseCrest": [
        { "x": 0.480, "y": 0.310 }
      ],
      "medianLine": [
        { "x": 0.481, "y": 0.290 }
      ],
      "outerLips": [
        { "x": 0.445, "y": 0.460 }
      ],
      "innerLips": [
        { "x": 0.455, "y": 0.460 }
      ],
      "leftPupil": [
        { "x": 0.433, "y": 0.313 }
      ],
      "rightPupil": [
        { "x": 0.530, "y": 0.312 }
      ]
    }
  }
]
```

### Coordinate Space Definition (Screen Cartesian Space)
All point coordinates (`x` and `y` in both the `boundingBox` and `landmarks` groups) are normalized from `0.0` to `1.0` and mapped to standard top-left screen Cartesian coordinates used in WebGL and Cables:
* **`x`**: Normalized horizontal position (where `0.0` is the left edge of the image and `1.0` is the right edge).
* **`y`**: Normalized vertical position (where `0.0` is the top edge of the image and `1.0` is the bottom edge).

### Face Orientation
* **`roll`**: In-plane rotation angle (rotation around the z-axis, tilting head left/right).
* **`yaw`**: Out-of-plane horizontal rotation angle (rotation around the y-axis, shaking head left/right).
* **`pitch`**: Out-of-plane vertical rotation angle (rotation around the x-axis, nodding head up/down).

---

## Technical Details & Performance Optimizations

1. **GPU Downsample Blitting**: Reading full-size camera textures from the GPU blocks the WebGL rendering queue. To solve this, the operator performs a high-efficiency **GPU Framebuffer Blit** to downsample the texture to a maximum 384px dimension before reading the pixels. This reduces raw transfer data size by over 95%, keeping frame times under **2ms**.
2. **Double-Buffered Backpressure Control**: The operator tracks if the background sidecar is still busy processing a previous frame. If a new trigger is received while a frame is in-flight, it immediately skips upload rather than queueing, preventing frame lag or buffer buildup.
3. **Automatic Orphan Garbage Collection**: The native binary listens for parent process termination (`getppid() == 1`). If the parent Cables editor exits, the sidecar instantly self-terminates to avoid leaking background process daemons.
