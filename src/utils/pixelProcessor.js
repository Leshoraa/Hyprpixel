export const processPixelArt = (video, ctx, width, height, config) => {
  const {
    pixelSize = 10, colorColors = 16, brightness = 1, contrast = 1, ratio = 'fullscreen', mirror = false, zoom = 1,
    temperature = 0, tint = 0, saturation = 1, highlights = 0, shadows = 0,
    red = 0, green = 0, blue = 0, tintColor = '#ffffff', tintIntensity = 0,
    hdr = 0, palette = 'none', ditherMode = 'bayer4x4', crt = false, scanlines = 0, filmGrain = 0, vignette = 0,
    chromaticAberration = 0, bloom = 0, edgeDetection = false, customEdgeColor = '#000000', invert = false, hueShift = 0, sepia = 0, monochrome = false, sharpen = 0,
    symmetry = 'none', nightVision = false, thermal = false, doubleExposure = 0, colorBlind = 'none', glitchMode = false, asciiMode = false, timestamp = false,

    pixelShape = 'square', gridOpacity = 0, gridColor = '#ffd1dc',
    pastelOverlay = 'none', pastelOverlayIntensity = 0.5, softFocus = 0,
    lcdEffect = false, bayerLevel = 1, paletteShift = 0, shadowTint = '#000000',
    highlightTint = '#ffffff', vhsDistortion = 0, solarize = 0, posterizeLevels = 255,
    colorWash = 0, dreamyGlow = 0, neonPastel = false, holographic = false,
    chromaKeyColor = '#00ff00', chromaKeyThreshold = 0, chromaKeyReplacement = '#ffb3ba',
    edgeThickness = 1, edgeOpacity = 1, hueQuantization = 0, lightnessQuantization = false,
    colorBleed = 0, noiseType = 'white'
  } = config;

  const activeRatio = ratio || 'fullscreen';
  let sx = 0, sy = 0;
  let sw = video.videoWidth || video.width;
  let sh = video.videoHeight || video.height;

  if (activeRatio !== 'fullscreen') {
    const [targetW, targetH] = activeRatio.split(':').map(Number);
    const targetRatio = targetW / targetH;
    const videoRatio = sw / sh;

    if (videoRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = ((video.videoWidth || video.width) - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = ((video.videoHeight || video.height) - sh) / 2;
    }
  }

  // Apply Digital Zoom
  const zsw = sw / zoom, zsh = sh / zoom;
  const zsx = sx + (sw - zsw) / 2, zsy = sy + (sh - zsh) / 2;

  const w = Math.max(1, Math.floor(width / pixelSize));
  const h = Math.max(1, Math.floor(height / pixelSize));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tCtx) return;

  // CSS Filters for base adjustment and hue shift
  let filterStr = `brightness(${brightness}) contrast(${contrast})`;
  if (hueShift !== 0) filterStr += ` hue-rotate(${hueShift}deg)`;
  if (sepia > 0) filterStr += ` sepia(${sepia * 100}%)`;
  if (invert) filterStr += ` invert(100%)`;
  if (softFocus > 0) filterStr += ` blur(${softFocus * 5}px)`; // Soft Focus

  tCtx.filter = filterStr;

  if (mirror) {
    tCtx.translate(w, 0);
    tCtx.scale(-1, 1);
  }

  // Draw Initial Source
  tCtx.drawImage(video, zsx, zsy, zsw, zsh, 0, 0, w, h);

  // Symmetry Mode Handling
  if (symmetry !== 'none') {
    const symCanvas = document.createElement('canvas');
    symCanvas.width = w; symCanvas.height = h;
    const sCtx = symCanvas.getContext('2d');
    sCtx.drawImage(tempCanvas, 0, 0); // copy base

    if (symmetry === 'horizontal') {
      tCtx.save(); tCtx.translate(w, 0); tCtx.scale(-1, 1);
      tCtx.drawImage(symCanvas, 0, 0, w / 2, h, w / 2, 0, w / 2, h);
      tCtx.restore();
    } else if (symmetry === 'vertical') {
      tCtx.save(); tCtx.translate(0, h); tCtx.scale(1, -1);
      tCtx.drawImage(symCanvas, 0, 0, w, h / 2, 0, h / 2, w, h / 2);
      tCtx.restore();
    } else if (symmetry === 'quad') {
      tCtx.save();
      // Draw quad flipped
      tCtx.translate(w, 0); tCtx.scale(-1, 1);
      tCtx.drawImage(symCanvas, 0, 0, w / 2, h / 2, w / 2, 0, w / 2, h / 2); // TR
      tCtx.translate(0, h); tCtx.scale(1, -1);
      tCtx.drawImage(symCanvas, 0, 0, w / 2, h / 2, w / 2, h / 2, w / 2, h / 2); // BR
      tCtx.translate(w, 0); tCtx.scale(-1, 1);
      tCtx.drawImage(symCanvas, 0, 0, w / 2, h / 2, 0, h / 2, w / 2, h / 2); // BL
      tCtx.restore();
    }
  }

  // Double Exposure Overlay - Read from existing canvas before clear if persistent buffer needed
  // Since we don't have a persistent state inside the pure function, we inject ghosting buffer on the canvas node directly
  // handled at the very end.

  const imageData = tCtx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Apply Sharpening (Simple 3x3 Convolution on lightness approximation)
  if (sharpen > 0) {
    const w4 = w * 4;
    const amount = sharpen * 2; // strength multiplier
    const original = new Uint8ClampedArray(data);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val = original[i + c] * (1 + 4 * amount)
            - original[i - 4 + c] * amount
            - original[i + 4 + c] * amount
            - original[i - w4 + c] * amount
            - original[i + w4 + c] * amount;
          data[i + c] = Math.min(255, Math.max(0, val));
        }
      }
    }
  }

  // Dither Matrices
  const bayer2x2 = [[0, 2], [3, 1]];
  const bayer4x4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const bayer8x8 = [
    [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26], [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25], [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
  ];

  let activeMatrix = bayer4x4;
  let matrixSize = 4;

  if (ditherMode === 'bayer2x2') { activeMatrix = bayer2x2; matrixSize = 2; }
  else if (ditherMode === 'bayer8x8') { activeMatrix = bayer8x8; matrixSize = 8; }

  const useDither = ditherMode !== 'none';
  const factor = 255 / Math.max(1, colorColors - 1);

  // Pre-calculate color grading multipliers
  const tempBoostR = Math.max(0, temperature) * 0.5;
  const tempBoostB = Math.max(0, -temperature) * 0.5;
  const tintBoostG = Math.max(0, -tint) * 0.5;
  const tintBoostP = Math.max(0, tint) * 0.5;

  const currentTints = config.tints || [{ color: config.tintColor || '#ffffff', intensity: config.tintIntensity || 0 }];
  const parsedTints = currentTints.map(t => {
    const hex = (t.color || '#ffffff').replace('#', '');
    const rVal = parseInt(hex.substring(0, 2), 16);
    const gVal = parseInt(hex.substring(2, 4), 16);
    const bVal = parseInt(hex.substring(4, 6), 16);
    return {
      r: isNaN(rVal) ? 255 : rVal,
      g: isNaN(gVal) ? 255 : gVal,
      b: isNaN(bVal) ? 255 : bVal,
      int: (t.intensity || 0) / 100
    };
  });

  // HSL Helpers
  const rgbToHsl = (r, g, b) => {
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
  const hslToRgb = (h, s, l) => {
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

  const PALETTES = {
    catppuccin: [[30, 30, 46], [24, 24, 37], [205, 214, 244], [245, 194, 231], [203, 166, 247], [243, 139, 168], [250, 179, 135], [249, 226, 175], [166, 227, 161], [148, 226, 213], [137, 180, 250]],
    dracula: [[40, 42, 54], [68, 71, 90], [248, 248, 242], [139, 233, 253], [80, 250, 123], [255, 184, 108], [255, 121, 198], [189, 147, 249], [255, 85, 85], [241, 250, 140]],
    onedark: [[40, 44, 52], [171, 178, 191], [224, 108, 117], [190, 80, 70], [152, 195, 121], [229, 192, 123], [97, 175, 239], [198, 120, 221], [86, 182, 194]],
    nord: [[46, 52, 64], [76, 86, 106], [236, 239, 244], [136, 192, 208], [94, 129, 172], [191, 97, 106], [235, 203, 139], [163, 190, 140], [180, 142, 173]],
    gruvbox: [[40, 40, 40], [235, 219, 178], [204, 36, 29], [152, 151, 26], [215, 153, 33], [69, 133, 136], [177, 98, 134], [104, 157, 106], [214, 93, 14]],
    tokyonight: [[26, 27, 38], [192, 202, 245], [125, 207, 255], [122, 162, 247], [187, 154, 247], [247, 118, 142], [255, 158, 100], [224, 175, 104], [158, 206, 106]],
    rosepine: [[25, 23, 36], [31, 29, 46], [224, 222, 244], [235, 188, 186], [246, 193, 119], [156, 207, 216], [196, 167, 231]],
    everforest: [[43, 51, 57], [211, 198, 170], [230, 126, 128], [167, 192, 128], [219, 188, 127], [127, 187, 179], [214, 153, 182]],
    solarized: [[0, 43, 54], [7, 54, 66], [253, 246, 227], [238, 232, 213], [181, 137, 0], [203, 75, 22], [220, 50, 47], [211, 54, 130], [108, 113, 196], [38, 139, 210], [42, 161, 152], [133, 153, 0]],
    synthwave: [[43, 33, 58], [36, 27, 47], [255, 126, 219], [254, 68, 80], [255, 140, 0], [255, 232, 115], [54, 249, 246], [23, 178, 255]],
    sweetpastel: [[255, 179, 186], [255, 223, 186], [255, 255, 186], [186, 255, 201], [186, 225, 255], [220, 208, 255], [255, 255, 255]],
    matcha: [[236, 243, 232], [198, 223, 186], [159, 191, 148], [131, 166, 119], [90, 122, 80], [66, 94, 57], [45, 69, 38]],
    candycotton: [[241, 208, 226], [228, 193, 249], [208, 210, 249], [169, 222, 249], [202, 240, 248], [253, 240, 213]],
    sunset: [[42, 27, 61], [116, 40, 84], [180, 63, 94], [234, 105, 92], [250, 164, 118], [255, 214, 153]],
    monokai: [[39, 40, 34], [248, 248, 242], [249, 38, 114], [253, 151, 31], [230, 219, 116], [166, 226, 46], [102, 217, 239], [174, 129, 255]],
    horizon: [[28, 30, 38], [35, 37, 48], [250, 200, 99], [223, 82, 134], [38, 187, 217], [89, 233, 178], [190, 140, 250]],
    palenight: [[41, 45, 62], [130, 170, 255], [199, 146, 234], [137, 221, 255], [240, 113, 120], [255, 203, 107], [195, 232, 141], [255, 83, 112]],
    kanagawa: [[31, 31, 40], [220, 215, 186], [195, 64, 67], [118, 148, 106], [192, 163, 110], [126, 156, 216], [149, 127, 184], [106, 149, 137]],
    vaporwave: [[255, 113, 206], [1, 205, 254], [5, 255, 161], [185, 103, 255], [255, 251, 150], [42, 34, 74]],
    cyberpunk: [[253, 234, 46], [243, 85, 136], [5, 217, 232], [26, 224, 152], [54, 46, 126], [21, 14, 25]],
    gameboy: [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]],
    cga: [[0, 0, 0], [85, 255, 255], [255, 85, 255], [255, 255, 255]],
    default_cam: [[203, 210, 182], [185, 160, 125], [180, 115, 95], [105, 95, 85], [70, 80, 80], [45, 55, 55]],
    midnight7: [[250, 175, 160], [235, 100, 120], [175, 45, 95], [105, 20, 65], [60, 15, 55], [35, 10, 35], [15, 5, 20], [5, 5, 10]],
    ammo8: [[25, 30, 25], [35, 50, 45], [55, 80, 65], [90, 110, 95], [125, 150, 115], [175, 195, 135], [215, 225, 180], [240, 245, 225]],
    autumn8: [[240, 220, 180], [230, 170, 90], [200, 110, 60], [140, 70, 50], [120, 105, 60], [70, 80, 50], [45, 55, 45], [20, 30, 25]],
    brkfst8: [[240, 235, 190], [225, 195, 130], [205, 145, 95], [175, 95, 75], [135, 65, 55], [95, 50, 45], [65, 35, 35], [35, 20, 20]],
    dream8: [[55, 65, 185], [85, 65, 175], [125, 65, 155], [165, 75, 125], [205, 95, 105], [225, 135, 95], [235, 185, 105], [245, 225, 145]]
  };
  let activePalette = PALETTES[palette] || null;
  if (activePalette && paletteShift > 0) {
    const shifted = [];
    for (let i = 0; i < activePalette.length; i++) {
      shifted.push(activePalette[(i + paletteShift) % activePalette.length]);
    }
    activePalette = shifted;
  }

  // Closest Color helper for Palettes
  const getClosestColor = (r, g, b, pal) => {
    let minD = Infinity;
    let closest = pal[0];
    for (const p of pal) {
      const dr = r - p[0], dg = g - p[1], db = b - p[2];
      const d = dr * dr + dg * dg + db * db;
      if (d < minD) { minD = d; closest = p; }
    }
    return closest;
  };

  const caOffset = Math.floor(chromaticAberration);

  // Convert custom colors
  const parseHex = (h, dR = 0, dG = 0, dB = 0) => {
    const hex = (h || '').replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16) || dR,
      g: parseInt(hex.substring(2, 4), 16) || dG,
      b: parseInt(hex.substring(4, 6), 16) || dB
    };
  }
  const eC = parseHex(customEdgeColor, 0, 0, 0);
  const shC = parseHex(shadowTint, 0, 0, 0);
  const hiC = parseHex(highlightTint, 255, 255, 255);
  const ckC = parseHex(chromaKeyColor, 0, 255, 0);
  const crC = parseHex(chromaKeyReplacement, 255, 179, 186);

  const overlays = {
    pink: { r: 255, g: 209, b: 220 }, blue: { r: 174, g: 198, b: 207 },
    yellow: { r: 253, g: 253, b: 150 }, mint: { r: 152, g: 255, b: 152 },
    lavender: { r: 203, g: 153, b: 201 }
  };
  const activePastel = overlays[pastelOverlay] || null;

  // Create a copy of original for effects that need neighbor data
  const rxOffset = vhsDistortion > 0;
  const srcData = (caOffset > 0 || edgeDetection || glitchMode || rxOffset || colorBleed > 0) ? new Uint8ClampedArray(data) : data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // VHS Distortion Shift
      let srcX = x;
      if (vhsDistortion > 0) {
        const shift = Math.floor(Math.sin(y * 0.1 + performance.now() * 0.01) * vhsDistortion * 20);
        srcX = Math.min(w - 1, Math.max(0, x + shift));
      }

      // Chromatic Aberration & Data Bending Glitch
      let srcI = (y * w + srcX) * 4;
      let r = srcData[srcI];
      let g = srcData[srcI + 1];
      let b = srcData[srcI + 2];

      if (caOffset > 0 || glitchMode || colorBleed > 0) {
        let maxOffset = caOffset;
        if (glitchMode && Math.random() > 0.98) maxOffset += Math.floor(Math.random() * 20); // random tearing

        const leftI = (y * w + Math.max(0, srcX - maxOffset - Math.floor(colorBleed * 10))) * 4;
        const rightI = (y * w + Math.min(w - 1, srcX + maxOffset + Math.floor(colorBleed * 10))) * 4;
        r = srcData[leftI];
        b = srcData[rightI + 2];

        if (glitchMode && Math.random() > 0.99) { // Color channel invert burst
          g = 255 - g;
        }
      }

      // Chroma Key (Green Screen)
      if (chromaKeyThreshold > 0) {
        const dR = r - ckC.r, dG = g - ckC.g, dB = b - ckC.b;
        const dist = Math.sqrt(dR * dR + dG * dG + dB * dB);
        if (dist < chromaKeyThreshold * 255) {
          r = crC.r; g = crC.g; b = crC.b;
        }
      }

      // Thermal & Night Vision overrides base colors completely
      if (thermal) {
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        // Map luma to Blue -> Purple -> Red -> Yellow -> White
        if (luma < 0.2) { r = 0; g = 0; b = luma * 1275; }
        else if (luma < 0.4) { r = (luma - 0.2) * 1275; g = 0; b = 255; }
        else if (luma < 0.6) { r = 255; g = 0; b = 255 - (luma - 0.4) * 1275; }
        else if (luma < 0.8) { r = 255; g = (luma - 0.6) * 1275; b = 0; }
        else { r = 255; g = 255; b = (luma - 0.8) * 1275; }
      } else if (nightVision) {
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = 0;
        g = Math.min(255, luma * 1.5 + (Math.random() * 20)); // high noise green
        b = 0;
      }

      // Edge Detection (Sobel Approx)
      if (edgeDetection && srcX > Math.floor(edgeThickness) && y > Math.floor(edgeThickness) && srcX < w - Math.ceil(edgeThickness) && y < h - Math.ceil(edgeThickness)) {
        const t = (y - Math.ceil(edgeThickness)) * w * 4 + srcX * 4;
        const l = y * w * 4 + (srcX - Math.ceil(edgeThickness)) * 4;
        const cLuma = 0.3 * r + 0.59 * g + 0.11 * b;
        const tLuma = 0.3 * srcData[t] + 0.59 * srcData[t + 1] + 0.11 * srcData[t + 2];
        const lLuma = 0.3 * srcData[l] + 0.59 * srcData[l + 1] + 0.11 * srcData[l + 2];
        const edge = Math.abs(cLuma - tLuma) + Math.abs(cLuma - lLuma);
        if (edge > 40) {
          r = r * (1 - edgeOpacity) + eC.r * edgeOpacity;
          g = g * (1 - edgeOpacity) + eC.g * edgeOpacity;
          b = b * (1 - edgeOpacity) + eC.b * edgeOpacity;
        } else {
          r = Math.min(255, r + 20 * edgeOpacity); g = Math.min(255, g + 20 * edgeOpacity); b = Math.min(255, b + 20 * edgeOpacity);
        }
      }

      // Temperature & Tint
      r = Math.min(255, Math.max(0, r + tempBoostR + tintBoostP));
      g = Math.min(255, Math.max(0, g + tintBoostG));
      b = Math.min(255, Math.max(0, b + tempBoostB + tintBoostP));

      // RGB Channel Shifts
      if (red !== 0 || green !== 0 || blue !== 0) {
        r = Math.min(255, Math.max(0, r + red));
        g = Math.min(255, Math.max(0, g + green));
        b = Math.min(255, Math.max(0, b + blue));
      }

      // Dominant Color Blending
      for (const t of parsedTints) {
        if (t.int > 0) {
          r += (t.r - r) * t.int;
          g += (t.g - g) * t.int;
          b += (t.b - b) * t.int;
        }
      }

      // Vignette
      if (vignette > 0) {
        const dx = (x / w) - 0.5;
        const dy = (y / h) - 0.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const vig = Math.max(0, 1 - (dist * vignette * 2.5));
        r *= vig; g *= vig; b *= vig;
      }

      // Film Grain / Noise Overlay
      if (filmGrain > 0) {
        if (noiseType === 'pastel') {
          const noiseLevel = filmGrain * 100;
          r = Math.min(255, Math.max(0, r + (Math.random() * noiseLevel)));
          g = Math.min(255, Math.max(0, g + (Math.random() * noiseLevel * .5)));
          b = Math.min(255, Math.max(0, b + (Math.random() * noiseLevel)));
        } else if (noiseType === 'dark') {
          const noise = Math.random() * filmGrain * 150;
          r = Math.max(0, r - noise); g = Math.max(0, g - noise); b = Math.max(0, b - noise);
        } else {
          const noise = (Math.random() - 0.5) * filmGrain * 100;
          r += noise; g += noise; b += noise;
        }
      }

      // HDR Tone Mapping (Simulated Exposure/Sigmoid)
      if (hdr > 0) {
        const hdrFactor = 1.0 + hdr * 2;
        r = 255 * (Math.max(0, r) / 255) ** (1 / hdrFactor);
        g = 255 * (Math.max(0, g) / 255) ** (1 / hdrFactor);
        b = 255 * (Math.max(0, b) / 255) ** (1 / hdrFactor);
      }

      // Luminance-based Highlights & Shadows & Tints
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      if (shadowTint !== '#000000' && luma < 128) {
        const factor = (1 - (luma / 128));
        r += (shC.r - r) * factor; g += (shC.g - g) * factor; b += (shC.b - b) * factor;
      }
      if (highlightTint !== '#ffffff' && luma >= 128) {
        const factor = ((luma - 128) / 127);
        r += (hiC.r - r) * factor; g += (hiC.g - g) * factor; b += (hiC.b - b) * factor;
      }

      if (shadows !== 0 && luma < 128) {
        const shadowForce = (1 - (luma / 128)) * shadows;
        r += shadowForce; g += shadowForce; b += shadowForce;
      }
      if (highlights !== 0 && luma > 128) {
        const highlightForce = ((luma - 128) / 127) * highlights;
        r += highlightForce; g += highlightForce; b += highlightForce;
      }

      // Saturation
      if (saturation !== 1) {
        const newLuma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = newLuma + saturation * (r - newLuma);
        g = newLuma + saturation * (g - newLuma);
        b = newLuma + saturation * (b - newLuma);
      }

      // Color Blindness Simulation (Approximate matrices)
      if (colorBlind !== 'none') {
        const vR = r, vG = g, vB = b;
        if (colorBlind === 'protanopia') {
          r = 0.567 * vR + 0.433 * vG + 0.000 * vB;
          g = 0.558 * vR + 0.442 * vG + 0.000 * vB;
          b = 0.000 * vR + 0.242 * vG + 0.758 * vB;
        } else if (colorBlind === 'deuteranopia') {
          r = 0.625 * vR + 0.375 * vG + 0.000 * vB;
          g = 0.700 * vR + 0.300 * vG + 0.000 * vB;
          b = 0.000 * vR + 0.300 * vG + 0.700 * vB;
        } else if (colorBlind === 'tritanopia') {
          r = 0.950 * vR + 0.050 * vG + 0.000 * vB;
          g = 0.000 * vR + 0.433 * vG + 0.567 * vB;
          b = 0.000 * vR + 0.475 * vG + 0.525 * vB;
        }
      }

      // Monochrome
      if (monochrome) {
        const m = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = m;
      }

      // Pastel Overlay & Wash
      if (activePastel) {
        r = r * (1 - pastelOverlayIntensity) + activePastel.r * pastelOverlayIntensity;
        g = g * (1 - pastelOverlayIntensity) + activePastel.g * pastelOverlayIntensity;
        b = b * (1 - pastelOverlayIntensity) + activePastel.b * pastelOverlayIntensity;
      }
      if (colorWash > 0) {
        r = r * (1 - colorWash) + 255 * colorWash;
        g = g * (1 - colorWash) + 255 * colorWash;
        b = b * (1 - colorWash) + 255 * colorWash;
      }

      // Holographic & Neon & Quantization
      if (holographic || neonPastel || hueQuantization > 0 || lightnessQuantization) {
        let [h, s, l] = rgbToHsl(r, g, b);
        if (holographic) {
          h = (h + (l * 0.5)) % 1; // cycle hue based on luminance
          s = Math.min(1, s * 1.5);
        }
        if (neonPastel) {
          if (l > 0.4) { s = 1; l = Math.min(1, l * 1.2); } // pop light colors
        }
        if (hueQuantization > 0) {
          const steps = 360 / hueQuantization;
          h = Math.round(h * steps) / steps;
        }
        if (lightnessQuantization) {
          l = Math.round(l * 5) / 5;
        }
        [r, g, b] = hslToRgb(h, s, l);
      }

      // Solarize
      if (solarize > 0) {
        const thresh = 255 * (1 - solarize);
        if (r > thresh) r = 255 - (r - thresh);
        if (g > thresh) g = 255 - (g - thresh);
        if (b > thresh) b = 255 - (b - thresh);
      }

      // Re-clamp
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));

      // Dithering & Quantization
      let threshold = 0;
      if (useDither) {
        threshold = ((activeMatrix[y % matrixSize][x % matrixSize] / (matrixSize * matrixSize)) - 0.5) * bayerLevel;
      }
      const ditherAdjustment = threshold * (255 / colorColors);

      let outR, outG, outB;
      if (activePalette) {
        const qR = Math.round((Math.max(0, Math.min(255, r + ditherAdjustment * 2)) / factor)) * factor;
        const qG = Math.round((Math.max(0, Math.min(255, g + ditherAdjustment * 2)) / factor)) * factor;
        const qB = Math.round((Math.max(0, Math.min(255, b + ditherAdjustment * 2)) / factor)) * factor;
        const c = getClosestColor(qR, qG, qB, activePalette);
        outR = c[0]; outG = c[1]; outB = c[2];
      } else {
        outR = Math.round((Math.max(0, Math.min(255, r + ditherAdjustment)) / factor)) * factor;
        outG = Math.round((Math.max(0, Math.min(255, g + ditherAdjustment)) / factor)) * factor;
        outB = Math.round((Math.max(0, Math.min(255, b + ditherAdjustment)) / factor)) * factor;
      }

      // Posterize Override
      if (posterizeLevels < 255) {
        const pFactor = 255 / (posterizeLevels - 1);
        outR = Math.round(outR / pFactor) * pFactor;
        outG = Math.round(outG / pFactor) * pFactor;
        outB = Math.round(outB / pFactor) * pFactor;
      }

      // CRT Scanlines
      if (scanlines > 0) {
        const scanlineForce = (y % 2 === 0) ? (1 - scanlines * 0.5) : 1;
        outR *= scanlineForce; outG *= scanlineForce; outB *= scanlineForce;
      }

      data[i] = outR;
      data[i + 1] = outG;
      data[i + 2] = outB;
    }
  }

  tCtx.putImageData(imageData, 0, 0);

  ctx.imageSmoothingEnabled = false;

  // Double Exposure persistent buffer logic
  if (doubleExposure > 0) {
    if (!video.ghostCanvas) {
      video.ghostCanvas = document.createElement('canvas');
    }
    const ghost = video.ghostCanvas;

    // Resize ghost canvas if dimensions changed
    if (ghost.width !== width || ghost.height !== height) {
      ghost.width = width;
      ghost.height = height;
    }
    const gCtx = ghost.getContext('2d');

    // Draw current on top of ghost with opacity to fade older frames
    gCtx.globalAlpha = 1.0 - doubleExposure;
    gCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, width, height);

    ctx.drawImage(ghost, 0, 0);
  } else {
    // Custom Shapes & Grid
    const needsCustomDraw = pixelShape !== 'square' || gridOpacity > 0 || lcdEffect;

    if (asciiMode) {
      // Background dark
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, width, height);
      // ASCIIfy
      const chars = " .:-=+*#%@";
      ctx.font = `${Math.max(8, pixelSize * 1.5)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const charIdx = Math.floor((luma / 255) * (chars.length - 1));
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillText(chars[charIdx], (x * pixelSize) + pixelSize / 2, (y * pixelSize) + pixelSize / 2);
        }
      }
    } else if (needsCustomDraw) {
      // Background logic
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const pSize = pixelSize;
      // Convert grid color
      const gc = parseHex(gridColor);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];

          if (lcdEffect) {
            const subW = pSize / 3;
            ctx.fillStyle = `rgb(${r},0,0)`; ctx.fillRect(x * pSize, y * pSize, subW, pSize);
            ctx.fillStyle = `rgb(0,${g},0)`; ctx.fillRect(x * pSize + subW, y * pSize, subW, pSize);
            ctx.fillStyle = `rgb(0,0,${b})`; ctx.fillRect(x * pSize + subW * 2, y * pSize, subW, pSize);
          } else {
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            if (pixelShape === 'circle') {
              ctx.beginPath();
              ctx.arc(x * pSize + pSize / 2, y * pSize + pSize / 2, pSize / 2.2, 0, Math.PI * 2);
              ctx.fill();
            } else if (pixelShape === 'diamond') {
              ctx.beginPath();
              ctx.moveTo(x * pSize + pSize / 2, y * pSize);
              ctx.lineTo(x * pSize + pSize, y * pSize + pSize / 2);
              ctx.lineTo(x * pSize + pSize / 2, y * pSize + pSize);
              ctx.lineTo(x * pSize, y * pSize + pSize / 2);
              ctx.fill();
            } else {
              // square
              ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
            }
          }

          if (gridOpacity > 0) {
            ctx.fillStyle = `rgba(${gc.r},${gc.g},${gc.b},${gridOpacity})`;
            ctx.fillRect(x * pSize, y * pSize, pSize, 1);
            ctx.fillRect(x * pSize, y * pSize, 1, pSize);
          }
        }
      }
    } else {
      ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, width, height);
    }
  }

  // Bloom & Glow overlay 
  const totalBloom = bloom + dreamyGlow;
  if (totalBloom > 0 && !asciiMode) {
    ctx.filter = `blur(${Math.max(2, totalBloom * 15)}px) brightness(${1 + bloom})`;
    if (dreamyGlow > 0) {
      ctx.filter += ` sepia(${dreamyGlow * 50}%) hue-rotate(-20deg) saturate(1.5)`;
    }
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = totalBloom;
    ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, width, height);

    // Reset
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1.0;
  }

  // CRT Frame overlay
  if (crt) {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.4, width / 2, height / 2, width * 0.6);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.8, "rgba(0,0,0,0.4)");
    gradient.addColorStop(1, "rgba(0,0,0,0.8)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Retro Timestamp
  if (timestamp) {
    const now = new Date();
    const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const fontSize = Math.max(16, width * 0.03);
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#ff9900'; // Retro orange
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(str, width - fontSize, height - (fontSize * 0.5));
    // reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
};
