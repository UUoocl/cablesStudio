# PythonScript

This Op executes and manages a Python script as a background process within the Cables standalone environment. It is ideal for running hardware monitors, long-running data processors, or scripts that interact with external services via SocketCluster.

## Inputs

- **Active**: Toggle button/checkbox to start or stop the Python process.
- **Script Path**: The absolute path to the `.py` file you want to execute.
- **Python Path**: The path to your Python executable (e.g., `python3`, `python`, or a path to a virtual environment).
- **Arguments**: Space-separated arguments to pass to the script.

## Outputs

- **Is Running**: Boolean indicating if the process is currently active.
- **Stdout**: The most recent string received from the script's standard output.
- **Stderr**: The most recent string received from the script's standard error (usually for errors or logs).
- **Exit Code**: The code returned by the process when it exits (e.g., `0` for success).

## Usage Tips

### Real-time Output
By default, Python buffers `stdout`. To ensure you receive data immediately in Cables, the Op sets the environment variable `PYTHONUNBUFFERED=1`. Alternatively, you can use `print(..., flush=True)` inside your Python script.

### Communication
While this Op provides `stdout` and `stderr`, complex communication (like receiving high-frequency mouse/keyboard events) should be handled via **SocketCluster**. The Python script can use the `socketcluster-client-python` library to publish data to topics that other Cables Ops can subscribe to.

### Cleanup
The Op automatically attempts to terminate the Python process if the Op is deleted from the patch or if the "Active" port is toggled off.
