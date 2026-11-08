# ObjectOfObjectsFilterByKeyValue (`Ops.Extension.Standalone.ObjectOfObjectsFilterByKeyValue`)

Filters an object of objects (a dictionary of child objects, such as a visualization client's `manifest.parameters` from [Ops.Extension.Standalone.ClientRegistry](file:///Users/jonwood/Github_local_dev/cablesStudio/ops/Ops.Extension.Standalone.ClientRegistry/Ops.Extension.Standalone.ClientRegistry.js)) by checking whether a specified property key inside each child object matches one or more target values.

## Overview

When mapping physical hardware controls such as MIDI CC knobs (`1..24`) to a visualization client's parameters, non-numeric properties like `"type": "color"` should be skipped so knobs map strictly to controllable properties (`"float"`, `"int"`, `"boolean"`).

`ObjectOfObjectsFilterByKeyValue` takes the parent dictionary and outputs:
- **`Filtered Object`**: Only the matching key-object entries.
- **`Filtered Keys`**: Ordered array of matching top-level parameter names (e.g., `["starSize", "starDecay", "maxStars", "disperseSpeed"]`).
- **`Filtered Values`**: Ordered array of the corresponding child parameter spec objects (`[{ type: "float", min: 1, max: 50, ... }, ...]`).
- **`Count`**: Number of matched entries.

## Ports

### Inputs
| Port | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **In Object** | `Object` | `null` | Parent object of child objects (e.g. `manifest.parameters`). |
| **Filter Key** | `String` | `"type"` | Child property key to inspect (supports dot-paths like `"meta.type"`). |
| **Filter Values** | `String` | `"float,int,boolean"` | Comma-separated list of target values to match. |
| **Filter Values Array** | `Array` | `null` | Optional array of target values; overrides **Filter Values** when linked. |
| **Mode** | `Dropdown` | `"Include Matching"` | `"Include Matching"` (keep matches) or `"Exclude Matching"` (discard matches). |
| **Case Sensitive** | `Boolean` | `false` | Whether string comparisons are case-sensitive. |

### Outputs
| Port | Type | Description |
| :--- | :--- | :--- |
| **Filtered Object** | `Object` | Dictionary containing only the matched child objects. |
| **Filtered Keys** | `Array` | Array of matched top-level keys in declaration order. |
| **Filtered Values** | `Array` | Array of matched child objects in declaration order. |
| **Count** | `Number` | Total count of matched entries. |

## Example

### Input (`In Object`)
```json
{
  "starSize": { "type": "float", "value": 10.0, "min": 1.0, "max": 50.0, "step": 0.5, "group": "Rendering" },
  "starDecay": { "type": "float", "value": 5.0, "min": 0.5, "max": 25.0, "step": 0.5, "group": "Rendering" },
  "maxStars": { "type": "int", "value": 500, "min": 10, "max": 2000, "step": 10, "group": "Simulation" },
  "disperseSpeed": { "type": "float", "value": 1.0, "min": 0.1, "max": 10.0, "step": 0.1, "group": "Simulation" },
  "colorMove": { "type": "color", "value": "#ffff00", "group": "Colors" },
  "colorMB1": { "type": "color", "value": "#ff00ff", "group": "Colors" }
}
```

### Configuration
- **Filter Key**: `"type"`
- **Filter Values**: `"float,int,boolean"`
- **Mode**: `"Include Matching"`

### Outputs
- **Filtered Keys**: `["starSize", "starDecay", "maxStars", "disperseSpeed"]`
- **Filtered Values**:
  ```json
  [
    { "type": "float", "value": 10.0, "min": 1.0, "max": 50.0, "step": 0.5, "group": "Rendering" },
    { "type": "float", "value": 5.0, "min": 0.5, "max": 25.0, "step": 0.5, "group": "Rendering" },
    { "type": "int", "value": 500, "min": 10, "max": 2000, "step": 10, "group": "Simulation" },
    { "type": "float", "value": 1.0, "min": 0.1, "max": 10.0, "step": 0.1, "group": "Simulation" }
  ]
  ```
- **Count**: `4`

