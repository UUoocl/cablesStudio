# DesktopMicrophoneIn

Standalone Microphone input op with transient activation protection and device ID mapping.

## Usage

This op provides audio input capture for standalone Electron applications on macOS. 

Rather than prompting for microphone permissions automatically on startup, this op supports transient user activation. Permission checks and device queries are executed only when the user explicitly triggers the `Start` trigger button, satisfying security constraints and avoiding sudden OS prompts when launching patches.

It maps human-readable audio device names to their exact Chromium/Electron `deviceId` hashes.
