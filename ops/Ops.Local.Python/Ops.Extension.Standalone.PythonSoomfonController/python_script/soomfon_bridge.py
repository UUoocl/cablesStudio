import sys
import json
import base64
import io
import logging
import threading
import time

import ctypes
import os

# Configure logging to stderr to prevent interference with stdout JSON communication
logging.basicConfig(
    format='%(levelname)s:%(message)s',
    level=logging.INFO,
    stream=sys.stderr
)

# Configure Homebrew search paths for ctypes find_library on macOS
search_paths = []
if sys.platform == 'darwin':
    os.environ['PATH'] = '/opt/homebrew/bin:/usr/local/bin:' + os.environ.get('PATH', '')
    os.environ['DYLD_LIBRARY_PATH'] = f"/opt/homebrew/lib:/usr/local/lib:{os.environ.get('DYLD_LIBRARY_PATH', '')}"
    os.environ['DYLD_FALLBACK_LIBRARY_PATH'] = f"/opt/homebrew/lib:/usr/local/lib:{os.environ.get('DYLD_FALLBACK_LIBRARY_PATH', '')}"
    
    search_paths = [
        '/opt/homebrew/lib/libhidapi.dylib',
        '/opt/homebrew/lib/libhidapi-libusb.dylib',
        '/usr/local/lib/libhidapi.dylib',
        '/usr/local/lib/libhidapi-libusb.dylib'
    ]
    
    # Preload libhidapi on macOS to help ctypes locate Homebrew installations
    for path in search_paths:
        if os.path.exists(path):
            try:
                ctypes.CDLL(path)
                logging.info(f"Successfully preloaded HIDAPI library: {path}")
                break
            except Exception as e:
                logging.error(f"Failed to preload HIDAPI at {path}: {e}")

    # Monkey-patch ctypes.LibraryLoader.LoadLibrary so subsequent imports of hid/hidapi
    # find the library at its absolute path even if search paths are stripped by SIP
    original_load_library = ctypes.LibraryLoader.LoadLibrary
    def patched_load_library(self, name):
        if 'hidapi' in name:
            for path in search_paths:
                if os.path.exists(path):
                    try:
                        return original_load_library(self, path)
                    except Exception:
                        pass
        return original_load_library(self, name)
    ctypes.LibraryLoader.LoadLibrary = patched_load_library

# Import ajazz-akp03e library and PIL dependencies safely
dependencies_ok = False
try:
    import hid
    from PIL import Image
    
    # Auto-detect whether to use Soomfon clone's USB VID/PID (0x1500, 0x3001)
    # or the standard Ajazz AKP03E VID/PID (0x0300, 0x3002).
    target_vid = 0x0300
    target_pid = 0x3002
    
    try:
        for dev in hid.enumerate():
            if dev.get('vendor_id') == 0x1500 and dev.get('product_id') == 0x3001:
                target_vid = 0x1500
                target_pid = 0x3001
                logging.info("Detected Soomfon Stream Controller SE (0x1500, 0x3001)")
                break
    except Exception as e:
        logging.error(f"Error during HID device enumeration: {e}")
        
    # Apply constants overrides to both modules to handle import order differences
    import ajazz_akp03e._constants
    import ajazz_akp03e._transport
    ajazz_akp03e._constants.VID = target_vid
    ajazz_akp03e._constants.PID = target_pid
    ajazz_akp03e._transport.VID = target_vid
    ajazz_akp03e._transport.PID = target_pid
    
    from ajazz_akp03e import AKP03E
    dependencies_ok = True
except ImportError as e:
    logging.error(f"Failed to import dependencies: {e}")

# Global lock to serialize USB access to the controller
device_lock = threading.Lock()
current_device = None

# PIL resample mode fallback compatibility
RESAMPLE_MODE = None
if dependencies_ok:
    try:
        RESAMPLE_MODE = Image.Resampling.LANCZOS
    except AttributeError:
        # Older Pillow versions compatibility
        try:
            RESAMPLE_MODE = Image.ANTIALIAS
        except AttributeError:
            RESAMPLE_MODE = Image.BICUBIC

def send_json(msg_type, **kwargs):
    """
    Format and print a JSON message to stdout.
    """
    try:
        msg = {"type": msg_type}
        msg.update(kwargs)
        sys.stdout.write(json.dumps(msg) + '\n')
        sys.stdout.flush()
    except Exception as e:
        logging.error(f"Failed to write JSON message: {e}")

# Callback functions
def on_btn_press(event):
    send_json("key_event", key=event.key, pressed=True)

def on_btn_release(event):
    send_json("key_event", key=event.key, pressed=False)

def on_knob_turn(event):
    send_json("knob_turn", knob=event.knob, direction=event.direction)

