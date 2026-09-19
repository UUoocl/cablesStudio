# Ops.Extension.Standalone.JsonLogicEngine

Evaluates JSON Logic rules against input facts with zero frame-loop overhead using precompiled native JavaScript expressions via `json-logic-engine`.

---

## Overview

The **JsonLogicEngine** op provides a declarative, JSON-driven rule engine for Cables patches. It allows you to define complex conditions, filters, and data transformations as serializable JSON data rather than hardcoded logic.

### High-Performance Precompilation Pattern
Evaluating JSON logic in real-time or high-frequency render loops (such as keyboard listeners, MIDI, OSC, gamepads, or render loops) can introduce CPU overhead if parsed repeatedly. 

This op uses the precompilation pattern:
1. **Compile Once on Change**: When **Rule JSON** changes, `inRules.onChange` runs `engine.build(ruleData)`, which compiles the JSON AST into an optimized native JavaScript function.
2. **Synchronous, Instant Evaluation**: When **Evaluate** is triggered, the op executes the precompiled function directly against **Input Facts**. Evaluation is synchronous and virtually overhead-free.

---

## Ports

### Inputs

| Port | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **Evaluate** | `Trigger` | - | Triggers immediate evaluation of the precompiled rule against **Input Facts**. |
| **Input Facts** | `Object` | `null` | The data context/facts against which the rule is evaluated (e.g., `{ key: "c", ctrl: false, type: "keydown" }`). Accepts objects or JSON strings. |
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

### 1. Simple Equality Check (e.g. Keyboard or Shortcut Match)

**Rule JSON:**
```json
{
  "==": [{ "var": "key" }, "c"]
}
```

**Input Facts:**
```json
{
  "key": "c",
  "ctrl": false,
  "type": "keydown"
}
```
- **Matched** triggers.
- **Is Matched** is `true`.
- **Result Payload** is `true`.

---

### 2. Compound Conditions (`and`, `or`, negation)

Match when `type` is `"keydown"`, `key` is `"s"`, `ctrl` is `true`, and `shift` is `false`:

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

### 3. Numeric Thresholds & Dynamic Branching

Check if player speed is over limit or health is critical:

**Rule JSON:**
```json
{
  "or": [
    { ">": [{ "var": "speed" }, 120] },
    { "<=": [{ "var": "health" }, 15] }
  ]
}
```

---

### 4. Conditional Output / Value Mapping (`if`)

JsonLogic rules can return arbitrary data instead of simple booleans:

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

**Input Facts:**
```json
{ "temperature": 82 }
```
- **Matched** triggers.
- **Result Payload** is `"OVERHEATING"`.

---

## Error Handling

- **Invalid JSON / Syntax Errors**: If **Rule JSON** contains malformed syntax or unrecognized operators, a UI warning badge is displayed on the op, and error details are logged to the console without interrupting the Cables runtime.
- **Null / Missing Inputs**: If rules or facts are not yet supplied, evaluation safely skips execution without throwing exceptions.
