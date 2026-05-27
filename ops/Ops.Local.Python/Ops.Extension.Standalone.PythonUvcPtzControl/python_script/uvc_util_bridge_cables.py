import json
import os
import threading
import ctypes
import sys
import argparse
import time

# Global variables
lib_path = os.path.join(os.path.dirname(__file__), "libuvcutil.dylib")
uvc_lib = None
configs = {} # name -> {index, polling, pps, last_poll, mapEnabled, mapMin, mapMax}
lock = threading.Lock()

def print_stderr(msg):
    sys.stderr.write(msg + '\n')
    sys.stderr.flush()

# --- UVC Library Interface ---
class UVCLib:
    def __init__(self, dylib_path):
        self.lib = None
        print_stderr(f"Attempting to load UVC library from: {dylib_path}")
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
                print_stderr("UVC library loaded successfully.")
                
            except Exception as e:
                print_stderr(f"Failed to load UVC library: {e}")
                self.lib = None
        else:
            print_stderr(f"UVC library file not found at: {dylib_path}")

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
        
        # The C library expects compound values formatted as {val1,val2,...}
        if isinstance(value, dict):
            val_str = "{" + ",".join(str(v) for v in value.values()) + "}"
        elif isinstance(value, list):
            val_str = "{" + ",".join(str(v) for v in value) + "}"
        elif isinstance(value, bool):
            val_str = "1" if value else "0"
        else:
            val_str = str(value)
            
        res_ptr = self.lib.uvclib_set_value(control.encode('utf-8'), val_str.encode('utf-8'))
        if res_ptr:
            return json.loads(res_ptr.decode('utf-8'))
        return None

def lerp(val, in_min, in_max, out_min, out_max):
    if in_max == in_min:
        return out_min
    res = (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min
    return round(float(res), 4)

def apply_mapping(control_data, config):
    if not config.get('mapEnabled'):
        return control_data
        
    out_min = config.get('mapMin', 0)
    out_max = config.get('mapMax', 1)
    
    if isinstance(control_data, list):
        for ctrl in control_data:
            _map_single_control(ctrl, out_min, out_max)
    else:
        _map_single_control(control_data, out_min, out_max)
        
    return control_data

def _map_single_control(ctrl, out_min, out_max):
    if 'current-value' not in ctrl or 'minimum' not in ctrl or 'maximum' not in ctrl:
        return
        
    val = ctrl['current-value']
    c_min = ctrl['minimum']
    c_max = ctrl['maximum']
    
    if isinstance(val, dict) and isinstance(c_min, dict) and isinstance(c_max, dict):
        mapped = {}
        for key in val:
            if key in c_min and key in c_max:
                mapped[key] = lerp(val[key], c_min[key], c_max[key], out_min, out_max)
        ctrl['mapped-value'] = mapped
    elif isinstance(val, (int, float)):
        ctrl['mapped-value'] = lerp(val, c_min, c_max, out_min, out_max)
        
def send_message(msg_type, **kwargs):
    try:
        msg = {"type": msg_type}
        msg.update(kwargs)
        sys.stdout.write(json.dumps(msg) + '\n')
        sys.stdout.flush()
    except Exception as e:
        print_stderr(f"Failed to send message: {e}")

def process_command(payload, device_index=None, config=None):
    global uvc_lib, lock
    if not uvc_lib or not uvc_lib.is_loaded():
        return {"error": "UVC library not loaded"}
        
    action = payload.get("action")
    
    with lock:
        if device_index is not None:
            uvc_lib.select_device(device_index)
            
        if action == "list_devices":
            uvc_lib.lib.uvclib_refresh_devices()
            return {"action": "list_devices", "data": uvc_lib.get_devices()}
            
        elif action == "get_controls":
            controls = uvc_lib.get_controls()
            if config:
                controls = apply_mapping(controls, config)
            return {"action": "get_controls", "data": controls}
            
        elif action == "get_value":
            control = payload.get("control")
            if control:
                val = uvc_lib.get_value(control)
                if config:
                    controls = uvc_lib.get_controls()
                    ctrl_meta = next((c for c in controls if c['name'] == control), None)
                    if ctrl_meta:
                        ctrl_meta['current-value'] = val
                        apply_mapping([ctrl_meta], config)
                        return {"action": "get_value", "control": control, "data": val, "mapped-value": ctrl_meta.get('mapped-value')}
                return {"action": "get_value", "control": control, "data": val}
            return {"error": "Missing control name"}
            
        elif action == "set_value":
            control = payload.get("control")
            value = payload.get("value")
            if control and value is not None:
                if isinstance(value, str) and value.strip().startswith('{'):
                    try:
                        value = json.loads(value)
                    except Exception as e:
                        print_stderr(f"[UVC Bridge] JSON parse error for value: {e}")
                
                res = uvc_lib.set_value(control, value)
                return {"action": "set_value", "control": control, "data": res}
            return {"error": "Missing control name or value"}
            
    return {"error": "Unknown action"}

def update_configs(device_list):
    global configs
    new_configs = {}
    for d in device_list:
        name = d.get('name', 'default')
        new_configs[name] = {
            'index': d.get('index', 0),
            'polling': d.get('pollingEnabled', False),
            'pps': d.get('pollsPerSecond', 1),
            'last_poll': 0,
            'mapEnabled': d.get('mapEnabled', False),
            'mapMin': d.get('mapMin', 0),
            'mapMax': d.get('mapMax', 1)
        }
    configs = new_configs
    send_message("config_updated", configs=list(configs.keys()))

def polling_loop():
    while True:
        now = time.time()
        items = list(configs.items())
        for name, config in items:
            if config['polling']:
                interval = 1.0 / max(0.1, config['pps'])
                if now - config['last_poll'] >= interval:
                    config['last_poll'] = now
                    try:
                        res = process_command({"action": "get_controls"}, device_index=config['index'], config=config)
                        if res and "data" in res:
                            send_message("uvc_poll", device=name, data=res['data'])
                        else:
                            print_stderr(f"Polling {name} failed: process_command returned {res}")
                    except Exception as e:
                        print_stderr(f"Polling loop error for {name}: {e}")
        time.sleep(0.01)

def stdin_loop():
    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            data = json.loads(line)
            action = data.get("action")
            
            if action == "configure":
                update_configs(data.get("devices", []))
            else:
                target_device = data.get("device_name", "default")
                config = configs.get(target_device)
                device_index = config['index'] if config else None
                response = process_command(data, device_index=device_index, config=config)
                if response:
                    send_message("uvcResponse", **response)
        except Exception as e:
            print_stderr(f"Error handling stdin message: {e}")

def main():
    global uvc_lib, lib_path
    
    parser = argparse.ArgumentParser(description="UVC Utility IO Bridge")
    parser.add_argument("--lib", type=str, default=lib_path, help="Path to libuvcutil.dylib")
    args = parser.parse_args()
    
    lib_path = args.lib
    
    print_stderr("Initializing UVC Bridge...")
    uvc_lib = UVCLib(lib_path)
    send_message("info", status="started", lib_loaded=uvc_lib.is_loaded())
    
    # Start polling thread
    pt = threading.Thread(target=polling_loop, daemon=True)
    pt.start()
    
    # Listen on stdin
    stdin_loop()

if __name__ == "__main__":
    main()
