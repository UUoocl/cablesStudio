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
if sys.platform == 'darwin':
    os.environ['PATH'] = '/opt/homebrew/bin:/usr/local/bin:' + os.environ.get('PATH', '')
    os.environ['DYLD_LIBRARY_PATH'] = f"/opt/homebrew/lib:/usr/local/lib:{os.environ.get('DYLD_LIBRARY_PATH', '')}"
    os.environ['DYLD_FALLBACK_LIBRARY_PATH'] = f"/opt/homebrew/lib:/usr/local/lib:{os.environ.get('DYLD_FALLBACK_LIBRARY_PATH', '')}"

# Preload libhidapi on macOS to help ctypes locate Homebrew installations
if sys.platform == 'darwin':
    search_paths = [
        '/opt/homebrew/lib/libhidapi.dylib',
        '/opt/homebrew/lib/libhidapi-libusb.dylib',
        '/usr/local/lib/libhidapi.dylib',
        '/usr/local/lib/libhidapi-libusb.dylib'
    ]
    for path in search_paths:
        if os.path.exists(path):
            try:
                ctypes.CDLL(path)
                logging.info(f"Successfully preloaded HIDAPI library: {path}")
                break
            except Exception as e:
                logging.error(f"Failed to preload HIDAPI at {path}: {e}")


# Import StreamDeck library and PIL dependencies safely
dependencies_ok = False
try:
    from StreamDeck.DeviceManager import DeviceManager
    from StreamDeck.ImageHelpers import PILHelper
    from PIL import Image
    dependencies_ok = True
except ImportError as e:
    logging.error(f"Failed to import dependencies: {e}")

# Global lock to serialize USB access to the Stream Deck
deck_lock = threading.Lock()
current_deck = None

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

def key_change_callback(deck, key, state):
    """
    Callback function registered with the Stream Deck device.
    Runs on a separate library thread when a button is pressed or released.
    """
    send_json("key_event", key=key, pressed=state)

def close_deck():
    """
    Safely close and reset the current Stream Deck.
    """
    global current_deck
    with deck_lock:
        if current_deck:
            try:
                logging.info("Resetting and closing Stream Deck...")
                current_deck.reset()
                current_deck.close()
            except Exception as e:
                logging.error(f"Error closing Stream Deck: {e}")
            current_deck = None
            send_json("disconnected")

def connect_deck(index=0):
    """
    Find and connect to the Stream Deck at the specified index.
    """
    global current_deck
    
    close_deck()
    
    try:
        manager = DeviceManager()
        decks = manager.enumerate()
        
        logging.info(f"Enumerated {len(decks)} Stream Deck(s).")
        
        if not decks:
            send_json("error", message="No Stream Decks connected.")
            return False
            
        if index < 0 or index >= len(decks):
            send_json("error", message=f"Device index {index} out of range (0-{len(decks)-1}).")
            return False
            
        deck = decks[index]
        
        with deck_lock:
            deck.open()
            deck.reset()
            
            # Retrieve specifications
            cols, rows = deck.key_layout()
            count = deck.key_count()
            model = deck.deck_type()
            
            # Get key image size if visual device
            key_w, key_h = 0, 0
            if deck.is_visual():
                key_w, key_h = deck.key_image_format()['size']
            
            # Register callback
            deck.set_key_callback(key_change_callback)
            current_deck = deck
            
        send_json(
            "connected",
            model=model,
            keys=count,
            rows=rows,
            cols=cols,
            key_width=key_w,
            key_height=key_h
        )
        return True
        
    except Exception as e:
        logging.error(f"Connection error: {e}")
        send_json("error", message=f"Failed to open device: {str(e)}")
        return False

def set_key_image(key_index, base64_image_str):
    """
    Update a single key with an image decoded from base64.
    """
    global current_deck
    if not current_deck:
        return
        
    try:
        # Decode base64 payload to PIL Image
        image_bytes = base64.b64decode(base64_image_str)
        img = Image.open(io.BytesIO(image_bytes))
        
        with deck_lock:
            if current_deck and current_deck.is_visual():
                native_img = PILHelper.to_native_key_format(current_deck, img)
                current_deck.set_key_image(key_index, native_img)
    except Exception as e:
        logging.error(f"Error setting key {key_index} image: {e}")
        send_json("error", message=f"Failed setting key {key_index}: {str(e)}")

def set_stretched_image(base64_image_str):
    """
    Decode a single image and tile it across all keys.
    """
    global current_deck
    if not current_deck:
        return
        
    try:
        image_bytes = base64.b64decode(base64_image_str)
        img = Image.open(io.BytesIO(image_bytes))
        
        with deck_lock:
            if not current_deck or not current_deck.is_visual():
                return
                
            cols, rows = current_deck.key_layout()
            kw, kh = current_deck.key_image_format()['size']
            
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
                    
                    native_img = PILHelper.to_native_key_format(current_deck, cropped)
                    current_deck.set_key_image(key, native_img)
                    
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
                connect_deck(data.get("device_index", 0))
            elif action == "set_key_image":
                set_key_image(data.get("key"), data.get("image"))
            elif action == "set_stretched_image":
                set_stretched_image(data.get("image"))
            elif action == "close":
                close_deck()
                break
        except json.JSONDecodeError:
            logging.error("Received non-JSON stdin message")
        except Exception as e:
            logging.error(f"Error in stdin loop: {e}")

def main():
    if not dependencies_ok:
        send_json(
            "error",
            message="Missing Python dependencies. Please run: pip install streamdeck Pillow"
        )
        sys.exit(1)
        
    logging.info("Stream Deck bridge started.")
    send_json("info", status="started")
    
    try:
        stdin_loop()
    except KeyboardInterrupt:
        pass
    finally:
        close_deck()

if __name__ == "__main__":
    main()
