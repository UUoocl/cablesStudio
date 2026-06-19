import sys
import json
import logging
import time
import threading
import os
import ctypes
import ctypes.util

# Configure logging to stderr to prevent interference with stdout JSON communication
logging.basicConfig(
    format='%(levelname)s:%(message)s',
    level=logging.INFO,
    stream=sys.stderr
)

# Configure Homebrew search paths for ctypes find_library on macOS
# This ensures pyusb can find libusb under Electron which strips env vars due to SIP
if sys.platform == 'darwin':
    os.environ['PATH'] = '/opt/homebrew/bin:/usr/local/bin:' + os.environ.get('PATH', '')
    os.environ['DYLD_LIBRARY_PATH'] = f"/opt/homebrew/lib:/usr/local/lib:{os.environ.get('DYLD_LIBRARY_PATH', '')}"
    os.environ['DYLD_FALLBACK_LIBRARY_PATH'] = f"/opt/homebrew/lib:/usr/local/lib:{os.environ.get('DYLD_FALLBACK_LIBRARY_PATH', '')}"
    
    # Pre-emptively load libusb if available
    search_paths = [
        '/opt/homebrew/lib/libusb-1.0.dylib',
        '/usr/local/lib/libusb-1.0.dylib'
    ]
    for path in search_paths:
        if os.path.exists(path):
            try:
                ctypes.CDLL(path)
                logging.info(f"Preloaded libusb: {path}")
                break
            except Exception as e:
                logging.error(f"Failed preloading libusb at {path}: {e}")

    # Monkey-patch ctypes.util.find_library for pyusb to locate the libusb library
    original_find_library = ctypes.util.find_library
    def patched_find_library(name):
        if name in ('usb-1.0', 'usb'):
            for path in search_paths:
                if os.path.exists(path):
                    return path
        return original_find_library(name)
    ctypes.util.find_library = patched_find_library

# Check dependencies
dependencies_ok = True
import_error_msg = ""
try:
    import usb.core
    import usb.util
except ImportError as e:
    dependencies_ok = False
    import_error_msg = str(e)

VID = 0x2dc8
PID = 0x2008

BUTTON_MAP = {
    0x0004: "Menu",
    0x0008: "View",
    0x0010: "A",
    0x0020: "B",
    0x0040: "X",
    0x0080: "Y",
    0x0100: "Dpad Up",
    0x0200: "Dpad Down",
    0x0400: "Dpad Left",
    0x0800: "Dpad Right",
    0x1000: "LB",
    0x2000: "RB",
    0x4000: "LS Click",
    0x8000: "RS Click",
}

# Threading Lock to prevent concurrent USB access
device_lock = threading.Lock()
rumble_seq = 0

def send_json(msg_type, **kwargs):
    """
    Formats and prints a JSON message to stdout.
    """
    try:
        msg = {"type": msg_type}
        msg.update(kwargs)
        sys.stdout.write(json.dumps(msg) + '\n')
        sys.stdout.flush()
    except Exception as e:
        logging.error(f"Failed to write JSON message: {e}")

def parse_input_packet(data):
    if len(data) < 5:
        return None
        
    cmd = data[0]
    if cmd == 0x07:
        down = data[4]
        key = data[5] if len(data) >= 6 else 0
        if key in (0x5b, 0x01):
            btn_name = "Guide"
            return {
                "buttons": [btn_name] if down == 0x01 else [],
                "lt": 0.0, "rt": 0.0,
                "ls": (0.0, 0.0), "rs": (0.0, 0.0)
            }
        return None
        
    if cmd != 0x20 or len(data) < 18:
        return None
        
    # Read buttons bitmask (16-bit little-endian starting at offset 4)
    buttons = data[4] | (data[5] << 8)
    
    # Read triggers (16-bit little-endian starting at offset 6 and 8, max 1023)
    lt_raw = data[6] | (data[7] << 8)
    rt_raw = data[8] | (data[9] << 8)
    
    # Normalize triggers to 0.0 .. 1.0
    lt = max(0.0, min(1.0, lt_raw / 1023.0))
    rt = max(0.0, min(1.0, rt_raw / 1023.0))
    
    # Read joysticks (16-bit signed little-endian)
    def to_signed_16(low, high):
        val = low | (high << 8)
        if val >= 32768:
            val -= 65536
        return val
        
    ls_x_raw = to_signed_16(data[10], data[11])
    ls_y_raw = to_signed_16(data[12], data[13])
    rs_x_raw = to_signed_16(data[14], data[15])
    rs_y_raw = to_signed_16(data[16], data[17])
    
    # Normalize sticks to -1.0 .. 1.0
    ls_x = max(-1.0, min(1.0, ls_x_raw / 32768.0))
    ls_y = max(-1.0, min(1.0, ls_y_raw / 32768.0))
    rs_x = max(-1.0, min(1.0, rs_x_raw / 32768.0))
    rs_y = max(-1.0, min(1.0, rs_y_raw / 32768.0))
    
    pressed = []
    for mask, name in BUTTON_MAP.items():
        if buttons & mask:
            pressed.append(name)
            
    # Check extra bytes for Guide/Share
    if len(data) >= 19:
        extra = data[18]
        if extra & 0x01:
            pressed.append("Guide")
        if extra & 0x02:
            pressed.append("Share")
            
    return {
        "buttons": pressed,
        "lt": lt,
        "rt": rt,
        "ls": (ls_x, ls_y),
        "rs": (rs_x, rs_y)
    }

