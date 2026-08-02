const MIDIChannels = Array.from(Array(16).keys(), (i) => { return i + 1; });
const NOTE_VALUES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const clamp = (val, min, max) => { return Math.min(Math.max(val, min), max); };
const NOTE_OFF = 0x8;
const NOTE_ON = 0x9;

function getMIDINote(dataByte1LSB)
{
    return dataByte1LSB <= 126
        ? `${NOTE_VALUES[dataByte1LSB % 12]}${Math.floor(dataByte1LSB / 12) - 2} - ${dataByte1LSB}`
        : "NO NOTE";
}

// FIX: noteValues array only has the note values
const noteValues = Array.from(Array(128).keys(), (key) => { return getMIDINote(key); });

const inChannel = op.inDropDown("MIDI Channel", MIDIChannels, "1");
const inNoteDropdown = op.inDropDown("Note", noteValues);
const inNoteNumber = op.inInt("Note Number", 0);

// FIX: Separate Note On and Note Off groups of ports to handle both values without duplicate messages

// Note On Group
const inVelocity = op.inInt("Velocity", 0);
const inMin = op.inFloat("Min In Velocity", 0);
const inMax = op.inFloat("Max In Velocity", 1);

// Note Off Group
const inVelocityOff = op.inInt("Velocity Off", 0);
const inMinOff = op.inFloat("Min In Velocity Off", 0);
const inMaxOff = op.inFloat("Max In Velocity Off", 1);

const inNoteArray = op.inArray("Velocity Array In");

op.setPortGroup("General", [inChannel, inNoteDropdown, inNoteNumber]);
op.setPortGroup("Note On", [inVelocity, inMin, inMax]);
op.setPortGroup("Note Off", [inVelocityOff, inMinOff, inMaxOff]);
op.setPortGroup("Velocity Array", [inNoteArray]);

const outEvent = op.outObject("MIDI Event Out");

// FIX: When dropdown changes, just update the Note On velocity output without sending any automatic note off
inNoteDropdown.onChange = function ()
{
    inVelocity.onChange();
};

// Note On change handler: Always transmits a Note On (0x90) message
inVelocity.onChange = function ()
{
    const val = inVelocity.get();
    const noteNumber = inNoteNumber.get();
    
    // FIX: Clamp mapped velocity to valid [0, 127] MIDI range
    const mappedVelocity = Math.floor(CABLES.map(val, inMin.get(), inMax.get(), 0, 127));
    const velocity = clamp(mappedVelocity, 0, 127);

    let noteIndex = Math.floor(clamp(noteNumber, 0, 127));

    // FIX: Check if Note Number is linked, otherwise use the dropdown selection if it's set
    if (!inNoteNumber.isLinked() && inNoteDropdown.get() && typeof inNoteDropdown.get() === "string")
    {
        noteIndex = clamp(Number(inNoteDropdown.get().split("-").pop()), 0, 127);
    }

    const data = [(NOTE_ON << 4 | (inChannel.get() - 1)), noteIndex, velocity];

    const event = {
        "deviceName": null,
        "output": null,
        "inputId": 0,
        "messageType": "Note",
        "data": data,
        "index": noteIndex,
        "value": velocity,
        "newNote": [noteIndex, getMIDINote(noteIndex)],
        velocity,
        "channel": inChannel.get() - 1,
    };

    outEvent.set(null);
    outEvent.set(event);
};

// Note Off change handler: Always transmits a Note Off (0x80) message
inVelocityOff.onChange = function ()
{
    const val = inVelocityOff.get();
    const noteNumber = inNoteNumber.get();
    
    // FIX: Clamp mapped velocity to valid [0, 127] MIDI range
    const mappedVelocity = Math.floor(CABLES.map(val, inMinOff.get(), inMaxOff.get(), 0, 127));
    const velocity = clamp(mappedVelocity, 0, 127);

    let noteIndex = Math.floor(clamp(noteNumber, 0, 127));

    // FIX: Check if Note Number is linked, otherwise use the dropdown selection if it's set
    if (!inNoteNumber.isLinked() && inNoteDropdown.get() && typeof inNoteDropdown.get() === "string")
    {
        noteIndex = clamp(Number(inNoteDropdown.get().split("-").pop()), 0, 127);
    }

    const data = [(NOTE_OFF << 4 | (inChannel.get() - 1)), noteIndex, velocity];

    const event = {
        "deviceName": null,
        "output": null,
        "inputId": 0,
        "messageType": "Note",
        "data": data,
        "index": noteIndex,
        "value": velocity,
        "newNote": [noteIndex, getMIDINote(noteIndex)],
        velocity,
        "channel": inChannel.get() - 1,
    };

    outEvent.set(null);
    outEvent.set(event);
};

inNoteNumber.onChange = function ()
{
    inVelocity.onChange();
};

let oldArr = [];

inNoteArray.onChange = function ()
{
    if (!inNoteArray.get()) return;
    const arr = inNoteArray.get();
    const length = arr.length > 127 ? 128 : arr.length;

    for (let i = 0; i < length; i += 1)
    {
        const mappedVelocity = Math.floor(CABLES.map(arr[i], inMin.get(), inMax.get(), 0, 127));
        const velocity = clamp(mappedVelocity, 0, 127);
        
        // Array input is mapped as Note On/Off based on velocity > 0
        const data = velocity > 0 ?
            [(NOTE_ON << 4 | (inChannel.get() - 1)), i, velocity]
            : [(NOTE_OFF << 4 | (inChannel.get() - 1)), i, velocity];

        const event = {
            "deviceName": null,
            "output": null,
            "inputId": 0,
            "messageType": "Note",
            "data": data,
            "index": i,
            "value": velocity,
            "newNote": [i, getMIDINote(i)],
            velocity,
            "channel": inChannel.get() - 1,
        };

        oldArr = arr;
        outEvent.set(null);
        outEvent.set(event);
    }
};
