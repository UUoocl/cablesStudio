const
    data = op.inObject("GamePad Data"),
    vibrate = op.inTrigger("Vibrate"),
    stop = op.inTrigger("Stop"),
    duration = op.inValue("Duration", 500),
    strongMagnitude = op.inValueSlider("Strong Magnitude", 1),
    weakMagnitude = op.inValueSlider("Weak Magnitude", 1),

    outSupported = op.outBoolNum("Supported"),
    outVibrating = op.outBoolNum("Vibrating"),
    outNext = op.outTrigger("next");

data.onChange = updateSupported;

function updateSupported()
{
    const gp = data.get();
    outSupported.set(!!(gp && gp.vibrationActuator));
}

vibrate.onTriggered = function ()
{
    const gp = data.get();
    if (gp && gp.vibrationActuator)
    {
        outVibrating.set(true);
        gp.vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration: duration.get(),
            strongMagnitude: strongMagnitude.get(),
            weakMagnitude: weakMagnitude.get()
        }).then((result) =>
        {
            if (result === "complete")
            {
                outVibrating.set(false);
            }
        }).catch((err) =>
        {
            outVibrating.set(false);
            op.log("Gamepad vibration error:", err);
        });
    }
    outNext.trigger();
};

stop.onTriggered = function ()
{
    const gp = data.get();
    if (gp && gp.vibrationActuator)
    {
        if (gp.vibrationActuator.reset)
        {
            gp.vibrationActuator.reset().then(() =>
            {
                outVibrating.set(false);
            }).catch((err) =>
            {
                outVibrating.set(false);
                op.log("Gamepad vibration reset error:", err);
            });
        }
        else
        {
            outVibrating.set(false);
        }
    }
    outNext.trigger();
};
