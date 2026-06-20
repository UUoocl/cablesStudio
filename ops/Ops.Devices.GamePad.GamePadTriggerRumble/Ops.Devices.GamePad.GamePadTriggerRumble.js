const
    data = op.inObject("GamePad Data"),
    vibrate = op.inTrigger("Vibrate"),
    stop = op.inTrigger("Stop"),
    duration = op.inValue("Duration", 500),
    leftTrigger = op.inValueSlider("Left Trigger", 1),
    rightTrigger = op.inValueSlider("Right Trigger", 1),

    outSupported = op.outBoolNum("Supported"),
    outVibrating = op.outBoolNum("Vibrating"),
    outNext = op.outTrigger("next");

data.onChange = updateSupported;

function updateSupported()
{
    const gp = data.get();
    const supported = !!(gp && gp.vibrationActuator && gp.vibrationActuator.effects && gp.vibrationActuator.effects.includes("trigger-rumble"));
    outSupported.set(supported);
}

vibrate.onTriggered = function ()
{
    const gp = data.get();
    if (gp && gp.vibrationActuator)
    {
        outVibrating.set(true);
        gp.vibrationActuator.playEffect("trigger-rumble", {
            startDelay: 0,
            duration: duration.get(),
            leftTrigger: leftTrigger.get(),
            rightTrigger: rightTrigger.get()
        }).then((result) =>
        {
            if (result === "complete")
            {
                outVibrating.set(false);
            }
        }).catch((err) =>
        {
            outVibrating.set(false);
            op.log("Gamepad trigger rumble error:", err);
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
