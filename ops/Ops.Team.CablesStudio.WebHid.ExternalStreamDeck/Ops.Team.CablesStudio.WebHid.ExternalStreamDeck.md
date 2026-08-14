# Ops.Team.CablesStudio.WebHid.ExternalStreamDeck

Interfacing with Elgato Stream Deck devices via WebHID inside a top-level popup window.

## Problem Solved
When Cables is embedded within an `<iframe>` (such as the standard Cables Studio editor setup), WebHID permission requests (`navigator.hid.requestDevice()`) may be blocked or restricted due to iframe permissions policy.

This op opens a small external top-level popup window, moving the WebHID hardware context to top-level window scope where device picker modals and permissions are unrestricted.

## Features
- Popup helper window UI with "Request StreamDeck Device" button.
- Bi-directional IPC sync between parent op and popup helper window.
- Parity with `StreamDeckKeyTexture` and `StreamDeckStretchedTexture`.
