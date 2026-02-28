export const processPixelArt = (video, ctx, width, height, config) => {
  const {
    pixelSize = 10, colorColors = 16, brightness = 1, contrast = 1, ratio = 'fullscreen', mirror = false, zoom = 1,
    temperature = 0, tint = 0, saturation = 1, highlights = 0, shadows = 0,
    red = 0, green = 0, blue = 0, tintColor = '#ffffff', tintIntensity = 0
  } = config;

  const activeRatio = ratio || 'fullscreen';

  let sx = 0;
  let sy = 0;
  let sw = video.videoWidth;
  let sh = video.videoHeight;

  if (activeRatio !== 'fullscreen') {
    const [targetW, targetH] = activeRatio.split(':').map(Number);
    const targetRatio = targetW / targetH;
    const videoRatio = video.videoWidth / video.videoHeight;

    if (videoRatio > targetRatio) {
      sw = sh * targetRatio;
      sx = (video.videoWidth - sw) / 2;
    } else {
      sh = sw / targetRatio;
      sy = (video.videoHeight - sh) / 2;
    }
  }

  // Apply Digital Zoom
  const zsw = sw / zoom;
  const zsh = sh / zoom;
  const zsx = sx + (sw - zsw) / 2;
  const zsy = sy + (sh - zsh) / 2;

  const w = Math.max(1, Math.floor(width / pixelSize));
  const h = Math.max(1, Math.floor(height / pixelSize));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

  if (!tCtx) return;

  tCtx.filter = `brightness(${brightness}) contrast(${contrast})`;

  if (mirror) {
    tCtx.translate(w, 0);
    tCtx.scale(-1, 1);
  }

  tCtx.drawImage(video, zsx, zsy, zsw, zsh, 0, 0, w, h);

  const imageData = tCtx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // 4x4 Bayer Dithering Matrix
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  const factor = 255 / (colorColors - 1);
  const ditherSpread = 16;

  // Pre-calculate color grading multipliers
  const tempBoostR = Math.max(0, temperature) * 0.5;
  const tempBoostB = Math.max(0, -temperature) * 0.5;
  const tintBoostG = Math.max(0, -tint) * 0.5;
  const tintBoostP = Math.max(0, tint) * 0.5;

  // Dominant colors hex to rgb converter
  const currentTints = config.tints || [{ color: config.tintColor || '#ffffff', intensity: config.tintIntensity || 0 }];
  const parsedTints = currentTints.map(t => {
    const hex = (t.color || '#ffffff').replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16) || 255,
      g: parseInt(hex.substring(2, 4), 16) || 255,
      b: parseInt(hex.substring(4, 6), 16) || 255,
      int: (t.intensity || 0) / 100
    };
  });

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;

      const threshold = (bayerMatrix[y % 4][x % 4] / 16) - 0.5;
      const ditherAdjustment = threshold * ditherSpread;

      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // 1. Temperature & Tint
      r = Math.min(255, Math.max(0, r + tempBoostR + tintBoostP));
      g = Math.min(255, Math.max(0, g + tintBoostG));
      b = Math.min(255, Math.max(0, b + tempBoostB + tintBoostP));

      // 1.5. Pure RGB Channel Shifts
      if (red !== 0 || green !== 0 || blue !== 0) {
        r = Math.min(255, Math.max(0, r + red));
        g = Math.min(255, Math.max(0, g + green));
        b = Math.min(255, Math.max(0, b + blue));
      }

      // 1.8. Dominant Color Blending (Alpha mix)
      for (const t of parsedTints) {
        if (t.int > 0) {
          r = r + (t.r - r) * t.int;
          g = g + (t.g - g) * t.int;
          b = b + (t.b - b) * t.int;
        }
      }

      // 2. Luminance-based Highlights & Shadows (Approximation)
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      if (shadows !== 0 && luma < 128) {
        const shadowForce = (1 - (luma / 128)) * shadows;
        r += shadowForce;
        g += shadowForce;
        b += shadowForce;
      }

      if (highlights !== 0 && luma > 128) {
        const highlightForce = ((luma - 128) / 127) * highlights;
        r += highlightForce;
        g += highlightForce;
        b += highlightForce;
      }

      // 3. Saturation
      if (saturation !== 1) {
        const newLuma = 0.299 * r + 0.587 * g + 0.114 * b;
        r = newLuma + saturation * (r - newLuma);
        g = newLuma + saturation * (g - newLuma);
        b = newLuma + saturation * (b - newLuma);
      }

      // Re-clamp after manual CC
      r = Math.min(255, Math.max(0, r));
      g = Math.min(255, Math.max(0, g));
      b = Math.min(255, Math.max(0, b));

      // 4. Quantize / Dither based on updated values
      data[i] = Math.round((Math.max(0, Math.min(255, r + ditherAdjustment)) / factor)) * factor;
      data[i + 1] = Math.round((Math.max(0, Math.min(255, g + ditherAdjustment)) / factor)) * factor;
      data[i + 2] = Math.round((Math.max(0, Math.min(255, b + ditherAdjustment)) / factor)) * factor;
    }
  }

  tCtx.putImageData(imageData, 0, 0);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, width, height);
};
