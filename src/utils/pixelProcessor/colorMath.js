export const PALETTES = {
  // Lofi tweak: muted, earthier default colors
  default_cam: [[210, 215, 195], [180, 165, 135], [165, 105, 90], [100, 90, 85], [65, 75, 75], [40, 50, 55]],
  midnight7: [[250, 175, 160], [235, 100, 120], [175, 45, 95], [105, 20, 65], [60, 15, 55], [35, 10, 35], [15, 5, 20], [5, 5, 10]],
  ammo8: [[25, 30, 25], [35, 50, 45], [55, 80, 65], [90, 110, 95], [125, 150, 115], [175, 195, 135], [215, 225, 180], [240, 245, 225]],
  autumn8: [[240, 220, 180], [230, 170, 90], [200, 110, 60], [140, 70, 50], [120, 105, 60], [70, 80, 50], [45, 55, 45], [20, 30, 25]],
  brkfst8: [[240, 235, 190], [225, 195, 130], [205, 145, 95], [175, 95, 75], [135, 65, 55], [95, 50, 45], [65, 35, 35], [35, 20, 20]],
  dream8: [[55, 65, 185], [85, 65, 175], [125, 65, 155], [165, 75, 125], [205, 95, 105], [225, 135, 95], [235, 185, 105], [245, 225, 145]]
};

export const overlays = {
  pink: { r: 255, g: 209, b: 220 }, blue: { r: 174, g: 198, b: 207 },
  yellow: { r: 253, g: 253, b: 150 }, mint: { r: 152, g: 255, b: 152 },
  lavender: { r: 203, g: 153, b: 201 }
};

export const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
};

export const hslToRgb = (h, s, l) => {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
};

export const getClosestColor = (r, g, b, pal) => {
  let minD = Infinity;
  let closest = pal[0];
  for (const p of pal) {
    const dr = r - p[0], dg = g - p[1], db = b - p[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < minD) { minD = d; closest = p; }
  }
  return closest;
};

export const parseHex = (h, dR = 0, dG = 0, dB = 0) => {
  const hex = (h || '').replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16) || dR,
    g: parseInt(hex.substring(2, 4), 16) || dG,
    b: parseInt(hex.substring(4, 6), 16) || dB
  };
};

export const setupPalette = (paletteName, paletteShift) => {
  let activePalette = PALETTES[paletteName] || null;
  if (activePalette && paletteShift > 0) {
    const shifted = [];
    for (let i = 0; i < activePalette.length; i++) {
      shifted.push(activePalette[(i + paletteShift) % activePalette.length]);
    }
    activePalette = shifted;
  }
  return activePalette;
};

export const parseTints = (tints, defaultColor, defaultIntensity) => {
  const currentTints = tints || [{ color: defaultColor || '#ffffff', intensity: defaultIntensity || 0 }];
  return currentTints.map(t => {
    const c = parseHex(t.color, 255, 255, 255);
    return { ...c, int: (t.intensity || 0) / 100 };
  });
};
