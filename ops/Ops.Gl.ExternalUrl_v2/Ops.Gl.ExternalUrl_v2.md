# Ops.Gl.ExternalUrl_v2

Opens a specified URL directly in an external sub-window.

## Summary

This operator opens a new window hosting a custom URL directly (without using an iframe). This avoids iframe restrictions like `X-Frame-Options` or Content Security Policy `frame-ancestors` from target pages.

If running inside Electron, it will open the URL in a captured, frameless sub-window. It also supports transparency (useful for overlays) and communicates window states via a Broadcast Channel.

## Inputs

* **Update** (Trigger): Triggers the operator to pass next execution and publish broadcast updates.
* **URL** (String): The target website or webpage URL to load directly.
* **Broadcast Channel Name** (String): The BroadcastChannel channel to sync state and URL updates.
* **Pos X** & **Pos Y** (Integer): Position of the window on screen.
* **Width** & **Height** (Integer): Initial width and height of the window.
* **Transparent background** (Boolean): If enabled, sets the window features to `transparent=true` and `frame=false`.
* **Title** (String): Title of the window.
* **Open Window** (Trigger Button): Opens the window.
* **Fullscreen** (Trigger Button): Toggles fullscreen on the window.
* **Close** (Trigger Button): Closes the window.

## Outputs

* **Next** (Trigger): Trigger output.
* **Element** (Object): Exposes the DOM body of the child window (only available if loading a same-origin URL).
