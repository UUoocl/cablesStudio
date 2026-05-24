import sys
import json
import logging
from pynput.mouse import Controller, Button

# Configure logging to stderr to keep stdout clean for JSON
logging.basicConfig(
    format='%(levelname)s:%(message)s', 
    level=logging.DEBUG,
    stream=sys.stderr
)

def send_message(msg_type, **kwargs):
    try:
        msg = {"type": msg_type}
        msg.update(kwargs)
        sys.stdout.write(json.dumps(msg) + '\n')
        sys.stdout.flush()
    except Exception as e:
        logging.error(f"Failed to send message: {e}")

def main():
    logging.info("Starting Cables GL Mouse Controller (stdin mode)...")
    send_message("info", message="Mouse Controller Started")
    
    try:
        mouse = Controller()
    except Exception as e:
        logging.error(f"Failed to initialize mouse controller: {e}")
        send_message("error", message=f"Init error: {e}")
        return

    # Map mouse button numbers (1 to 32) to pynput.mouse.Button enum
    button_map = {
        1: Button.left,
        2: Button.right,
        3: Button.middle
    }
    
    _BUTTON_NAMES = [
        'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
        'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty_one',
        'twenty_two', 'twenty_three', 'twenty_four', 'twenty_five',
        'twenty_six', 'twenty_seven', 'twenty_eight', 'twenty_nine',
        'thirty', 'thirty_one', 'thirty_two'
    ]
    
    for i, name in enumerate(_BUTTON_NAMES, start=4):
        if hasattr(Button, name):
            button_map[i] = getattr(Button, name)

    while True:
        line = sys.stdin.readline()
        if not line:
            break
        try:
            line_str = line.strip()
            if not line_str:
                continue
            cmd = json.loads(line_str)
            action = cmd.get("action")
            
            if action == "move":
                pos = cmd.get("position")
                if isinstance(pos, list) and len(pos) >= 2:
                    x, y = int(pos[0]), int(pos[1])
                    mouse.position = (x, y)
                    send_message("success", action="move", position=[x, y])
                else:
                    logging.warning(f"Invalid position format: {pos}")
            
            elif action == "click":
                btn_num = cmd.get("button")
                if btn_num in button_map:
                    btn = button_map[btn_num]
                    mouse.click(btn)
                    send_message("success", action="click", button=btn_num)
                else:
                    logging.warning(f"Invalid or unsupported button: {btn_num}")
                    
            elif action == "press":
                btn_num = cmd.get("button")
                if btn_num in button_map:
                    mouse.press(button_map[btn_num])
                    send_message("success", action="press", button=btn_num)
                    
            elif action == "release":
                btn_num = cmd.get("button")
                if btn_num in button_map:
                    mouse.release(button_map[btn_num])
                    send_message("success", action="release", button=btn_num)

            elif action == "scroll":
                scroll_delta = cmd.get("scroll")
                if isinstance(scroll_delta, list) and len(scroll_delta) >= 2:
                    dx, dy = int(scroll_delta[0]), int(scroll_delta[1])
                    mouse.scroll(dx, dy)
                    send_message("success", action="scroll", scroll=[dx, dy])
                else:
                    logging.warning(f"Invalid scroll format: {scroll_delta}")
                    
        except Exception as e:
            logging.error(f"Error handling command: {e}")
            send_message("error", message=str(e))

if __name__ == "__main__":
    main()
