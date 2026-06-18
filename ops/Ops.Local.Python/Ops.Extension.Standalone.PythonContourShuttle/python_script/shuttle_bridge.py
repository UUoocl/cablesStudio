import sys
import json
import logging
import time
import argparse
import ctypes
import os

# Configure logging to stderr to prevent interference with stdout
logging.basicConfig(
    format='%(levelname)s:%(message)s',
    level=logging.INFO,
    stream=sys.stderr
)

# Configure Homebrew search paths for ctypes find_library on macOS (to bypass SIP environment stripping)
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

    # Monkey-patch ctypes.LibraryLoader.LoadLibrary so subsequent imports of hid
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

def main():
    parser = argparse.ArgumentParser(description="Contour ShuttlePRO v2 WebSocket Bridge")
    parser.add_argument("--host", default="127.0.0.1", help="WebSocket host")
    parser.add_argument("--port", required=True, type=int, help="WebSocket port")
    args = parser.parse_args()

    # Safely import websocket-client and hidapi
    dependencies_ok = True
    missing_dep = None
    try:
        import websocket
        import hid
    except ImportError as e:
        dependencies_ok = False
        missing_dep = str(e)

    if not dependencies_ok:
        error_msg = f"Missing dependencies: {missing_dep}. Please run: pip install hidapi websocket-client"
        logging.error(error_msg)
        sys.stderr.write(error_msg + "\n")
        sys.exit(1)

    ws_url = f"ws://{args.host}:{args.port}"
    logging.info(f"Connecting to WebSocket server at {ws_url}...")

    ws = None
    for attempt in range(10):
        try:
            ws = websocket.create_connection(ws_url, timeout=2)
            logging.info("WebSocket connected!")
            break
        except Exception as e:
            logging.warning(f"Connection attempt {attempt+1} failed: {e}")
            time.sleep(0.5)

    if not ws:
        logging.error("Failed to connect to the WebSocket server.")
        sys.exit(1)

    VENDOR_ID = 0x0b33
    PRODUCT_ID = 0x0030 # Contour ShuttlePRO v2

    dev = None
    try:
        if hasattr(hid, 'device'):
            dev = hid.device()
            dev.open(VENDOR_ID, PRODUCT_ID)
            dev.set_nonblocking(True)
            product_name = dev.get_product_string() or "Contour ShuttlePRO v2"
        elif hasattr(hid, 'Device'):
            dev = hid.Device(vid=VENDOR_ID, pid=PRODUCT_ID)
            dev.nonblocking = True
            product_name = getattr(dev, 'product', None) or "Contour ShuttlePRO v2"
        else:
            raise AttributeError("Neither hid.device nor hid.Device was found in the 'hid' module.")

        logging.info(f"Connected to HID device: {product_name}")
        ws.send(json.dumps({"type": "info", "status": "connected", "device": product_name}))
    except Exception as e:
        error_msg = f"Failed to open ShuttlePRO v2: {e}. Is the device connected and the official companion driver closed?"
        logging.error(error_msg)
        try:
            ws.send(json.dumps({"type": "error", "message": error_msg}))
        except:
            pass
        ws.close()
        sys.exit(1)

    prev_jog = None
    prev_shuttle = None
    prev_buttons = [False] * 15

    logging.info("Starting events stream loop...")
    try:
        while True:
            # Read reports (non-blocking)
            data = dev.read(64)
            if data:
                if len(data) >= 5:
                    # Parse Shuttle ring (signed 8-bit, from -7 to 7)
                    shuttle_val = data[0]
                    if shuttle_val > 127:
                        shuttle_val -= 256

                    # Parse Jog wheel (uint8)
                    jog_val = data[1]

                    # Parse Buttons (bytes 3 and 4)
                    b_byte_1 = data[3]
                    b_byte_2 = data[4]

                    # 1. Send shuttle event if changed
                    if prev_shuttle is None or shuttle_val != prev_shuttle:
                        ws.send(json.dumps({
                            "type": "shuttle",
                            "value": shuttle_val
                        }))
                        prev_shuttle = shuttle_val

                    # 2. Send jog event if turned
                    if prev_jog is not None:
                        diff = jog_val - prev_jog
                        if diff > 128:
                            diff -= 256
                        elif diff < -128:
                            diff += 256
                        if diff != 0:
                            ws.send(json.dumps({
                                "type": "jog",
                                "delta": diff,
                                "value": jog_val
                            }))
                    prev_jog = jog_val

                    # 3. Check buttons
                    for i in range(8):
                        pressed = bool((b_byte_1 >> i) & 1)
                        if pressed != prev_buttons[i]:
                            prev_buttons[i] = pressed
                            ws.send(json.dumps({
                                "type": "button",
                                "index": i,
                                "pressed": pressed
                            }))

                    for i in range(8, 15):
                        pressed = bool((b_byte_2 >> (i - 8)) & 1)
                        if pressed != prev_buttons[i]:
                            prev_buttons[i] = pressed
                            ws.send(json.dumps({
                                "type": "button",
                                "index": i,
                                "pressed": pressed
                            }))

            time.sleep(0.005)

    except (websocket.WebSocketConnectionClosedException, ConnectionResetError):
        logging.info("WebSocket connection closed by parent server. Exiting.")
    except Exception as e:
        logging.error(f"Error in execution loop: {e}")
        try:
            ws.send(json.dumps({"type": "error", "message": str(e)}))
        except:
            pass
    finally:
        if dev:
            dev.close()
        try:
            ws.close()
        except:
            pass

if __name__ == "__main__":
    main()
