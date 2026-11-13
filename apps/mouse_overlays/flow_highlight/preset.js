var customPresets = {
  "default": {
    "splatRadius": 0.005,
    "splatForce": 6000,
    "fluidVorticity": 30,
    "fluidPressure": 0.8,
    "colorDiffusion": 0.98,
    "velocityDiffusion": 0.98,
    "splatColor": "#00f0ff"
  },
  "neon_flow": {
    "splatRadius": 0.008,
    "splatForce": 8000,
    "fluidVorticity": 45,
    "fluidPressure": 0.85,
    "colorDiffusion": 0.99,
    "velocityDiffusion": 0.99,
    "splatColor": "#ff007f"
  },
  "high_viscosity": {
    "splatRadius": 0.004,
    "splatForce": 3000,
    "fluidVorticity": 15,
    "fluidPressure": 0.6,
    "colorDiffusion": 0.94,
    "velocityDiffusion": 0.93,
    "splatColor": "#39ff14"
  },
  "rapid_dissolve": {
    "splatRadius": 0.006,
    "splatForce": 5000,
    "fluidVorticity": 20,
    "fluidPressure": 0.7,
    "colorDiffusion": 0.90,
    "velocityDiffusion": 0.92,
    "splatColor": "#ffaa00"
  },
  "intense_splat": {
    "splatRadius": 0.015,
    "splatForce": 9500,
    "fluidVorticity": 50,
    "fluidPressure": 0.95,
    "colorDiffusion": 0.995,
    "velocityDiffusion": 0.99,
    "splatColor": "#bf00ff"
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = customPresets;
}

