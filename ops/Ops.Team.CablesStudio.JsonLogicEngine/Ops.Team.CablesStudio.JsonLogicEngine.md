# Ops.Team.CablesStudio.JsonLogicEngine

Evaluates JSON Logic rules against input facts with zero frame-loop overhead in the **cables.gl website** browser environment using precompiled native JavaScript expressions via `json-logic-engine` imported from CDN.

---

## Overview

The **JsonLogicEngine** op provides a declarative, JSON-driven rule engine designed specifically for cables.gl patches. It allows you to build complex condition pipelines, MIDI / HID / OSC routing, game logic, and data transformations as serializable JSON rules without writing custom JavaScript code.

### Cables.gl CDN Module Import
This op references `json-logic-engine` directly via CDN as an ES Module following the [cables.gl libraries documentation](https://cables.gl/docs/5_writing_ops/dev_libraries/dev_libraries):
- **CDN Module URL**: `https://cdn.jsdelivr.net/npm/json-logic-engine@5.0.7/+esm`
- **Zero Local Attachments**: No local bundle or attachment files needed; the dependency is fetched and resolved in the browser at runtime.
- **Cables Dependency Ready**: Automatically integrates if configured via the Cables Op Dependency Manager ("Add Dependencies" -> "From URL" -> Type: "JS Module").

### High-Performance Precompilation Pattern
Evaluating JSON logic in real-time or high-frequency render loops (such as MIDI, WebHID, WebSockets, or render loops) can introduce CPU overhead if parsed repeatedly. 

This op uses the precompilation pattern:
1. **Compile Once on Edit**: When **Rule JSON** changes, `inRules.onChange` runs `engine.build(ruleData)`, which compiles the JSON AST once into an optimized native JavaScript function.
2. **Synchronous, Instant Evaluation**: When **Evaluate** is triggered, the op executes the precompiled function directly against **Input Facts**. Evaluation is synchronous and virtually overhead-free.

---

## Cables.gl Op Setup Guide

Follow these steps to create and configure this operator in the cables.gl web editor:

### Step 1: Create the Op
1. In your patch or team workspace, press `ESC` to open the Op search menu.
2. Click **Create Op**.
3. Set the name to `Ops.Team.CablesStudio.JsonLogicEngine` (or your personal/team namespace, e.g. `Ops.User.YourName.JsonLogicEngine`).

### Step 2: Add the CDN Module Dependency
Per the [cables.gl libraries documentation](https://cables.gl/docs/5_writing_ops/dev_libraries/dev_libraries):
1. In the Op properties panel on the right, click **Manage Op** &rarr; **Add Dependencies**.
2. Select the **From URL** tab.
3. Configure the dependency:
   - **URL**: `https://cdn.jsdelivr.net/npm/json-logic-engine@5.0.7/+esm`
   - **Type**: Select **`JS Module`** from the dropdown.
   - **Imported Variable Name**: Enter **`LogicEngine`** (or `jsonLogicEngine`).
4. Click **Add Dependency**.

> [!TIP]
> Even if you skip Step 2, the op code contains a built-in fallback that automatically performs dynamic native `import("https://cdn.jsdelivr.net/npm/json-logic-engine@5.0.7/+esm")` at runtime. Adding it as a cables dependency ensures it is pre-loaded before execution and bundled into patch exports.

### Step 3: Paste the Op Code
1. Open the op code editor in cables.gl.
2. Copy and paste the contents of [`Ops.Team.CablesStudio.JsonLogicEngine.js`](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Team.CablesStudio.JsonLogicEngine/Ops.Team.CablesStudio.JsonLogicEngine.js).
3. Save the op (`Ctrl+S` / `Cmd+S`).

### Step 4: Wire in Your Patch
1. Connect an event trigger (e.g. from a MIDI input, keyboard hook, or render loop) to **Evaluate**.
2. Connect your event payload object to **Input Facts**.
3. Supply a JSON Logic rule object or JSON string to **Rule JSON**.
4. Wire **Matched** or **Not Matched** triggers to downstream actions, and read **Result Payload**.

---

## Ports

### Inputs

| Port | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Evaluate** | `Trigger` | - | Triggers immediate evaluation of the precompiled rule against **Input Facts**. |
| **Input Facts** | `Object` | `null` | The data context/facts against which the rule is evaluated (e.g. MIDI note data, keyboard events, gamepad). Accepts objects or JSON strings. |
| **Rule JSON** | `Object` | `null` | The JSON Logic rule structure. Accepts parsed objects or raw JSON strings. Compiles automatically on change. |

### Outputs

| Port | Type | Description |
| :--- | :--- | :--- |
| **Matched** | `Trigger` | Fires when the rule evaluation produces a truthy result. |
| **Result Payload** | `Object` | The evaluated result of the rule (boolean, computed number, string, or payload object). |
| **Not Matched** | `Trigger` | Fires when the rule evaluation produces a falsy result. |
| **Is Matched** | `Boolean` | `true` if the evaluated result is truthy, `false` otherwise. |

---

## Example Usage

### 1. MIDI Note Event Routing

Match a Note On message for note 1 with maximum velocity (`127`), outputting `1` on match and `0` otherwise:

**Rule JSON:**
```json
{
  "if": [
    {
      "and": [
        { "==": [{ "var": "type" }, 144] },
        { "==": [{ "var": "note" }, 1] },
        { "==": [{ "var": "velocity" }, 127] }
      ]
    },
    1,
    0
  ]
}
```

**Input Facts (MIDI Note On):**
```json
{
  "deviceName": "WORLDE   ",
  "inputId": 0,
  "messageType": "Note",
  "index": 1,
  "value": 127,
  "cmd": 9,
  "channel": 0,
  "type": 144,
  "note": 1,
  "velocity": 127,
  "data": { "0": 144, "1": 1, "2": 127 },
  "newNote": [1, "C#-2 - 1"]
}
```
- **Matched** triggers.
- **Is Matched** is `true`.
- **Result Payload** is `1`.

---

### 2. Simple Boolean Match

Check if an incoming keyboard key is `"c"`:

**Rule JSON:**
```json
{
  "==": [{ "var": "key" }, "c"]
}
```

---

### 3. Multi-Criteria Combinations (`and`, `or`, `!`)

Trigger when user presses `s` with `ctrl` pressed, but without `shift`:

**Rule JSON:**
```json
{
  "and": [
    { "==": [{ "var": "type" }, "keydown"] },
    { "==": [{ "var": "key" }, "s"] },
    { "==": [{ "var": "ctrl" }, true] },
    { "!": [{ "var": "shift" }] }
  ]
}
```

---

### 4. Numeric Thresholds & Value Mapping

Map numeric telemetry or sensor data into discrete states:

**Rule JSON:**
```json
{
  "if": [
    { ">": [{ "var": "temperature" }, 75] },
    "OVERHEATING",
    "NORMAL"
  ]
}
```

---

### 5. Multi-Rule Evaluation & Routing

You can evaluate multiple rules in a single op execution using either a **Sequential Switch/Case Router** or **Parallel Rule Array**.

#### Option A: Multi-Case Switch Router (`if` - `elseif` - `else`)
Evaluates multiple rule conditions in order and returns the matching output value (or `null` if none match). Perfect for routing multiple MIDI notes or buttons to specific event names:

**Rule JSON:**
```json
{
  "if": [
    { "and": [{ "==": [{ "var": "type" }, 144] }, { "==": [{ "var": "note" }, 1] }] }, "PLAY_KICK",
    { "and": [{ "==": [{ "var": "type" }, 144] }, { "==": [{ "var": "note" }, 2] }] }, "PLAY_SNARE",
    { "and": [{ "==": [{ "var": "type" }, 144] }, { "==": [{ "var": "note" }, 3] }] }, "PLAY_HIHAT",
    null
  ]
}
```

**Input Facts (MIDI Note On 2):**
```json
{ "type": 144, "note": 2, "velocity": 127 }
```
- **Matched** triggers.
- **Is Matched** is `true`.
- **Result Payload** outputs `"PLAY_SNARE"`.

---

#### Option B: Parallel Array Rule Evaluation
Pass an array of multiple distinct rules. `json-logic-engine` compiles all rules and evaluates them simultaneously against the input facts, outputting an array of individual results:

**Rule JSON:**
```json
[
  { "==": [{ "var": "note" }, 1] },
  { ">": [{ "var": "velocity" }, 100] },
  { "==": [{ "var": "channel" }, 0] }
]
```

**Input Facts:**
```json
{ "note": 1, "velocity": 64, "channel": 0 }
```
- **Matched** triggers (since a non-empty array is truthy).
- **Result Payload** outputs `[ true, false, true ]`.

---

## Error Handling

- **CDN Loading Failures**: If the CDN module cannot be loaded, a UI error badge appears on the op explaining the failure.
- **Invalid JSON / Syntax Errors**: If **Rule JSON** contains malformed syntax or unrecognized operators, a UI error badge appears on the op and details are logged to the Cables console without crashing the patch.
- **Safe Fallbacks**: If inputs are not yet connected or facts are null, evaluations cleanly skip execution.
