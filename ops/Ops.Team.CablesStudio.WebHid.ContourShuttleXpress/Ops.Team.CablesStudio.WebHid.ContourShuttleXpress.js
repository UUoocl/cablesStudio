/**
 * Ops.Team.CablesStudio.WebHid.ContourShuttleXpress
 * 
 * Interfacing with Contour ShuttleXpress visual controllers using standard WebHID API.
 */

const
    inActive = op.inBool("Active", false),
    inDeviceIndex = op.inInt("Device Index", 0),
    inRequestDevice = op.inTrigger("Request Device"),

    outEvent = op.outTrigger("On Event"),
    outStatus = op.outString("Status", "Stopped"),
    outIsConnected = op.outBool("Is Connected", false),

    outJogValue = op.outNumber("Jog Value", 0),
    outJogDelta = op.outNumber("Jog Delta", 0),
    outJogTurned = op.outTrigger("Jog Turned"),

    outShuttleValue = op.outNumber("Shuttle Value", 0),
    outShuttleMoved = op.outTrigger("Shuttle Moved"),

    outButtonIndex = op.outNumber("Button Index", -1),
    outButtonPressed = op.outBool("Button Pressed", false),
    outButtonEvent = op.outTrigger("Button Event");

op.setPortGroup("Controls", [inActive, inRequestDevice]);
op.setPortGroup("Settings", [inDeviceIndex]);

let activeDevice = null;
let isConnected = false;
let prevJog = -1;
let hasPrevJog = false;
let prevShuttle = -1;
let hasPrevShuttle = false;
let accumulatedJogValue = 0;
let prevButtons = new Array(5).fill(false);

const CONTOUR_XPRESS_FILTERS = [
    { vendorId: 0x0b33, productId: 0x0020 }
];

function handleInputReport(event) {
    if (!activeDevice) return;
    const { data } = event;
    const report = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    if (report.length < 5) return;

    // Byte 0: Shuttle (-7 to +7 signed int8)
    const shuttleVal = (report[0] << 24) >> 24;

    // Byte 1: Jog wheel uint8
    const jogVal = report[1];

    // Byte 3: Button bitmask (5 buttons)
    const bByte1 = report[3];
    const bByte2 = report[4];

    // 1. Shuttle ring
    if (!hasPrevShuttle || shuttleVal !== prevShuttle) {
        outShuttleValue.set(shuttleVal);
        outShuttleMoved.trigger();
        outEvent.trigger();
        prevShuttle = shuttleVal;
        hasPrevShuttle = true;
    }

    // 2. Jog wheel
    if (hasPrevJog) {
        let diff = jogVal - prevJog;
        if (diff > 128) diff -= 256;
        else if (diff < -128) diff += 256;

        if (diff !== 0) {
            accumulatedJogValue += diff;
            outJogDelta.set(diff);
            outJogValue.set(accumulatedJogValue);
            outJogTurned.trigger();
            outEvent.trigger();
        }
    }
    prevJog = jogVal;
    hasPrevJog = true;

    // 3. Buttons 0 to 4
    const buttonsPressed = [
        ((bByte1 >> 4) & 1) !== 0,
        ((bByte1 >> 5) & 1) !== 0,
        ((bByte1 >> 6) & 1) !== 0,
        ((bByte1 >> 7) & 1) !== 0,
        ((bByte2 >> 0) & 1) !== 0
    ];

    for (let i = 0; i < 5; i++) {
        const pressed = buttonsPressed[i];
        if (pressed !== prevButtons[i]) {
            prevButtons[i] = pressed;
            outButtonIndex.set(i);
            outButtonPressed.set(pressed);
            outButtonEvent.trigger();
            outEvent.trigger();
        }
    }
}

async function connectDevice() {
    await disconnectDevice();
    if (!inActive.get()) return;

    if (!navigator.hid) {
        outStatus.set("WebHID Not Supported");
        return;
    }

    try {
        const devices = await navigator.hid.getDevices();
        const shuttleDevices = devices.filter(d => d.vendorId === 0x0b33 && d.productId === 0x0020);
        const index = inDeviceIndex.get();

        if (shuttleDevices.length === 0) {
            outStatus.set("No devices found (Use Request Device)");
            return;
        }

        const dev = shuttleDevices[index];
        outStatus.set("Connecting...");

        if (!dev.opened) {
            await dev.open();
        }

        activeDevice = dev;
        activeDevice.addEventListener("inputreport", handleInputReport);

        isConnected = true;
        outIsConnected.set(true);
        const modelName = dev.productName || "Contour ShuttleXpress";
        outStatus.set("Connected to " + modelName);
    } catch (e) {
        outStatus.set("Connection Failed: " + e.message);
        await disconnectDevice();
    }
}

async function disconnectDevice() {
    if (activeDevice) {
        try {
            activeDevice.removeEventListener("inputreport", handleInputReport);
            if (activeDevice.opened) {
                await activeDevice.close();
            }
        } catch (e) {}
    }
    activeDevice = null;
    isConnected = false;
    outIsConnected.set(false);
    outStatus.set("Stopped");
}

inRequestDevice.onTriggered = async () => {
    if (!navigator.hid) return;
    try {
        const selected = await navigator.hid.requestDevice({ filters: CONTOUR_XPRESS_FILTERS });
        if (selected && selected.length > 0) {
            if (inActive.get()) connectDevice();
        }
    } catch (e) {
        outStatus.set("Permission Request Failed");
    }
};

inActive.onChange = () => {
    if (inActive.get()) connectDevice();
    else disconnectDevice();
};

inDeviceIndex.onChange = () => {
    if (inActive.get()) connectDevice();
};

op.onDelete = disconnectDevice;
