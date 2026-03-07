import { parseHex, setupPalette, parseTints } from './pixelProcessor/colorMath';
import { getDitherMatrix } from './pixelProcessor/dithering';
import { processPixelColor } from './pixelProcessor/colorIteration';
import { renderAscii, renderCustomShapes, applyBloom, applyCRTRadialGradient, renderTimestamp } from './pixelProcessor/rendering';

export const processPixelArt = (video, ctx, width, height, config) => {
  const {
    pixelSize = 10, colorColors = 16, brightness = 1, contrast = 1, ratio = 'fullscreen', mirror = false, zoom = 1,
    panX = 0, panY = 0,
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

  // 1. Framing & Zoom Math
  const activeRatio = ratio || 'fullscreen';
  let sx = 0, sy = 0;
  let sw = video.videoWidth || video.width;
  let sh = video.videoHeight || video.height;

  let targetRatio;
  if (activeRatio === 'fullscreen') {
    targetRatio = window.innerWidth / window.innerHeight;
  } else if (activeRatio === 'original') {
    targetRatio = sw / sh;
  } else {
    const [targetW, targetH] = activeRatio.split(':').map(Number);
    targetRatio = targetW / targetH;
  }

  const videoRatio = sw / sh;
  if (activeRatio !== 'original') {
    if (videoRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = ((video.videoWidth || video.width) - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = ((video.videoHeight || video.height) - sh) / 2;
    }
  }

  const zsw = sw / zoom, zsh = sh / zoom;
  const zsx = sx + (sw - zsw) / 2 - panX; 
  const zsy = sy + (sh - zsh) / 2 - panY;

  const w = Math.max(1, Math.floor(width / pixelSize));
  const h = Math.max(1, Math.floor(height / pixelSize));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w; tempCanvas.height = h;
  const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tCtx) return;

  // 2. CSS Base Filters
  let filterStr = `brightness(${brightness}) contrast(${contrast})`;
  if (hueShift !== 0) filterStr += ` hue-rotate(${hueShift}deg)`;
  if (sepia > 0) filterStr += ` sepia(${sepia * 100}%)`;
  if (invert) filterStr += ` invert(100%)`;
  if (softFocus > 0) filterStr += ` blur(${softFocus * 5}px)`;

  tCtx.filter = filterStr;

  if (mirror) {
    tCtx.translate(w, 0);
    tCtx.scale(-1, 1);
  }

  // Draw Blurred Background
  const bgFilter = tCtx.filter;
  tCtx.filter = (bgFilter !== 'none' ? bgFilter + ' ' : '') + 'blur(25px) brightness(0.4) saturate(1.2)';
  
  const bgRatio = sw / sh;
  const canvasRatio = w / h;
  let bgW = w, bgH = h, bgX = 0, bgY = 0;
  
  if (bgRatio > canvasRatio) {
      bgW = h * bgRatio; bgX = (w - bgW) / 2;
  } else {
      bgH = w / bgRatio; bgY = (h - bgH) / 2;
  }
  
  tCtx.drawImage(video, 0, 0, video.videoWidth || video.width, video.videoHeight || video.height, bgX, bgY, bgW, bgH);

  // Draw Base Image
  tCtx.filter = bgFilter;
  tCtx.drawImage(video, zsx, zsy, zsw, zsh, 0, 0, w, h);

  // Symmetry Mode Handling
  if (symmetry !== 'none') {
    const symCanvas = document.createElement('canvas');
    symCanvas.width = w; symCanvas.height = h;
    const sCtx = symCanvas.getContext('2d');
    sCtx.drawImage(tempCanvas, 0, 0);

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
      tCtx.translate(w, 0); tCtx.scale(-1, 1);
      tCtx.drawImage(symCanvas, 0, 0, w / 2, h / 2, w / 2, 0, w / 2, h / 2);
      tCtx.translate(0, h); tCtx.scale(1, -1);
      tCtx.drawImage(symCanvas, 0, 0, w / 2, h / 2, w / 2, h / 2, w / 2, h / 2);
      tCtx.translate(w, 0); tCtx.scale(-1, 1);
      tCtx.drawImage(symCanvas, 0, 0, w / 2, h / 2, 0, h / 2, w / 2, h / 2);
      tCtx.restore();
    }
  }

  const imageData = tCtx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // 3. Pre-loop Setup (Optimizing calculations out of the main loop)
  // Sharpening
  if (sharpen > 0) {
    const w4 = w * 4;
    const amount = sharpen * 2;
    const original = new Uint8ClampedArray(data);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        for (let c = 0; c < 3; c++) {
          const val = original[i + c] * (1 + 4 * amount)
            - original[i - 4 + c] * amount - original[i + 4 + c] * amount
            - original[i - w4 + c] * amount - original[i + w4 + c] * amount;
          data[i + c] = Math.min(255, Math.max(0, val));
        }
      }
    }
  }

  // Pre-calculate config parameters for processPixelColor
  const activeTemp = temperature !== 0 ? temperature : 10; 
  const configParams = {
    caOffset: Math.floor(chromaticAberration),
    glitchMode, colorBleed,
    hasChromaKey: chromaKeyThreshold > 0,
    chromaThresholdAbs: chromaKeyThreshold * 255,
    ckC: parseHex(chromaKeyColor, 0, 255, 0),
    crC: parseHex(chromaKeyReplacement, 255, 179, 186),
    thermal, nightVision,
    hasEdgeDetection: edgeDetection,
    etFloor: Math.floor(edgeThickness), etCeil: Math.ceil(edgeThickness), edgeOpacity,
    eC: parseHex(customEdgeColor, 0, 0, 0),
    tempBoostR: Math.max(0, activeTemp) * 0.5, tempBoostB: Math.max(0, -activeTemp) * 0.5,
    tintBoostG: Math.max(0, -tint) * 0.5, tintBoostP: Math.max(0, tint) * 0.5,
    red, green, blue,
    parsedTints: parseTints(config.tints, tintColor, tintIntensity),
    vignette, filmGrain, noiseType, hdr,
    shadowTint, shC: parseHex(shadowTint, 0, 0, 0),
    highlightTint, hiC: parseHex(highlightTint, 255, 255, 255),
    shadows, highlights, saturation, colorBlind, monochrome,
    activePastel: {
      pink: { r: 255, g: 209, b: 220 }, blue: { r: 174, g: 198, b: 207 },
      yellow: { r: 253, g: 253, b: 150 }, mint: { r: 152, g: 255, b: 152 },
      lavender: { r: 203, g: 153, b: 201 }
    }[pastelOverlay] || null,
    pastelOverlayIntensity, colorWash, holographic, neonPastel, hueQuantization, lightnessQuantization, solarize,
    activeMatrix: getDitherMatrix(ditherMode).matrix,
    matrixSize: getDitherMatrix(ditherMode).size,
    useDither: ditherMode !== 'none',
    bayerLevel, colorColors,
    activePalette: setupPalette(palette, paletteShift),
    factor: 255 / Math.max(1, colorColors - 1),
    posterizeLevels, scanlines
  };

  const rxOffset = vhsDistortion > 0;
  const srcData = (configParams.caOffset > 0 || edgeDetection || glitchMode || rxOffset || colorBleed > 0) ? new Uint8ClampedArray(data) : data;
  const baseVhsShift = vhsDistortion > 0 ? performance.now() * 0.01 : 0;

  // 4. Main Pixel Processing Loop
  for (let y = 0; y < h; y++) {
    const yVhsShift = vhsDistortion > 0 ? Math.floor(Math.sin(y * 0.1 + baseVhsShift) * vhsDistortion * 20) : 0;

    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      // VHS Distortion Shift
      let srcX = x;
      if (vhsDistortion > 0) {
        srcX = Math.min(w - 1, Math.max(0, x + yVhsShift));
      }

      const srcI = (y * w + srcX) * 4;
      const [outR, outG, outB] = processPixelColor(
        srcData[srcI], srcData[srcI + 1], srcData[srcI + 2], 
        x, y, w, h, srcX, srcI, srcData,
        configParams
      );

      data[i] = outR;
      data[i + 1] = outG;
      data[i + 2] = outB;
    }
  }

  tCtx.putImageData(imageData, 0, 0);
  ctx.imageSmoothingEnabled = false;

  // 5. Post-Processing Context Draw Passes
  if (doubleExposure > 0) {
    if (!video.ghostCanvas) video.ghostCanvas = document.createElement('canvas');
    const ghost = video.ghostCanvas;
    if (ghost.width !== width || ghost.height !== height) {
      ghost.width = width; ghost.height = height;
    }
    const gCtx = ghost.getContext('2d');
    gCtx.globalAlpha = 1.0 - doubleExposure;
    gCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, width, height);
    ctx.drawImage(ghost, 0, 0);
  } else {
    const needsCustomDraw = pixelShape !== 'square' || gridOpacity > 0 || lcdEffect;
    if (asciiMode) {
      renderAscii(ctx, data, w, h, width, height, pixelSize);
    } else if (needsCustomDraw) {
      const gridColorParsed = parseHex(gridColor);
      renderCustomShapes(ctx, data, w, h, width, height, pixelSize, pixelShape, gridOpacity, gridColorParsed, lcdEffect);
    } else {
      ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, width, height);
    }
  }

  applyBloom(ctx, tempCanvas, w, h, width, height, bloom, dreamyGlow);

  if (crt) applyCRTRadialGradient(ctx, width, height);
  if (timestamp) renderTimestamp(ctx, width, height);
};