def on_knob_press(event):
    send_json("knob_click", knob=event.knob, pressed=True)

def on_knob_release(event):
    send_json("knob_click", knob=event.knob, pressed=False)

def close_device():
    """
    Safely close the current Soomfon device connection.
    """
    global current_device
    with device_lock:
        if current_device:
            try:
                logging.info("Closing Soomfon device connection...")
                current_device.close()
            except Exception as e:
                logging.error(f"Error closing Soomfon device: {e}")
            current_device = None
            send_json("disconnected")

def connect_device():
    """
    Open connection and register event callbacks.
    """
    global current_device
    
    close_device()
    
    try:
        logging.info("Attempting to connect to Soomfon Stream Controller...")
        
        # Instantiate device
        # ajazz-akp03e handles the USB search & wake cycles internally
        deck = AKP03E(brightness=80)
        
        with device_lock:
            deck.open()
            
            # Register callbacks for keys 0-8
            for k in range(9):
                deck.on_button_press(k, on_btn_press)
                deck.on_button_release(k, on_btn_release)
                
            # Register callbacks for knobs 0-2
            for kn in range(3):
                deck.on_knob_turn(kn, on_knob_turn)
                deck.on_knob_press(kn, on_knob_press)
                deck.on_knob_release(kn, on_knob_release)
                
            # Start background event reader thread
            deck.start()
            current_device = deck
            
        send_json(
            "connected",
            model="Soomfon Stream Controller SE",
            keys=9,
            display_keys=6,
            rows=2,
            cols=3,
            key_width=60,
            key_height=60
        )
        return True
        
    except Exception as e:
        logging.error(f"Connection error: {e}")
        send_json("error", message=f"Failed to open Soomfon device: {str(e)}")
        return False

def set_key_image(key_index, base64_image_str):
    """
    Update a single key LCD display with an image decoded from base64.
    """
    global current_device
    if not current_device:
        return
        
    if key_index < 0 or key_index >= 6:
        logging.error(f"Invalid key display index: {key_index}. Expected 0-5.")
        return
        
    try:
        # Decode base64 payload to PIL Image
        image_bytes = base64.b64decode(base64_image_str)
        img = Image.open(io.BytesIO(image_bytes))
        
        with device_lock:
            if current_device:
                current_device.set_key_image(key_index, img)
    except Exception as e:
        logging.error(f"Error setting key {key_index} image: {e}")
        send_json("error", message=f"Failed setting key {key_index}: {str(e)}")

def set_stretched_image(base64_image_str):
    """
    Decode a single image and tile it across the 6 keys (3x2 grid).
    """
    global current_device
    if not current_device:
        return
        
    try:
        image_bytes = base64.b64decode(base64_image_str)
        img = Image.open(io.BytesIO(image_bytes))
        
        with device_lock:
            if not current_device:
                return
                
            cols = 3
            rows = 2
            kw = 60
            kh = 60
            
            # Calculate overall size of the sliced grid
            target_w = cols * kw
            target_h = rows * kh
            
            # Resize source image to fill grid
            resized = img.resize((target_w, target_h), RESAMPLE_MODE)
            
            # Crop and update each key
            for r in range(rows):
                for c in range(cols):
                    box = (c * kw, r * kh, (c + 1) * kw, (r + 1) * kh)
                    cropped = resized.crop(box)
                    key = r * cols + c
                    
                    current_device.set_key_image(key, cropped)
                    
    except Exception as e:
        logging.error(f"Error setting stretched image: {e}")
        send_json("error", message=f"Failed setting stretched image: {str(e)}")

def stdin_loop():
    """
    Main loop reading JSON instructions from stdin.
    """
    while True:
        line = sys.stdin.readline()
        if not line:
            # Stdin closed (e.g. Cables parent process terminated)
            break
            
        try:
            data = json.loads(line.strip())
            action = data.get("action")
            
            if action == "connect":
                connect_device()
            elif action == "set_key_image":
                set_key_image(data.get("key"), data.get("image"))
            elif action == "set_stretched_image":
                set_stretched_image(data.get("image"))
            elif action == "close":
                close_device()
                break
        except json.JSONDecodeError:
            logging.error("Received non-JSON stdin message")
        except Exception as e:
            logging.error(f"Error in stdin loop: {e}")

def main():
    if not dependencies_ok:
        send_json(
            "error",
            message="Missing Python dependencies. Please run: pip install git+https://github.com/tomekceszke/ajazz-akp03e.git Pillow hidapi"
        )
        sys.exit(1)
        
    logging.info("Soomfon Stream Controller bridge started.")
    send_json("info", status="started")
    
    try:
        stdin_loop()
    except KeyboardInterrupt:
        pass
    finally:
        close_device()

if __name__ == "__main__":
    main()
