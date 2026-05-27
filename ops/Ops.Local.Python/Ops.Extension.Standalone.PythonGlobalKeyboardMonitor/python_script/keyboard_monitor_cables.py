import sys
import json
import logging
from pynput import keyboard

# Configure logging to stderr to keep stdout clean for JSON
logging.basicConfig(
    format='%(levelname)s:%(message)s', 
    level=logging.DEBUG,
    stream=sys.stderr
)

# Modifier tracking
modifiers = {
    keyboard.Key.ctrl: False,
    keyboard.Key.ctrl_l: False,
    keyboard.Key.ctrl_r: False,
    keyboard.Key.alt: False,
    keyboard.Key.alt_l: False,
    keyboard.Key.alt_r: False,
    keyboard.Key.shift: False,
    keyboard.Key.shift_l: False,
    keyboard.Key.shift_r: False,
    keyboard.Key.cmd: False,
    keyboard.Key.cmd_l: False,
    keyboard.Key.cmd_r: False,
}

def send_message(msg_type, **kwargs):
    try:
        msg = {"type": msg_type}
        msg.update(kwargs)
        sys.stdout.write(json.dumps(msg) + '\n')
        sys.stdout.flush()
    except Exception as e:
        logging.error(f"Failed to send message: {e}")

def get_modifier_string():
    parts = []
    if modifiers[keyboard.Key.ctrl] or modifiers[keyboard.Key.ctrl_l] or modifiers[keyboard.Key.ctrl_r]:
        parts.append("ctrl")
    if modifiers[keyboard.Key.alt] or modifiers[keyboard.Key.alt_l] or modifiers[keyboard.Key.alt_r]:
        parts.append("alt")
    if modifiers[keyboard.Key.shift] or modifiers[keyboard.Key.shift_l] or modifiers[keyboard.Key.shift_r]:
        parts.append("shift")
    if modifiers[keyboard.Key.cmd] or modifiers[keyboard.Key.cmd_l] or modifiers[keyboard.Key.cmd_r]:
        parts.append("cmd")
    return " + ".join(parts)

def on_press(key):
    if key in modifiers:
        modifiers[key] = True
        return

    try:
        k = key.char
        if k is None: k = str(key)
    except AttributeError:
        k = str(key)
    
    mod_prefix = get_modifier_string()
    combo = f"{mod_prefix} + {k}" if mod_prefix else k
    
    data = {
        "combo": combo,
        "key": k,
        "modifiers": mod_prefix,
        "event": "press"
    }
    
    send_message("keyboardPress", data=data)

def on_release(key):
    if key in modifiers:
        modifiers[key] = False
        return

    try:
        k = key.char
        if k is None: k = str(key)
    except AttributeError:
        k = str(key)
        
    mod_prefix = get_modifier_string()
    combo = f"{mod_prefix} + {k}" if mod_prefix else k
        
    data = {
        "combo": combo,
        "key": k,
        "modifiers": mod_prefix,
        "event": "release"
    }
    
    send_message("keyboardRelease", data=data)

def main():
    logging.info("Starting Cables GL Keyboard Monitor (stdout mode)...")
    send_message("info", message="Keyboard Monitor Started")
    
    try:
        with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
            listener.join()
    except Exception as e:
        logging.error(f"Keyboard listener error: {e}")
    except KeyboardInterrupt:
        logging.info("Stopping Keyboard Monitor...")

if __name__ == "__main__":
    main()
