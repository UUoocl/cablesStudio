# Ops.Sidebar.XYPad

A sidebar element that provides a 2D coordinate pad (canvas) for coordinate input.

## Summary

This operator draws a square 2D input pad in the sidebar that allows you to control two numeric values (X and Y coordinate values) by clicking, dragging, or touching the pad. It supports both mouse and touch drag/follow operations.

## Inputs

* **Link** (Object): Either a link to the sidebar or sidebar group.
* **Text** (String): The label text of the pad (defaults to "XY Pad").
* **Range** (Switch): The output range, either `0-1` or `-1-1`.
* **Input X** & **Input Y** (Number): Current X and Y values, represented in `0-1` range.
* **Flip X** & **Flip Y** (Boolean): Flips the output direction.
* **Set Default** (Trigger Button): Sets the current coordinate as the default value.
* **Visible** (Boolean): Toggles the visibility of the pad in the sidebar.

## Outputs

* **Children** (Object): Output to connect child sidebar ops.
* **X** & **Y** (Number): Current coordinates (mapped to either `0-1` or `-1-1` according to the Range input setting).
* **HTML Element** (Object): The underlying `<canvas>` HTML element, which can be used to listen to further DOM events.
