import sys
import json
import time
import threading
import logging
from pynput import keyboard
from socketclusterclient import Socketcluster

# Configure logging
logging.basicConfig(format='%(levelname)s:%(message)s', level=logging.DEBUG)

# Configuration
target_url = sys.argv[1] if len(sys.argv) > 1 else "ws://127.0.0.1:8000/socketcluster/"

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

# SocketCluster state
sc = None
connected = False

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

def on_connect(socket):
    global connected
    connected = True
    logging.info(f"CONNECTED to SocketCluster: {target_url}")
    # Test publish
    socket.publish("keyboardSettings", {"status": "connected", "test": True})

def on_disconnect(socket):
    global connected
    connected = False
    logging.warning("DISCONNECTED from SocketCluster")

def on_connect_error(socket, error):
    logging.error(f"CONNECTION ERROR: {error}")

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
    
    if connected:
        logging.debug(f"Publishing keyboardPress: {combo}")
        sc.publish("keyboardPress", data)

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
    
    if connected:
        logging.debug(f"Publishing keyboardRelease: {combo}")
        sc.publish("keyboardRelease", data)

if __name__ == "__main__":
    logging.info(f"Starting Keyboard Monitor targeting {target_url}...")
    sc = Socketcluster.socket(target_url)
    sc.setBasicListener(on_connect, on_disconnect, on_connect_error)
    sc.setreconnection(True)
    sc.connect()

    try:
        with keyboard.Listener(on_press=on_press, on_release=on_release) as listener:
            listener.join()
    except KeyboardInterrupt:
        logging.info("Stopping Keyboard Monitor...")
