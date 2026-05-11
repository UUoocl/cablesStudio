# Scene Configs

Use these JSON snippets in your OBS Text Sources named `SceneConfig-{SceneName}`.

## Slide position

### full screen
```json
{
  "slideComponent": 
  {"x": 0, "y": 0, "scaleX": 1, "scaleY": 1}
}
```

### Top Left Quarter
```json
{
  "slideComponent": 
  {"x": 0, "y": 0, "scaleX": 0.5, "scaleY": 0.5}
}
```

### Top Right Quarter
```json
{
  "slideComponent": 
  {"x": 960, "y": 0, "scaleX": 0.5, "scaleY": 0.5}
}
```

### Bottom Left Quarter
```json
{
  "slideComponent": 
  {"x": 0, "y": 540, "scaleX": 0.5, "scaleY": 0.5}
}
```

### Bottom Right Quarter
```json
{
  "slideComponent": 
  {"x": 960, "y": 540, "scaleX": 0.5, "scaleY": 0.5}
}
```

## Slide Styling (CSS)

### Rounded Corners & Shadow
```json
{
  "slideComponent": {
    "style": {
      "borderRadius": "20px",
      "boxShadow": "0 10px 40px rgba(0,0,0,0.5)",
      "border": "2px solid rgba(255,255,255,0.2)"
    }
  }
}
```

### Circle Slide
```json
{
  "slideComponent": {
    "style": {
      "borderRadius": "50%"
    }
  }
}
```

### Grayscale / Blur Filter
```json
{
  "slideComponent": {
    "style": {
      "filter": "grayscale(100%) blur(2px)"
    }
  }
}
```

## Camera shapes

### Circle
```json
{
  "cameraComponent": {
    "path": "circle"
  }
}
```

### Square
```json
{
  "cameraComponent": {
    "path": "square"
  }
}
```

### pulse Circle
```json
{
  "cameraComponent": {
    "path": "pulsating-circle"
  }
}
```

### pulse Square
```json
{
  "cameraComponent": {
    "path": "pulsating-square"
  }
}
```

### None / Full Screen White
```json
{
  "cameraComponent": {
    "path": "none",
    "style": {
      "backgroundColor": "white"
    }
  }
}
```

### Custom Clip Path (Triangle)
```json
{
  "cameraComponent": {
    "path": "polygon(50% 0%, 0% 100%, 100% 100%)"
  }
}
```

## Move Transitions (Source Animation)

### 4. Move Transition (Animation)
Enable smooth lerping of sources between scenes. Add this to your `SceneConfig` to animate sources like "Main Camera".

```json
{
  "moveTransition": {
    "sources": ["Main Camera"],
    "duration": 500,
    "steps": 15,
    "ease": "bounce",
    "delay": 100
  }
}
```
- **sources**: List of source names to animate.
- **duration**: Animation time in milliseconds.
- **steps**: Number of intermediate frames (higher = smoother but more OBS load).
- **ease**: `linear`, `ease-in`, `ease-out`, or `bounce`.
- **delay**: (Optional) Milliseconds to wait after snapping before switching the scene (prevents flicker). Default is 100.

### Ease-In / Ease-Out
```json
{
  "moveTransition": {
    "sources": ["Main Camera"],
    "duration": 600,
    "steps": 15,
    "ease": "ease-out"
  }
}
```

## Full Production Example
```json
{
  "slideComponent": {
    "x": 100,
    "y": 100,
    "scaleX": 0.4,
    "scaleY": 0.4,
    "style": {
      "borderRadius": "10px",
      "boxShadow": "0 20px 50px rgba(0,0,0,0.6)"
    }
  },
  "cameraComponent": {
    "path": "pulsating-circle",
    "style": {
      "filter": "drop-shadow(0 0 10px white)"
    }
  }
}
```