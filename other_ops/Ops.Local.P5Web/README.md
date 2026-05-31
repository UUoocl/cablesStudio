# Cables P5.js Web-Compatible Integration

This operator is a copy of `Ops.Local.P5` adapted specifically for the **cables.gl web editor environment** as `Ops.Local.P5Web.P5Instance`.

Unlike the local/Electron standalone version which requires local URL inputs to load the P5 library and user sketch via dynamic imports, this version relies on pre-imported references that cables.gl web makes available directly within the execution scope.

## Features

- **No URL/Network Overhead**: Instantiates P5 directly without fetching ESM modules or external script URLs.
- **Injected Scope Integration**: Integrates with the pre-loaded `p5Module` and `p5Sketch` variables provided by the cables.gl web platform.
- **Identical Texture/Canvas Bridge**: Maintains the exact same outputs (`Rendered Texture`, `Canvas`, `Output Data`) as the local standalone version.

## Usage

Create the operator in your patch. Since it does not require `P5 Module URL` or `Sketch URL` inputs, it will automatically connect to the pre-loaded `p5Module` constructor and the user's `p5Sketch` function.

### Input Ports

- **Canvas Width**: Integer width of the target P5 canvas (default `800`).
- **Canvas Height**: Integer height of the target P5 canvas (default `600`).
- **Input Data**: Objects passed to the sketch's `p.onDataChange` handler.
- **Flip Y**: Vertically flips the texture (usually true for WebGL/Cables).
- **Render**: Manually trigger drawing (P5 loops automatically by default).
- **Manual Reload**: Manually restarts the P5 instance.

### Output Ports

- **Rendered Texture**: The `CGL.Texture` for WebGL pipelines.
- **Canvas**: The raw HTML canvas element.
- **Next**: A trigger that fires after each draw frame.
- **Output Data**: Data returned from P5 to Cables via `op.setOutData()`.
- **Error**: Detailed error messages if `p5Module` or `p5Sketch` is not found or fails to run.
