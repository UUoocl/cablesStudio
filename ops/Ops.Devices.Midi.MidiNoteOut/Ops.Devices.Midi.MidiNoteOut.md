# Ops.Devices.Midi.MidiNoteOut

Use this op to create MIDI notes data to send out to your MIDI device.

The velocity and note index can be animated to send different notes via a MIDI channel.

If you choose a note with the dropdown menu, only that note will get sent. Set it to "Use Note Number Port" to dynamically control the note via the Note Number port.

You can use the velocity array in to send multiple notes out at once.

This customized version splits the velocity controls into separate **Note On** and **Note Off** groups:
- Changes to **Note On** ports transmit `NOTE_ON` (`0x90`) messages (supporting Note On with velocity 0).
- Changes to **Note Off** ports transmit `NOTE_OFF` (`0x80`) messages (supporting Note Off with velocity 0).

All Note On and Note Off events are explicitly controlled by the inputs. The operator does not automatically send note-off events when notes change.
