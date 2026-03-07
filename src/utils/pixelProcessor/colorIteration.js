import { rgbToHsl, hslToRgb, getClosestColor } from './colorMath';

export const processPixelColor = (
  r, g, b, 
  x, y, w, h,
  srcX, srcI, srcData,
  configParams
) => {
  const {
    caOffset, glitchMode, colorBleed, hasChromaKey, ckC, crC, chromaThresholdAbs,
    thermal, nightVision, hasEdgeDetection, etFloor, etCeil, edgeOpacity, eC,
    tempBoostR, tempBoostB, tintBoostP, tintBoostG, red, green, blue, parsedTints,
    vignette, filmGrain, noiseType, hdr, shadowTint, shC, highlightTint, hiC,
    shadows, highlights, saturation, colorBlind, monochrome, activePastel, pastelOverlayIntensity,
    colorWash, holographic, neonPastel, hueQuantization, lightnessQuantization, solarize,
    useDither, activeMatrix, matrixSize, bayerLevel, colorColors, activePalette, factor, posterizeLevels, scanlines
  } = configParams;

  const cb10 = Math.floor(colorBleed * 10);

  // Chromatic Aberration & Data Bending Glitch
  if (caOffset > 0 || glitchMode || colorBleed > 0) {
    let maxOffset = caOffset;
    if (glitchMode && Math.random() > 0.98) maxOffset += Math.floor(Math.random() * 20); // random tearing

    const leftI = (y * w + Math.max(0, srcX - maxOffset - cb10)) * 4;
    const rightI = (y * w + Math.min(w - 1, srcX + maxOffset + cb10)) * 4;
    r = srcData[leftI];
    b = srcData[rightI + 2];

    if (glitchMode && Math.random() > 0.99) { // Color channel invert burst
      g = 255 - g;
    }
  }

  // Chroma Key (Green Screen)
  if (hasChromaKey) {
    const dR = r - ckC.r, dG = g - ckC.g, dB = b - ckC.b;
    if (dR * dR + dG * dG + dB * dB < chromaThresholdAbs * chromaThresholdAbs) {
      r = crC.r; g = crC.g; b = crC.b;
    }
  }

  // Thermal & Night Vision overrides base colors completely
  if (thermal) {
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
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
  if (hasEdgeDetection && srcX > etFloor && y > etFloor && srcX < w - etCeil && y < h - etCeil) {
    const t = (y - etCeil) * w * 4 + srcX * 4;
    const l = y * w * 4 + (srcX - etCeil) * 4;
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
  r = Math.min(255, Math.max(0, r + tempBoostR + tintBoostP)) | 0;
  g = Math.min(255, Math.max(0, g + tintBoostG)) | 0;
  b = Math.min(255, Math.max(0, b + tempBoostB + tintBoostP)) | 0;

  // RGB Channel Shifts
  if (red !== 0 || green !== 0 || blue !== 0) {
    r = Math.min(255, Math.max(0, r + red)) | 0;
    g = Math.min(255, Math.max(0, g + green)) | 0;
    b = Math.min(255, Math.max(0, b + blue)) | 0;
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

  // HDR Tone Mapping
  if (hdr > 0) {
    const hdrFactor = 1.0 + hdr * 2;
    r = 255 * (Math.max(0, r) / 255) ** (1 / hdrFactor);
    g = 255 * (Math.max(0, g) / 255) ** (1 / hdrFactor);
    b = 255 * (Math.max(0, b) / 255) ** (1 / hdrFactor);
  }

  // Luminance-based Highlights & Shadows & Tints
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;

  if (shadowTint !== '#000000' && luma < 128) {
    const shadowFactor = (1 - (luma / 128));
    r += (shC.r - r) * shadowFactor; g += (shC.g - g) * shadowFactor; b += (shC.b - b) * shadowFactor;
  }
  if (highlightTint !== '#ffffff' && luma >= 128) {
    const highlightFactor = ((luma - 128) / 127);
    r += (hiC.r - r) * highlightFactor; g += (hiC.g - g) * highlightFactor; b += (hiC.b - b) * highlightFactor;
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

  // Color Blindness Simulation
  if (colorBlind !== 'none') {
    const vR = r, vG = g, vB = b;
    if (colorBlind === 'protanopia') {
      r = 0.567 * vR + 0.433 * vG + 0.000 * vB; g = 0.558 * vR + 0.442 * vG + 0.000 * vB; b = 0.000 * vR + 0.242 * vG + 0.758 * vB;
    } else if (colorBlind === 'deuteranopia') {
      r = 0.625 * vR + 0.375 * vG + 0.000 * vB; g = 0.700 * vR + 0.300 * vG + 0.000 * vB; b = 0.000 * vR + 0.300 * vG + 0.700 * vB;
    } else if (colorBlind === 'tritanopia') {
      r = 0.950 * vR + 0.050 * vG + 0.000 * vB; g = 0.000 * vR + 0.433 * vG + 0.567 * vB; b = 0.000 * vR + 0.475 * vG + 0.525 * vB;
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
    let [hHSL, sHSL, lHSL] = rgbToHsl(r, g, b);
    if (holographic) {
      hHSL = (hHSL + (lHSL * 0.5)) % 1; // cycle hue based on luminance
      sHSL = Math.min(1, sHSL * 1.5);
    }
    if (neonPastel) {
      if (lHSL > 0.4) { sHSL = 1; lHSL = Math.min(1, lHSL * 1.2); } // pop light colors
    }
    if (hueQuantization > 0) {
      const steps = 360 / hueQuantization;
      hHSL = Math.round(hHSL * steps) / steps;
    }
    if (lightnessQuantization) {
      lHSL = Math.round(lHSL * 5) / 5;
    }
    [r, g, b] = hslToRgb(hHSL, sHSL, lHSL);
  }

  // Solarize
  if (solarize > 0) {
    const thresh = 255 * (1 - solarize);
    if (r > thresh) r = 255 - (r - thresh);
    if (g > thresh) g = 255 - (g - thresh);
    if (b > thresh) b = 255 - (b - thresh);
  }

  // Re-clamp
  r = r < 0 ? 0 : r > 255 ? 255 : r;
  g = g < 0 ? 0 : g > 255 ? 255 : g;
  b = b < 0 ? 0 : b > 255 ? 255 : b;

  // Dithering & Quantization
  let threshold = 0;
  if (useDither) {
    threshold = ((activeMatrix[y % matrixSize][x % matrixSize] / (matrixSize * matrixSize)) - 0.5) * (bayerLevel * 0.75);
  }
  
  // Lofi Contrast Curve
  r = r * 0.9 + 15;
  g = g * 0.9 + 15;
  b = b * 0.9 + 15;

  const ditherAdjustment = threshold * (255 / colorColors);

  let outR, outG, outB;
  if (activePalette) {
    const qR = Math.round((Math.max(0, Math.min(255, r + ditherAdjustment * 1.5)) / factor)) * factor;
    const qG = Math.round((Math.max(0, Math.min(255, g + ditherAdjustment * 1.5)) / factor)) * factor;
    const qB = Math.round((Math.max(0, Math.min(255, b + ditherAdjustment * 1.5)) / factor)) * factor;
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

  return [outR, outG, outB];
};
