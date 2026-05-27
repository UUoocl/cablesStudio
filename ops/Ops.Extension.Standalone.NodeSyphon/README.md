# Syphon In/Out Standalone for Cables GL Electron

This library provides high-performance, real-time video sharing capabilities for Cables GL within a standalone Electron environment using the Syphon framework on macOS.

## Description

The **Syphon In/Out Standalone** library enables seamless video routing between Cables GL and other macOS applications. It leverages the [Syphon](http://syphon.v002.info/) framework to share textures with zero-latency and high throughput.

### Included Operators:
- **`SyphonIn`**: Automatically discovers and receives video from any active Syphon server on your system.
- **`SyphonOut`**: Publishes a Cables GL texture as a Syphon server, making it available to applications like Resolume, MadMapper, or other Cables instances.

This library is specifically designed to be complemented by the [OBS Syphon Server Plugin](https://github.com/UUoocl/syphon-server-plugin), allowing you to stream high-quality video from OBS directly into your Cables patches.

## Usage

### Prerequisites
- **macOS**: Syphon is a macOS-only framework.
- **Cables Standalone (Electron)**: This library requires access to the Node.js environment provided by Electron.
- **`node-syphon`**: Ensure the `node-syphon` package is available in your Electron `node_modules`.

### SyphonIn
1. Add the `SyphonIn` operator to your patch.
2. Connect the **Render** trigger.
3. Select an active server from the **Server** dropdown menu.
4. Use the **Texture** output to map the incoming video to your geometry.

### SyphonOut
1. Add the `SyphonOut` operator to your patch.
2. Connect the **Texture** you wish to share.
3. Connect the **Render** trigger.
4. Provide a **Server Name** (e.g., "Cables_Main_Output").
5. The texture will now be visible to any Syphon-compatible client.

### OBS Integration
To send video from OBS to Cables:
1. Install the [Syphon Server Plugin for OBS](https://github.com/UUoocl/syphon-server-plugin).
2. In OBS, add a "Syphon Server" filter to your source or scene.
3. In Cables, use `SyphonIn` and select the OBS server from the dropdown.

## Developer Overview

The implementation utilizes native Node.js bindings for the Syphon framework via `node-syphon`.

> [!NOTE]
> This project is a fork of [benoitlahoz/node-syphon](https://github.com/benoitlahoz/node-syphon).


### Architecture
- **`SyphonIn`**:
    - Uses `SyphonServerDirectory` to listen for network announcements of new Syphon servers.
    - Manages a `SyphonOpenGLClient` that hooks into the server's frame callbacks.
    - Transfers pixel data from the native buffer into a `CGL.Texture` using `gl.texImage2D`.
- **`SyphonOut`**:
    - Uses `SyphonOpenGLServer` to register a new system-wide server.
    - Efficiently reads pixels from a WebGL texture using a dedicated Framebuffer Object (FBO) and `gl.readPixels`.
    - Publishes the pixel data using `server.publishImageData`.

### Performance Note
Both operators are optimized for real-time performance. `SyphonOut` handles FBO management and buffer allocation internally to minimize overhead during the render loop.

## AI Disclaimer
> **Disclaimer**: The code, operators, and documentation in this repository were generated, refactored, and tested with the assistance of Artificial Intelligence. While efforts have been made to ensure stability, please review all scripts and native library calls for security and compatibility within your specific local environment.

