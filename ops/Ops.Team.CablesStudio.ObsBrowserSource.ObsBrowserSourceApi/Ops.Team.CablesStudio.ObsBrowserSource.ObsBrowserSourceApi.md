# OBS Browser Source API

This Operator wraps all standard requests and event callbacks of the **OBS Browser Source API** (`window.obsstudio`), allowing deep integration between your Cables patch and OBS Studio when running the patch inside a CEF Browser Source.

## Features:
- **Feature Detection**: Dynamically determines if the patch is running inside a valid OBS Browser Source.
- **Port Groupings**: Keeps the user interface clean by categorizing ports into collapsed tabs like *Streaming & Recording*, *Replay Buffer*, *Scenes & Transitions*, and *Events*.
- **Standard Events**: Exposes discrete output triggers for all 20+ frontend API events (e.g. Scene Changed, Visible/Active status, Recording/Streaming state, Virtualcam, and Replay Buffer).
- **Custom Event Listening**: Subscribe to arbitrary events (e.g. emitted from `obs-websocket` vendor requests) by typing custom event names in the `Custom Events` input port.

## Required OBS Permission Levels:
Some commands and queries require specific control levels inside the OBS Browser Source properties page:
1. **NONE**: `pluginVersion`, `getControlLevel`
2. **READ_OBS** (1): `getStatus` (Streaming/Recording status)
3. **READ_USER** (2): `getCurrentScene`, `getScenes`, `getTransitions`, `getCurrentTransition`
4. **BASIC** (3): `saveReplayBuffer`
5. **ADVANCED** (4): `startReplayBuffer`, `stopReplayBuffer`, `setCurrentScene`, `setCurrentTransition`
6. **ALL** (5): `startStreaming`, `stopStreaming`, `startRecording`, `stopRecording`, `pauseRecording`, `unpauseRecording`, `startVirtualcam`, `stopVirtualcam`

## How to use Custom Events:
In the `Custom Events` port, enter a comma or space-separated list of custom events you expect OBS or vendor tools to broadcast (e.g., `myCustomAlert`, `triggerCelebration`).
When those events are triggered on the page, the `Custom Event Received` trigger fires, and both the event's name and details are set in the respective output ports.
