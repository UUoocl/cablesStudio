import json
import os
import threading
import ctypes
import sys
import argparse
import time
from socketclusterclient import Socketcluster

# Global variables
# Note: Users might need to provide the absolute path to the dylib
lib_path = os.path.join(os.path.dirname(__file__), "libuvcutil.dylib")
uvc_lib = None
sc = None
connected = False

# --- UVC Library Interface ---
class UVCLib:
    def __init__(self, dylib_path):
        self.lib = None
        print(f"Attempting to load UVC library from: {dylib_path}")
        if os.path.exists(dylib_path):
            try:
                self.lib = ctypes.CDLL(dylib_path)
                
                # int uvclib_refresh_devices()
                self.lib.uvclib_refresh_devices.restype = ctypes.c_int
                
                # const char* uvclib_get_devices_json()
                self.lib.uvclib_get_devices_json.restype = ctypes.c_char_p
                
                # int uvclib_select_device(unsigned int index)
                self.lib.uvclib_select_device.argtypes = [ctypes.c_uint]
                self.lib.uvclib_select_device.restype = ctypes.c_int
                
                # const char* uvclib_get_controls_json()
                self.lib.uvclib_get_controls_json.restype = ctypes.c_char_p
                
                # const char* uvclib_get_value(const char* control_name)
                self.lib.uvclib_get_value.argtypes = [ctypes.c_char_p]
                self.lib.uvclib_get_value.restype = ctypes.c_char_p
                
                # const char* uvclib_set_value(const char* control_name, const char* value_str)
                self.lib.uvclib_set_value.argtypes = [ctypes.c_char_p, ctypes.c_char_p]
                self.lib.uvclib_set_value.restype = ctypes.c_char_p
                
                # Initial refresh
                self.lib.uvclib_refresh_devices()
                print("UVC library loaded successfully.")
                
            except Exception as e:
                print(f"Failed to load UVC library: {e}")
                self.lib = None
        else:
            print(f"UVC library file not found at: {dylib_path}")

    def is_loaded(self):
        return self.lib is not None

    def get_devices(self):
        if not self.lib: return []
        res_ptr = self.lib.uvclib_get_devices_json()
        if res_ptr:
            return json.loads(res_ptr.decode('utf-8'))
        return []

    def select_device(self, index):
        if not self.lib: return False
        return self.lib.uvclib_select_device(index) == 0

    def get_controls(self):
        if not self.lib: return []
        res_ptr = self.lib.uvclib_get_controls_json()
        if res_ptr:
            return json.loads(res_ptr.decode('utf-8'))
        return []

    def get_value(self, control):
        if not self.lib: return None
        res_ptr = self.lib.uvclib_get_value(control.encode('utf-8'))
        if res_ptr:
            return json.loads(res_ptr.decode('utf-8'))
        return None

    def set_value(self, control, value):
        if not self.lib: return None
        val_str = str(value)
        res_ptr = self.lib.uvclib_set_value(control.encode('utf-8'), val_str.encode('utf-8'))
        if res_ptr:
            return json.loads(res_ptr.decode('utf-8'))
        return None

def send_to_sc(data):
    if connected and sc:
        sc.emit("uvcResponse", data)

def process_command(payload):
    global uvc_lib
    if not uvc_lib or not uvc_lib.is_loaded():
        return {"error": "UVC library not loaded"}
        
    action = payload.get("action")
    
    if action == "list_devices":
        return {"action": "list_devices", "data": uvc_lib.get_devices()}
        
    elif action == "select_device":
        idx = payload.get("index")
        if idx is not None:
            success = uvc_lib.select_device(int(idx))
            return {"action": "select_device", "success": success}
        return {"error": "Missing index"}
        
    elif action == "get_controls":
        return {"action": "get_controls", "data": uvc_lib.get_controls()}
        
    elif action == "get_value":
        control = payload.get("control")
        if control:
            return {"action": "get_value", "data": uvc_lib.get_value(control)}
        return {"error": "Missing control name"}
        
    elif action == "set_value":
        control = payload.get("control")
        value = payload.get("value")
        if control and value is not None:
            return {"action": "set_value", "data": uvc_lib.set_value(control, value)}
        return {"error": "Missing control name or value"}
        
    return {"error": "Unknown action"}

def on_connect(socket):
    global connected
    connected = True
    print("Connected to SocketCluster")
    send_to_sc({"status": "connected", "lib_loaded": uvc_lib.is_loaded()})
    
    # Subscribe to commands
    socket.subscribe('uvcCommands')
    socket.onchannel('uvcCommands', on_uvc_command)

def on_disconnect(socket):
    global connected
    connected = False
    print("Disconnected from SocketCluster")

def on_connect_error(socket, error):
    print(f"Connection Error: {error}")

def on_uvc_command(key, data):
    print(f"Received command: {data}")
    try:
        response = process_command(data)
        if response:
            send_to_sc(response)
    except Exception as e:
        print(f"Error processing command: {e}")
        send_to_sc({"error": str(e)})

def main():
    global uvc_lib, lib_path, sc
    
    parser = argparse.ArgumentParser(description="UVC Utility SocketCluster Bridge")
    parser.add_argument("--url", type=str, default="ws://127.0.0.1:8000/socketcluster/", help="SocketCluster WebSocket URL")
    parser.add_argument("--lib", type=str, default=lib_path, help="Path to libuvcutil.dylib")
    args = parser.parse_args()
    
    lib_path = args.lib
    target_url = args.url
    
    print(f"Initializing UVC Bridge, connecting to {target_url}...")
    uvc_lib = UVCLib(lib_path)
    
    # Initialize SocketCluster
    sc = Socketcluster.socket(target_url)
    sc.setBasicListener(on_connect, on_disconnect, on_connect_error)
    sc.connect()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping bridge...")

if __name__ == "__main__":
    main()
