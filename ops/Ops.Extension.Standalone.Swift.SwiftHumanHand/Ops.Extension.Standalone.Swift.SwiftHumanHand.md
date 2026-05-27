# SwiftHumanHand

Captures 2D human hand joints, fingers, and chirality (left/right hand) in real-time from a WebGL texture using native macOS Apple Vision neural models and a high-performance background sidecar process.

## Description

This operator utilizes a private WebSocket server to pipe downsampled WebGL frames to a compiled macOS Swift sidecar executable. The sidecar feeds the frames to the Apple Vision framework (`VNDetectHumanHandPoseRequest`) for ultra-low latency, hardware-accelerated 2D hand landmark tracking (supporting up to 2 hands simultaneously). 

It outputs detailed finger joint arrays including chirality (`left` / `right` hand classification) and coordinate mappings directly aligned to WebGL top-left screen coordinates.

## Inputs

* **Active**: Starts or stops the native Swift HumanHand sidecar process.
* **Render**: Trigger rendering loop to process the incoming texture.
* **Texture**: WebGL input texture containing the hands to track.

## Outputs

* **Hands Array**: An array of detected hand objects.
* **Detected Hands**: Number of hands currently tracked in the active frame (0 to 2).
* **On Hands Detected**: Fires a trigger every time a new set of hand landmarks is received.
* **Running**: True if the native hand-tracking sidecar is running in the background.
* **Status**: Human-readable status of the sidecar daemon (e.g. Spawning, Running, Stopped).

---

## Output Data Structure

The **Hands Array** outputs an array of tracked hand objects formatted as follows:

```json
[
  {
    "confidence": 0.9621,
    "chirality": "right",
    "joints": {
      "wrist": { "x": 0.510, "y": 0.850, "confidence": 0.99 },
      
      "thumb_CMC": { "x": 0.460, "y": 0.810, "confidence": 0.90 },
      "thumb_MP": { "x": 0.410, "y": 0.740, "confidence": 0.92 },
      "thumb_IP": { "x": 0.380, "y": 0.670, "confidence": 0.93 },
      "thumb_tip": { "x": 0.360, "y": 0.610, "confidence": 0.95 },
      
      "index_MCP": { "x": 0.440, "y": 0.630, "confidence": 0.96 },
      "index_PIP": { "x": 0.420, "y": 0.520, "confidence": 0.95 },
      "index_DIP": { "x": 0.410, "y": 0.450, "confidence": 0.94 },
      "index_tip": { "x": 0.400, "y": 0.390, "confidence": 0.98 },
      
      "middle_MCP": { "x": 0.500, "y": 0.620, "confidence": 0.97 },
      "middle_PIP": { "x": 0.490, "y": 0.490, "confidence": 0.96 },
      "middle_DIP": { "x": 0.480, "y": 0.410, "confidence": 0.95 },
      "middle_tip": { "x": 0.470, "y": 0.340, "confidence": 0.99 },
      
      "ring_MCP": { "x": 0.560, "y": 0.640, "confidence": 0.95 },
      "ring_PIP": { "x": 0.560, "y": 0.520, "confidence": 0.94 },
      "ring_DIP": { "x": 0.560, "y": 0.450, "confidence": 0.93 },
      "ring_tip": { "x": 0.560, "y": 0.390, "confidence": 0.96 },
      
      "little_MCP": { "x": 0.610, "y": 0.680, "confidence": 0.91 },
      "little_PIP": { "x": 0.630, "y": 0.580, "confidence": 0.90 },
      "little_DIP": { "x": 0.640, "y": 0.520, "confidence": 0.89 },
      "little_tip": { "x": 0.650, "y": 0.470, "confidence": 0.92 }
    }
  }
]
```

### Tracked Joint Nomenclature
* **Wrist**: `wrist`
* **Thumb**: `thumb_CMC`, `thumb_MP`, `thumb_IP`, `thumb_tip`
* **Index Finger**: `index_MCP`, `index_PIP`, `index_DIP`, `index_tip`
* **Middle Finger**: `middle_MCP`, `middle_PIP`, `middle_DIP`, `middle_tip`
* **Ring Finger**: `ring_MCP`, `ring_PIP`, `ring_DIP`, `ring_tip`
* **Little Finger**: `little_MCP`, `little_PIP`, `little_DIP`, `little_tip`

---

## Technical Details & Performance Optimizations

1. **GPU Downsample Blitting**: Reading full-size camera textures from the GPU blocks the WebGL rendering thread. To solve this, the operator performs a high-efficiency **GPU Framebuffer Blit** to downsample the texture to a maximum 384px dimension before reading the pixels. This reduces raw transfer data size by over 95%, keeping frame times under **2ms**.
2. **Double-Buffered Backpressure Control**: The operator tracks if the background sidecar is still busy processing a previous frame. If a new trigger is received while a frame is in-flight, it immediately skips upload rather than queueing, preventing frame lag or buffer buildup.
3. **Automatic Orphan Garbage Collection**: The native binary listens for parent process termination (`getppid() == 1`). If the parent Cables editor exits, the sidecar instantly self-terminates to avoid leaking background process daemons.
