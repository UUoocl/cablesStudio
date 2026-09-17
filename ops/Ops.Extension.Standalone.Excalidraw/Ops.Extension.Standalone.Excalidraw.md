# Excalidraw Standalone Server Operator

`Ops.Extension.Standalone.Excalidraw`

## Overview

The **Excalidraw Standalone Server** operator serves an interactive Excalidraw whiteboard application to local web clients (browsers, OBS browser sources, cables canvas layers, or embedded webviews).

It integrates directly with **`Ops.Extension.Standalone.HttpFileServer`** by listening for incoming HTTP requests targeted at a specified route (default: `/api/excalidraw`).

---

## Connections with HttpFileServer

Wire the ports between `HttpFileServer` and `Excalidraw` as follows:

| `HttpFileServer` Output | `Excalidraw` Input | Description |
| :--- | :--- | :--- |
| **On HTTP Request** | **Trigger** | Triggers request processing |
| **HTTP Request Data** | **Request Data** | Passes request method, URL, headers, and payload |
| **HTTP Response Data** | **Response** | Passes Node `ServerResponse` handle to write response |

---

## Operator Inputs & Outputs

### Inputs

| Input | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Trigger** | `Trigger` | - | Connect to `HttpFileServer`'s `On HTTP Request` |
| **Request Data** | `Object` | - | Connect to `HttpFileServer`'s `HTTP Request Data` |
| **Response** | `Object` | - | Connect to `HttpFileServer`'s `HTTP Response Data` |
| **API Route** | `String` | `/api/excalidraw` | URL path prefix to serve Excalidraw on |
| **Theme** | `Select` | `dark` | UI theme (`dark` or `light`) |
| **Transparent** | `Boolean` | `false` | Enable transparent background for OBS browser sources / overlays |
| **Show UI** | `Boolean` | `true` | Show UI menus, toolbars, and buttons (set to false for clean OBS overlays) |
| **Read Only** | `Boolean` | `false` | Enable view-only mode for clients |
| **Grid Mode** | `Boolean` | `false` | Show background grid lines by default |
| **Zen Mode** | `Boolean` | `false` | Hide toolbars and sidebars by default |
| **Auto Save** | `Boolean` | `true` | Receive auto-save scene updates from clients |
| **App Title** | `String` | `Excalidraw Standalone` | HTML page title for client browser tabs |
| **Initial Scene Data** | `Object` | `{}` | Scene object `{ elements: [], appState: {} }` |
| **Initial Scene JSON String** | `String` | `""` | Raw JSON string representation of scene |
| **Reload Preview** | `Button` | - | Force refresh of internal preview iframe |

### Outputs

| Output | Type | Description |
| :--- | :--- | :--- |
| **On Request** | `Trigger` | Fired when an HTTP request is handled |
| **On Scene Updated** | `Trigger` | Fired when a client submits an updated drawing scene |
| **On Error** | `Trigger` | Fired on error |
| **Element** | `Object (HTMLElement)` | `<iframe>` element containing live Excalidraw client preview |
| **HTML** | `String` | Generated HTML application string |
| **Scene Data** | `Object` | Current scene JSON object (`{ elements, appState, files }`) |
| **Scene JSON String** | `String` | Serialized JSON string of current scene |
| **Error** | `String` | Error message string if a request failed |

---

## API Endpoints

### 1. Web Client Application
```http
GET http://127.0.0.1:8080/api/excalidraw
```
Renders the full interactive Excalidraw web application.

### 2. Fetch Scene Data
```http
GET http://127.0.0.1:8080/api/excalidraw/scene
```
Returns the current drawing scene JSON:
```json
{
  "elements": [...],
  "appState": { "theme": "dark", "viewBackgroundColor": "#ffffff" },
  "files": {}
}
```

### 3. Update Scene Data
```http
POST http://127.0.0.1:8080/api/excalidraw/scene
Content-Type: application/json

{
  "elements": [...],
  "appState": {...},
  "files": {}
}
```
Updates the scene data stored in Cables, updating the `Scene Data` output and triggering `On Scene Updated`.
