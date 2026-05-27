# SwiftHumanPose2d

Captures 2D human body pose landmarks in real-time from a WebGL texture using native macOS Apple Vision neural models and a high-performance background sidecar process.

## Description

This operator utilizes a private WebSocket server to pipe downsampled WebGL frames to a compiled macOS Swift sidecar executable. The sidecar feeds the frames to the Apple Vision framework (`VNDetectHumanBodyPoseRequest`) for ultra-low latency, hardware-accelerated 2D pose tracking. 

It outputs a highly detailed, structured array of joints, including coordinate mappings (aligned directly to WebGL top-left screen coordinates) and confidence levels.

## Inputs

* **Active**: Starts or stops the native Swift HumanPose2d sidecar process.
* **Render**: Trigger rendering loop to process the incoming texture.
* **Texture**: WebGL input texture containing the subject to track.

## Outputs

* **Poses Array**: An array of detected pose objects.
* **Detected Poses**: Number of body poses currently detected in the active frame.
* **On Poses Detected**: Fires a trigger every time a new set of pose landmarks is received.
* **Running**: True if the native pose-tracking sidecar is running in the background.
* **Status**: Human-readable status of the sidecar daemon (e.g. Spawning, Running, Stopped).

---

## Output Data Structure

The **Poses Array** outputs an array of tracked person objects formatted as follows:

```json
[
  {
    "confidence": 0.9482,
    "joints": {
      "nose_joint": { "x": 0.501, "y": 0.320, "confidence": 0.99 },
      "neck_joint": { "x": 0.498, "y": 0.425, "confidence": 0.95 },
      "left_shoulder_joint": { "x": 0.380, "y": 0.440, "confidence": 0.90 },
      "right_shoulder_joint": { "x": 0.615, "y": 0.442, "confidence": 0.91 },
      "left_elbow_joint": { "x": 0.320, "y": 0.580, "confidence": 0.85 },
      "right_elbow_joint": { "x": 0.675, "y": 0.582, "confidence": 0.86 },
      "left_wrist_joint": { "x": 0.290, "y": 0.700, "confidence": 0.80 },
      "right_wrist_joint": { "x": 0.710, "y": 0.702, "confidence": 0.81 },
      "left_hip_joint": { "x": 0.420, "y": 0.680, "confidence": 0.75 },
      "right_hip_joint": { "x": 0.580, "y": 0.682, "confidence": 0.76 },
      "left_knee_joint": { "x": 0.400, "y": 0.820, "confidence": 0.70 },
      "right_knee_joint": { "x": 0.600, "y": 0.822, "confidence": 0.71 },
      "left_ankle_joint": { "x": 0.390, "y": 0.950, "confidence": 0.65 },
      "right_ankle_joint": { "x": 0.610, "y": 0.952, "confidence": 0.66 },
      "left_eye_joint": { "x": 0.470, "y": 0.290, "confidence": 0.98 },
      "right_eye_joint": { "x": 0.530, "y": 0.290, "confidence": 0.98 },
      "left_ear_joint": { "x": 0.440, "y": 0.310, "confidence": 0.92 },
      "right_ear_joint": { "x": 0.560, "y": 0.310, "confidence": 0.92 },
      "root_joint": { "x": 0.500, "y": 0.680, "confidence": 0.80 }
    }
  }
]
```

### Coordinates Mapping
The sidecar automatically maps Vision's standard normalized coordinate system (where bottom-left is `0.0, 0.0`) to standard **top-left Cartesian screen coordinates** (`y = 1.0 - y`) to make visual overlays simple and straight-forward out-of-the-box in Cables Studio.

---

## Technical Details & Performance Optimizations

1. **GPU Downsample Blitting**: Reading full-size 1080p or 4k camera textures from the GPU (using `gl.readPixels`) blocks the WebGL rendering queue. To solve this, the operator performs a high-efficiency **GPU Framebuffer Blit** to downsample the texture to a maximum 384px dimension before reading the pixels. This reduces raw GPU-to-CPU transfer data size by over 95%, keeping frame times under **2ms**.
2. **Double-Buffered Backpressure Control**: The operator tracks if the background sidecar is still busy processing a previous frame. If a new trigger is received while a frame is in-flight, it immediately skips upload rather than queueing, preventing frame lag or buffer buildup.
3. **Automatic Orphan Garbage Collection**: The native binary listens for parent process termination (`getppid() == 1`). If the parent Cables editor exits, the sidecar instantly self-terminates to avoid leaking background process daemons.
