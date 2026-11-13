var customPresets = {
  "default": {
    "mode": "brush",
    "scrollMultiplier": 5
  },
  "brush": {
    "mode": "brush",
    "scrollMultiplier": 5
  },
  "line": {
    "mode": "line",
    "scrollMultiplier": 4
  },
  "dash": {
    "mode": "dash",
    "scrollMultiplier": 8
  },
  "worm": {
    "mode": "worm",
    "scrollMultiplier": 4
  },
  "turbo_brush": {
    "mode": "brush",
    "scrollMultiplier": 12
  },
  "slow_line": {
    "mode": "line",
    "scrollMultiplier": 2
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = customPresets;
}

