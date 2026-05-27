# SwiftHumanPose3d

Captures 3D human body pose skeletal joint landmarks and estimated height in real-world metric space in real-time from a WebGL texture using native macOS Apple Vision neural models and a high-performance background sidecar process.

## Description

This operator utilizes a private WebSocket server to pipe downsampled WebGL frames to a compiled macOS Swift sidecar executable. The sidecar feeds the frames to the Apple Vision framework (`VNDetectHumanBodyPose3DRequest`) for ultra-low latency, hardware-accelerated 3D pose tracking (macOS 14.0+ required).

It outputs a highly detailed, structured 3D skeletal array of joints with positions in real-world meters relative to the camera (`x`, `y`, `z`) and an estimated absolute body height.

## Inputs

* **Active**: Starts or stops the native Swift HumanPose3d sidecar process.
* **Render**: Trigger rendering loop to process the incoming texture.
* **Texture**: WebGL input texture containing the subject to track.

## Outputs

* **Poses Array**: An array of detected 3D pose objects.
* **Detected Poses**: Number of human bodies currently tracked in the active frame.
* **On Poses Detected**: Fires a trigger every time a new set of 3D pose landmarks is received.
* **Running**: True if the native 3D pose-tracking sidecar is running in the background.
* **Status**: Human-readable status of the sidecar daemon (e.g. Spawning, Running, Stopped).

---

## Output Data Structure

The **Poses Array** outputs an array of tracked person objects formatted as follows:

```json
[
  {
    "confidence": 0.9610,
    "bodyHeight": 1.745,
    "joints": {
      "root_joint": { "x": 0.015, "y": -0.220, "z": 2.150, "confidence": 1.0 },
      "hips_joint": { "x": 0.014, "y": -0.190, "z": 2.152, "confidence": 1.0 },
      "spine_joint": { "x": 0.012, "y": -0.050, "z": 2.158, "confidence": 1.0 },
      "chest_joint": { "x": 0.010, "y": 0.120, "z": 2.164, "confidence": 1.0 },
      "neck_joint": { "x": 0.008, "y": 0.280, "z": 2.170, "confidence": 1.0 },
      "head_joint": { "x": 0.007, "y": 0.420, "z": 2.172, "confidence": 1.0 },
      
      "left_shoulder_joint": { "x": -0.180, "y": 0.210, "z": 2.140, "confidence": 1.0 },
      "right_shoulder_joint": { "x": 0.190, "y": 0.211, "z": 2.142, "confidence": 1.0 },
      "left_elbow_joint": { "x": -0.260, "y": -0.010, "z": 2.080, "confidence": 1.0 },
      "right_elbow_joint": { "x": 0.270, "y": -0.012, "z": 2.082, "confidence": 1.0 },
      "left_wrist_joint": { "x": -0.310, "y": -0.180, "z": 2.010, "confidence": 1.0 },
      "right_wrist_joint": { "x": 0.320, "y": -0.182, "z": 2.012, "confidence": 1.0 },
      
      "left_hip_joint": { "x": -0.090, "y": -0.210, "z": 2.148, "confidence": 1.0 },
      "right_hip_joint": { "x": 0.090, "y": -0.210, "z": 2.148, "confidence": 1.0 },
      "left_knee_joint": { "x": -0.100, "y": -0.580, "z": 2.120, "confidence": 1.0 },
      "right_knee_joint": { "x": 0.100, "y": -0.582, "z": 2.122, "confidence": 1.0 },
      "left_ankle_joint": { "x": -0.110, "y": -0.920, "z": 2.090, "confidence": 1.0 },
      "right_ankle_joint": { "x": 0.110, "y": -0.922, "z": 2.092, "confidence": 1.0 }
    }
  }
]
```

### Coordinate Space Definition (Metric Camera Space)
The `x`, `y`, and `z` values represent real-world metric coordinates in **meters** relative to the physical camera lens origin `(0, 0, 0)`:
* **`x`**: Horizontal offset (negative values are to the camera's left, positive to the right).
* **`y`**: Vertical offset (negative values are below the camera center, positive values above).
* **`z`**: Depth offset (positive distance in meters away from the camera).
* **`bodyHeight`**: Estimated height of the tracked skeleton in meters (e.g. `1.745` meters).

---

## Technical Details & Performance Optimizations

1. **GPU Downsample Blitting**: Reading full-size camera textures from the GPU blocks the WebGL rendering queue. To solve this, the operator performs a high-efficiency **GPU Framebuffer Blit** to downsample the texture to a maximum 384px dimension before reading the pixels. This reduces raw transfer data size by over 95%, keeping frame times under **2ms**.
2. **Double-Buffered Backpressure Control**: The operator tracks if the background sidecar is still busy processing a previous frame. If a new trigger is received while a frame is in-flight, it immediately skips upload rather than queueing, preventing frame lag or buffer buildup.
3. **Automatic Orphan Garbage Collection**: The native binary listens for parent process termination (`getppid() == 1`). If the parent Cables editor exits, the sidecar instantly self-terminates to avoid leaking background process daemons.
