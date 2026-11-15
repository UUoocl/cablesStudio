# Ops.Extension.Standalone.MacOs.ShortcutsCli

Runs a macOS Shortcut asynchronously using the macOS `shortcuts` CLI (`shortcuts run <name> --output-path -`) in a non-blocking child process.

## Features
- **Non-blocking execution:** Uses `child_process.spawn` so the cables render/patch loop is not blocked while a shortcut runs.
- **Standard Input Payload:** When `Input Payload` is connected/non-null, it is serialized to JSON and piped to `shortcuts run --input-path -`.
- **Stdout & JSON Parsing:** Captures `Stdout` via `--output-path -` and automatically parses JSON responses into `JSON Output`.
- **Clean Lifecycle:** Kills any active child process if the op is deleted.

