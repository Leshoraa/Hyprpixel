export const renderAscii = (ctx, data, w, h, width, height, pixelSize) => {
  const pSize = Number(pixelSize);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);
  const chars = " .:-=+*#%@";
  ctx.font = `${Math.max(8, pSize * 1.5)}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const charIdx = Math.floor((luma / 255) * (chars.length - 1));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillText(chars[charIdx], (x * pSize) + pSize / 2, (y * pSize) + pSize / 2);
    }
  }
};

export const renderCustomShapes = (ctx, data, w, h, width, height, pixelSize, pixelShape, gridOpacity, gridColorParsed, lcdEffect) => {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  const pSize = Number(pixelSize);

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
          ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
        }
      }

      if (gridOpacity > 0) {
        ctx.fillStyle = `rgba(${gridColorParsed.r},${gridColorParsed.g},${gridColorParsed.b},${gridOpacity})`;
        ctx.fillRect(x * pSize, y * pSize, pSize, 1);
        ctx.fillRect(x * pSize, y * pSize, 1, pSize);
      }
    }
  }
};

export const applyBloom = (ctx, tempCanvas, w, h, width, height, bloom, dreamyGlow) => {
  const totalBloom = bloom + dreamyGlow;
  ctx.filter = `blur(${Math.max(2, totalBloom * 15)}px) brightness(${1 + bloom})`;
  if (dreamyGlow > 0) {
    ctx.filter += ` sepia(${dreamyGlow * 50}%) hue-rotate(-20deg) saturate(1.5)`;
  }
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = totalBloom;
  ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, width, height);
  ctx.filter = "none";
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1.0;
};

export const applyCRTRadialGradient = (ctx, width, height) => {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, height * 0.4, width / 2, height / 2, width * 0.6);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.8, "rgba(0,0,0,0.4)");
  gradient.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

export const renderTimestamp = (ctx, width, height) => {
  const now = new Date();
  const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const fontSize = Math.max(16, width * 0.03);
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = '#ff9900';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillText(str, width - fontSize, height - (fontSize * 0.5));
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
};
