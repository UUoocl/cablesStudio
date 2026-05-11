import sys
import json
import time
import threading
import logging
from pynput import mouse

# Configure logging to stderr to keep stdout clean for JSON
logging.basicConfig(
    format='%(levelname)s:%(message)s', 
    level=logging.DEBUG,
    stream=sys.stderr
)

# Configuration
monitor_pos = sys.argv[1] == '1' if len(sys.argv) > 1 else True
monitor_clicks = sys.argv[2] == '1' if len(sys.argv) > 2 else True
monitor_scroll = sys.argv[3] == '1' if len(sys.argv) > 3 else True
target_pps = int(sys.argv[4]) if len(sys.argv) > 4 else 20
update_interval = 1.0 / target_pps

event_lock = threading.Lock()

# State
pending_move = None
pending_clicks = []
scroll_state = {"x": 0, "y": 0, "dx": 0.0, "dy": 0.0}

def send_message(msg_type, **kwargs):
    try:
        msg = {"type": msg_type}
        msg.update(kwargs)
        sys.stdout.write(json.dumps(msg) + '\n')
        sys.stdout.flush()
    except Exception as e:
        logging.error(f"Failed to send message: {e}")

def on_move(x, y):
    if not monitor_pos: return
    global pending_move
    with event_lock:
        pending_move = {"x": int(x), "y": int(y)}

def on_click(x, y, button, pressed):
    if not monitor_clicks: return
    btn_code = ""
    if button == mouse.Button.left: btn_code = "MB1"
    elif button == mouse.Button.right: btn_code = "MB2"
    elif button == mouse.Button.middle: btn_code = "MB3"
    
    if btn_code:
        with event_lock:
            pending_clicks.append({
                "button": btn_code,
                "x": int(x),
                "y": int(y),
                "pressed": pressed
            })

def on_scroll(x, y, dx, dy):
    if not monitor_scroll: return
    with event_lock:
        scroll_state["x"] = int(x)
        scroll_state["y"] = int(y)
        scroll_state["dx"] += dx
        scroll_state["dy"] += dy

def timer_loop():
    global pending_move
    while True:
        time.sleep(update_interval)
        
        move_to_send = None
        clicks_to_send = []
        scroll_to_send = None

        with event_lock:
            if pending_move:
                move_to_send = pending_move
                pending_move = None
            if pending_clicks:
                clicks_to_send = pending_clicks[:]
                pending_clicks.clear()
            if abs(scroll_state["dx"]) > 0.1 or abs(scroll_state["dy"]) > 0.1:
                scroll_to_send = {
                    "x": scroll_state["x"],
                    "y": scroll_state["y"],
                    "dx": int(scroll_state["dx"]),
                    "dy": int(scroll_state["dy"])
                }
                scroll_state["dx"] *= 0.8
                scroll_state["dy"] *= 0.8

        if move_to_send:
            send_message("mousePosition", data=move_to_send)
        for click in clicks_to_send:
            send_message("mouseClick", data=click)
        if scroll_to_send:
            send_message("mouseScroll", data=scroll_to_send)

def main():
    logging.info("Starting Cables GL Mouse Monitor (stdout mode)...")
    send_message("info", message="Mouse Monitor Started")
    
    timer_thread = threading.Thread(target=timer_loop, daemon=True)
    timer_thread.start()

    try:
        with mouse.Listener(on_move=on_move, on_click=on_click, on_scroll=on_scroll) as listener:
            listener.join()
    except Exception as e:
        logging.error(f"Mouse listener error: {e}")
    except KeyboardInterrupt:
        logging.info("Stopping Mouse Monitor...")

if __name__ == "__main__":
    main()