def send_rumble(dev, left, right, left_trigger, right_trigger):
    global rumble_seq
    
    # Scale from float 0.0..1.0 to byte 0..255
    l_val = int(left * 255)
    r_val = int(right * 255)
    lt_val = int(left_trigger * 255)
    rt_val = int(right_trigger * 255)
    
    rumble_seq = (rumble_seq + 1) % 256
    
    packet = bytes([
        0x09,              # CMD: Rumble
        0x00,              # Substructure/Flags
        rumble_seq,
        0x09,              # Payload Length (9 bytes)
        0x00,              # Mode/Flags
        0x0F,              # Motor mask: All 4 motors
        lt_val,
        rt_val,
        l_val,
        r_val,
        0xFF,              # Duration (continuous)
        0x00,              # Delay
        0x00               # Repeat
    ])
    
    with device_lock:
        if dev:
            try:
                dev.write(0x01, packet, timeout=1000)
            except Exception as e:
                logging.error(f"Error writing rumble command: {e}")

def stdin_thread_func(dev_ref):
    """
    Listens for JSON commands on stdin in a background thread.
    """
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            data = json.loads(line.strip())
            action = data.get("action")
            
            if action == "rumble":
                left = data.get("left", 0.0)
                right = data.get("right", 0.0)
                lt = data.get("left_trigger", 0.0)
                rt = data.get("right_trigger", 0.0)
                
                dev = dev_ref[0]
                if dev:
                    send_rumble(dev, left, right, lt, rt)
            elif action == "close":
                break
        except Exception as e:
            logging.error(f"Error parsing stdin instruction: {e}")
            
    # Exit process cleanly if stdin closes or close requested
    os._exit(0)

def main():
    if not dependencies_ok:
        send_json("error", message=f"ImportError: {import_error_msg}. Please run: pip install pyusb")
        sys.exit(1)

    send_json("info", status="started")
    
    dev_ref = [None]
    
    # Start stdin reader thread
    t = threading.Thread(target=stdin_thread_func, args=(dev_ref,), daemon=True)
    t.start()
    
    while True:
        # 1. Search for Device
        dev = None
        try:
            dev = usb.core.find(idVendor=VID, idProduct=PID)
        except usb.core.NoBackendError:
            send_json("error", message="libusb not found. Please install libusb (e.g. brew install libusb).")
            time.sleep(2)
            continue
        except Exception as e:
            send_json("error", message=f"USB search failed: {e}")
            time.sleep(2)
            continue
            
        if dev is None:
            # Device not connected, sleep and try again
            time.sleep(1.0)
            continue
            
        # Device found!
        logging.info("Found controller.")
        
        # Claim and Handshake
        try:
            # Detach kernel driver if active
            try:
                if dev.is_kernel_driver_active(0):
                    dev.detach_kernel_driver(0)
            except Exception:
                pass

            # Configuration
            try:
                dev.set_configuration()
            except Exception:
                pass

            # Interface 0
            usb.util.claim_interface(dev, 0)
            
            # Wake up handshake sequence (GIP protocol promotion)
            dev.write(0x01, bytes([0x05, 0x20, 0x01, 0x01, 0x00]), timeout=1000)
            time.sleep(0.05)
            dev.write(0x01, bytes([0x0A, 0x20, 0x02, 0x03, 0x00, 0x01, 0x14]), timeout=1000)
            time.sleep(0.05)
            dev.write(0x01, bytes([0x06, 0x20, 0x03, 0x02, 0x01, 0x00]), timeout=1000)
            time.sleep(0.05)
            dev.write(0x01, bytes([0x09, 0x00, 0x04, 0x09, 0x00, 0x0F, 0x00, 0x00, 0x00, 0x00, 0xFF, 0x00, 0xEB]), timeout=1000)
            
            # Store in reference for the rumble thread
            with device_lock:
                dev_ref[0] = dev
                
            send_json("connected", device="8BitDo Lite SE 2.4G Xbox Controller")
            
        except Exception as e:
            send_json("error", message=f"Failed to claim interface: {e}. Is Chrome or another app using the controller?")
            time.sleep(2.0)
            continue
            
        # 2. Main Input Read Loop
        try:
            while True:
                data = None
                with device_lock:
                    if dev_ref[0] is None:
                        break
                    try:
                        # Read 64 bytes from Interrupt IN endpoint 0x81
                        data = dev.read(0x81, 64, timeout=100)
                    except usb.core.USBError as e:
                        # Timeout (60 or "timeout") is normal when controller is idle
                        if e.errno == 60 or "timeout" in str(e).lower():
                            pass
                        else:
                            # Re-raise to trigger disconnect recovery
                            raise e
                            
                if data:
                    parsed = parse_input_packet(data)
                    if parsed:
                        send_json("input", **parsed)
                        
                time.sleep(0.005)
                
        except Exception as e:
            logging.info(f"Controller disconnected: {e}")
        finally:
            with device_lock:
                dev_ref[0] = None
            try:
                usb.util.release_interface(dev, 0)
            except Exception:
                pass
            send_json("disconnected")
            time.sleep(1.0)

if __name__ == "__main__":
    main()
