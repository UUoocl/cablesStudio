var customPresets = {
  "default": {
    "zoom": 150,
    "lerpSpeed": 0.05,
    "floatScale": 1.0,
    "rotationSpeed": 0.005,
    "shininess": 20,
    "lightIntensity": 100
  },
  "close_up": {
    "zoom": 240,
    "lerpSpeed": 0.08,
    "floatScale": 0.6,
    "rotationSpeed": 0.003,
    "shininess": 35,
    "lightIntensity": 130
  },
  "fast_follower": {
    "zoom": 130,
    "lerpSpeed": 0.18,
    "floatScale": 1.4,
    "rotationSpeed": 0.012,
    "shininess": 25,
    "lightIntensity": 120
  },
  "zen": {
    "zoom": 160,
    "lerpSpeed": 0.02,
    "floatScale": 1.8,
    "rotationSpeed": 0.002,
    "shininess": 15,
    "lightIntensity": 90
  },
  "wide_orbit": {
    "zoom": 110,
    "lerpSpeed": 0.04,
    "floatScale": 2.2,
    "rotationSpeed": 0.008,
    "shininess": 30,
    "lightIntensity": 110
  },
  "mini": {
    "zoom": 80,
    "lerpSpeed": 0.06,
    "floatScale": 0.8,
    "rotationSpeed": 0.005,
    "shininess": 20,
    "lightIntensity": 100
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = customPresets;
}

