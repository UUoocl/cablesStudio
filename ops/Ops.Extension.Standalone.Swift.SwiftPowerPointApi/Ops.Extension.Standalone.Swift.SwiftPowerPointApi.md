# Ops.Extension.Standalone.Swift.SwiftPowerPointApi

Controls Microsoft PowerPoint presentation slideshows, advances slides, and updates presenter notes metadata natively using a high-speed background Swift sidecar process.

## Layout & Ports

### Inputs
- **Trigger** (Trigger): Fires the command request parser when clicked/triggered.
- **Request** (String URL/Query): Query parameter-based command request string (e.g. `?command=next` or `?command=goto&slide=3`).
- **Response** (Object): Node/Express server HTTP response context object. When a request is triggered, the sidecar processes it asynchronously and responds back directly to the HTTP response stream.

### Outputs
- **Next** (Trigger): Fires when a successful command execution completes.
- **Result** (Object): Parsed JSON result object returned by the sidecar.
- **Error Trigger** (Trigger): Fires when an execution or script error occurs.
- **Error Message** (String): Detailed error trace or message.
- **SSE Event Name** (String): Server-Sent Event (SSE) event name corresponding to the action (e.g. `nextresponse`).

## Commands & Query Parameters

### Start PowerPoint
- Query: `?command=start`

### Stop PowerPoint
- Query: `?command=stop`

### Play Slideshow
- Query: `?command=play`

### Next Slide
- Query: `?command=next`

### Previous Slide
- Query: `?command=prev` or `?command=previous`

### Go To Slide
- Query: `?command=goto&slide=<slide_index>`
- Example: `?command=goto&slide=4`

### Set Slide Scene (Update presenter notes JSON)
- Query: `?command=setscene&slide=<slide_index>&scene=<scene_name>&uuid=<optional_id>`
- Example: `?command=setscene&slide=2&scene=IntroScene&uuid=ab12cd34`

### Get Slide List (Metadata & Notes)
- Query: `?command=getslides`

---

## Native Swift Compilation
To manually rebuild the background sidecar:
```bash
cd ops/Ops.Extension.Standalone.Swift.SwiftPowerPointApi
swift build -c release
mkdir -p swift_bin
cp .build/release/SwiftPowerPointApi swift_bin/SwiftPowerPointApi
```
