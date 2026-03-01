import React, { useState, useCallback, useRef } from 'react';
import { CameraPreview } from './components/CameraPreview';
import './App.css';

const DEFAULT_CONFIG = {
  pixelSize: 2,
  colorColors: 8,
  brightness: 1,
  contrast: 1.2,
  ratio: 'fullscreen',
  mirror: false,
  zoom: 1,
  temperature: 0,
  tint: 0,
  saturation: 1,
  highlights: 0,
  shadows: 0,
  red: 0,
  green: 0,
  blue: 0,
  tints: [{ color: '#ffffff', intensity: 0 }],

  hdr: 0,
  palette: 'none',
  ditherMode: 'bayer4x4',
  crt: false,
  scanlines: 0,
  filmGrain: 0,
  vignette: 0,
  chromaticAberration: 0,
  bloom: 0,
  edgeDetection: false,
  customEdgeColor: '#000000',
  invert: false,
  hueShift: 0,
  sepia: 0,
  monochrome: false,
  sharpen: 0,
  grid: 'none',
  gridFlip: 0,
  timer: 0,
  flashlight: false,

  exportFormat: 'png',
  shutterSound: true,
  timestamp: false,
  fpsLimit: 0, // 0 means uncap
  symmetry: 'none',
  nightVision: false,
  thermal: false,
  asciiMode: false,
  colorBlind: 'none',
  doubleExposure: 0,
  glitchMode: false,

  // --- NEW 24+ FEATURES ---
  pixelShape: 'square', // square, circle, diamond
  gridOpacity: 0,
  gridColor: '#ffd1dc', // Pastel pink default
  pastelOverlay: 'none', // none, pink, blue, yellow, mint, lavender
  pastelOverlayIntensity: 0.5,
  softFocus: 0,
  lcdEffect: false,
  bayerLevel: 1,
  paletteShift: 0,
  shadowTint: '#000000',
  highlightTint: '#ffffff',
  vhsDistortion: 0,
  solarize: 0,
  posterizeLevels: 255, // 255 = off
  colorWash: 0,
  dreamyGlow: 0,
  neonPastel: false,
  holographic: false,
  chromaKeyColor: '#00ff00',
  chromaKeyThreshold: 0,
  chromaKeyReplacement: '#ffb3ba', // pastel replacement
  edgeThickness: 1,
  edgeOpacity: 1,
  hueQuantization: 0, // steps 0-360
  lightnessQuantization: false,
  colorBleed: 0,
  noiseType: 'white' // white, pastel, dark
};

function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [facingMode, setFacingMode] = useState('environment');
  const [captureFunc, setCaptureFunc] = useState(null);
  const [importedImage, setImportedImage] = useState(null);

  const [showControls, setShowControls] = useState(true);
  const [activeSlider, setActiveSlider] = useState(null);
  const [activeTab, setActiveTab] = useState('camera');
  const [timerCount, setTimerCount] = useState(null);

  // Dragging state
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartMousePos = useRef({ x: 0, y: 0 });
  const isMoved = useRef(false);

  // Audio Context for Retro Shutter Sound
  const audioCtxRef = useRef(null);
  const playShutterSound = () => {
    if (!config.shutterSound) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) { console.error('Audio capture error', e); }
  };

  const handleTintChange = (index, field, value) => {
    setConfig(prev => {
      const currentTints = prev.tints || [{ color: prev.tintColor || '#ffffff', intensity: prev.tintIntensity || 0 }];
      const newTints = [...currentTints];
      newTints[index] = { ...newTints[index], [field]: value };
      return { ...prev, tints: newTints };
    });
  };

  const addTint = () => {
    setConfig(prev => {
      const currentTints = prev.tints || [{ color: prev.tintColor || '#ffffff', intensity: prev.tintIntensity || 0 }];
      return {
        ...prev,
        tints: [...currentTints, { color: '#ffffff', intensity: 20 }]
      };
    });
  };

  const removeTint = (index) => {
    setConfig(prev => {
      const currentTints = prev.tints || [{ color: prev.tintColor || '#ffffff', intensity: prev.tintIntensity || 0 }];
      const newTints = currentTints.filter((_, i) => i !== index);
      return { ...prev, tints: newTints };
    });
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: isNaN(value) ? value : parseFloat(value)
    }));
  };

  const toggleMirror = () => {
    setConfig((prev) => ({ ...prev, mirror: !prev.mirror }));
  };

  const toggleCamera = () => {
    setFacingMode((prev) => {
      const newMode = prev === 'environment' ? 'user' : 'environment';
      // Automatically toggle mirror based on camera direction
      setConfig(c => ({ ...c, mirror: newMode === 'user' }));
      return newMode;
    });
  };

  const onCaptureReady = useCallback((fn) => {
    setCaptureFunc(() => fn);
  }, []);

  const handleCapture = () => {
    if (config.timer > 0) {
      setTimerCount(config.timer);
      let count = config.timer;
      const interval = setInterval(() => {
        count -= 1;
        setTimerCount(count);
        if (count <= 0) {
          clearInterval(interval);
          setTimerCount(null);
          executeCapture();
        }
      }, 1000);
    } else {
      executeCapture();
    }
  };

  const executeCapture = () => {
    if (captureFunc) {
      playShutterSound();
      const dataUrl = captureFunc();
      const link = document.createElement('a');
      link.href = dataUrl;
      const formatExt = config.exportFormat === 'jpeg' ? 'jpg' : config.exportFormat;
      link.download = `hyprpixel-${Date.now()}.${formatExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleImportImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setImportedImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImportedImage = () => setImportedImage(null);

  const startDragSlider = (name) => setActiveSlider(name);
  const stopDragSlider = () => setActiveSlider(null);

  const handleReset = () => {
    setConfig(prev => {
      const resetConfig = { ...prev };

      switch (activeTab) {
        case 'camera':
          resetConfig.ratio = DEFAULT_CONFIG.ratio;
          resetConfig.zoom = DEFAULT_CONFIG.zoom;
          resetConfig.grid = DEFAULT_CONFIG.grid;
          resetConfig.gridFlip = DEFAULT_CONFIG.gridFlip;
          resetConfig.timer = DEFAULT_CONFIG.timer;
          resetConfig.flashlight = DEFAULT_CONFIG.flashlight;
          resetConfig.exportFormat = DEFAULT_CONFIG.exportFormat;
          resetConfig.shutterSound = DEFAULT_CONFIG.shutterSound;
          resetConfig.timestamp = DEFAULT_CONFIG.timestamp;
          resetConfig.fpsLimit = DEFAULT_CONFIG.fpsLimit;
          break;
        case 'color':
          resetConfig.palette = DEFAULT_CONFIG.palette;
          resetConfig.tints = [...DEFAULT_CONFIG.tints];
          resetConfig.red = DEFAULT_CONFIG.red;
          resetConfig.green = DEFAULT_CONFIG.green;
          resetConfig.blue = DEFAULT_CONFIG.blue;
          resetConfig.hueShift = DEFAULT_CONFIG.hueShift;
          resetConfig.colorBlind = DEFAULT_CONFIG.colorBlind;
          resetConfig.pastelOverlay = DEFAULT_CONFIG.pastelOverlay;
          resetConfig.pastelOverlayIntensity = DEFAULT_CONFIG.pastelOverlayIntensity;
          resetConfig.colorWash = DEFAULT_CONFIG.colorWash;
          resetConfig.paletteShift = DEFAULT_CONFIG.paletteShift;
          resetConfig.neonPastel = DEFAULT_CONFIG.neonPastel;
          resetConfig.holographic = DEFAULT_CONFIG.holographic;
          resetConfig.shadowTint = DEFAULT_CONFIG.shadowTint;
          resetConfig.highlightTint = DEFAULT_CONFIG.highlightTint;
          resetConfig.hueQuantization = DEFAULT_CONFIG.hueQuantization;
          resetConfig.chromaKeyColor = DEFAULT_CONFIG.chromaKeyColor;
          resetConfig.chromaKeyThreshold = DEFAULT_CONFIG.chromaKeyThreshold;
          resetConfig.chromaKeyReplacement = DEFAULT_CONFIG.chromaKeyReplacement;
          break;
        case 'light':
          resetConfig.brightness = DEFAULT_CONFIG.brightness;
          resetConfig.contrast = DEFAULT_CONFIG.contrast;
          resetConfig.saturation = DEFAULT_CONFIG.saturation;
          resetConfig.temperature = DEFAULT_CONFIG.temperature;
          resetConfig.tint = DEFAULT_CONFIG.tint;
          resetConfig.highlights = DEFAULT_CONFIG.highlights;
          resetConfig.shadows = DEFAULT_CONFIG.shadows;
          resetConfig.hdr = DEFAULT_CONFIG.hdr;
          resetConfig.doubleExposure = DEFAULT_CONFIG.doubleExposure;
          resetConfig.solarize = DEFAULT_CONFIG.solarize;
          break;
        case 'pixel':
          resetConfig.pixelSize = DEFAULT_CONFIG.pixelSize;
          resetConfig.colorColors = DEFAULT_CONFIG.colorColors;
          resetConfig.ditherMode = DEFAULT_CONFIG.ditherMode;
          resetConfig.sharpen = DEFAULT_CONFIG.sharpen;
          resetConfig.edgeDetection = DEFAULT_CONFIG.edgeDetection;
          resetConfig.customEdgeColor = DEFAULT_CONFIG.customEdgeColor;
          resetConfig.invert = DEFAULT_CONFIG.invert;
          resetConfig.monochrome = DEFAULT_CONFIG.monochrome;
          resetConfig.pixelShape = DEFAULT_CONFIG.pixelShape;
          resetConfig.gridOpacity = DEFAULT_CONFIG.gridOpacity;
          resetConfig.gridColor = DEFAULT_CONFIG.gridColor;
          resetConfig.lcdEffect = DEFAULT_CONFIG.lcdEffect;
          resetConfig.bayerLevel = DEFAULT_CONFIG.bayerLevel;
          resetConfig.posterizeLevels = DEFAULT_CONFIG.posterizeLevels;
          resetConfig.lightnessQuantization = DEFAULT_CONFIG.lightnessQuantization;
          resetConfig.edgeThickness = DEFAULT_CONFIG.edgeThickness;
          resetConfig.edgeOpacity = DEFAULT_CONFIG.edgeOpacity;
          resetConfig.softFocus = DEFAULT_CONFIG.softFocus;
          break;
        case 'fx':
          resetConfig.symmetry = DEFAULT_CONFIG.symmetry;
          resetConfig.nightVision = DEFAULT_CONFIG.nightVision;
          resetConfig.thermal = DEFAULT_CONFIG.thermal;
          resetConfig.sepia = DEFAULT_CONFIG.sepia;
          resetConfig.chromaticAberration = DEFAULT_CONFIG.chromaticAberration;
          resetConfig.glitchMode = DEFAULT_CONFIG.glitchMode;
          resetConfig.crt = DEFAULT_CONFIG.crt;
          resetConfig.scanlines = DEFAULT_CONFIG.scanlines;
          resetConfig.filmGrain = DEFAULT_CONFIG.filmGrain;
          resetConfig.vignette = DEFAULT_CONFIG.vignette;
          resetConfig.bloom = DEFAULT_CONFIG.bloom;
          resetConfig.asciiMode = DEFAULT_CONFIG.asciiMode;
          resetConfig.vhsDistortion = DEFAULT_CONFIG.vhsDistortion;
          resetConfig.dreamyGlow = DEFAULT_CONFIG.dreamyGlow;
          resetConfig.colorBleed = DEFAULT_CONFIG.colorBleed;
          resetConfig.noiseType = DEFAULT_CONFIG.noiseType;
          break;
        default:
          break;
      }

      return resetConfig;
    });
  };

  // Panel Dragging Handlers
  const handlePanelPointerDown = (e) => {
    if (e.target.closest('.panel-handle') || e.target.closest('.control-header')) {
      setIsDraggingPanel(true);
      isMoved.current = false;
      dragStartPos.current = { ...panelPos };
      dragStartMousePos.current = { x: e.clientX, y: e.clientY };
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePanelPointerMove = (e) => {
    if (isDraggingPanel) {
      const dx = e.clientX - dragStartMousePos.current.x;
      const dy = e.clientY - dragStartMousePos.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isMoved.current = true;
      }

      // Calculate new positions
      let newX = dragStartPos.current.x + dx;
      let newY = dragStartPos.current.y + dy;

      // Screen boundaries constraints
      const maxX = window.innerWidth / 2 - 20;
      const maxY = window.innerHeight - 100;

      // Clamp values
      newX = Math.max(-maxX, Math.min(maxX, newX));
      newY = Math.max(-maxY, Math.min(200, newY)); // allow dragging down more than up

      setPanelPos({ x: newX, y: newY });
    }
  };

  const handlePanelPointerUp = (e) => {
    if (isDraggingPanel) {
      setIsDraggingPanel(false);
      e.target.releasePointerCapture(e.pointerId);
      if (!isMoved.current && e.target.closest('.panel-handle')) {
        // Trigger close
        setShowControls(false);
        setPanelPos({ x: 0, y: 0 });
      }
    }
  };

  const toggleControls = () => {
    if (showControls) {
      setPanelPos({ x: 0, y: 0 });
    }
    setShowControls(!showControls);
  };

  const renderSlider = (name, label, min, max, step, formatFn = v => v) => (
    <div className={`control-group ${activeSlider === name ? 'active-group' : ''}`}>
      <label>{label}: {formatFn(config[name])}</label>
      <input
        type="range"
        name={name}
        min={min} max={max} step={step}
        value={config[name]}
        onChange={handleConfigChange}
        onPointerDown={() => startDragSlider(name)}
        onPointerUp={stopDragSlider}
        onTouchStart={() => startDragSlider(name)}
        onTouchEnd={stopDragSlider}
      />
    </div>
  );

  const getGridStyle = () => {
    const base = {
      position: 'absolute', top: '50%', left: '50%',
      pointerEvents: 'none', zIndex: 10,
      width: '100%', height: '100%',
      transform: 'translate(-50%, -50%)'
    };

    if (config.ratio === 'fullscreen') {
      return base;
    }

    const [w, h] = config.ratio.split(':').map(Number);
    const ratio = w / h;

    base.maxWidth = `calc(100vh * ${ratio})`;
    base.maxHeight = `calc(100vw / ${ratio})`;
    base.aspectRatio = `${ratio}`;
    return base;
  };

  const spiralProps = (() => {
    let baseOffset = 0;
    if (config.ratio === 'fullscreen') {
      baseOffset = window.innerHeight > window.innerWidth ? 1 : 0;
    } else if (config.ratio !== '1:1') {
      const parts = config.ratio.split(':');
      baseOffset = parseInt(parts[1]) > parseInt(parts[0]) ? 1 : 0;
    }
    const t = (config.gridFlip || 0) + baseOffset;
    let vb = "0 0 1618 1000", m = "matrix(1,0,0,1,0,0)";
    switch (t % 8) {
      case 0: vb = "0 0 1618 1000"; m = "matrix(1,0,0,1,0,0)"; break;
      case 1: vb = "0 0 1000 1618"; m = "matrix(0,1,-1,0,1000,0)"; break;
      case 2: vb = "0 0 1618 1000"; m = "matrix(-1,0,0,-1,1618,1000)"; break;
      case 3: vb = "0 0 1000 1618"; m = "matrix(0,-1,1,0,0,1618)"; break;
      case 4: vb = "0 0 1618 1000"; m = "matrix(-1,0,0,1,1618,0)"; break;
      case 5: vb = "0 0 1000 1618"; m = "matrix(0,1,1,0,0,0)"; break;
      case 6: vb = "0 0 1618 1000"; m = "matrix(1,0,0,-1,0,1000)"; break;
      case 7: vb = "0 0 1000 1618"; m = "matrix(0,-1,-1,0,1000,1618)"; break;
    }
    return { vb, m };
  })();

  const panelStyle = showControls ? {
    transform: `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px)`,
    transition: isDraggingPanel || activeSlider ? 'none' : undefined
  } : {};

  return (
    <div className="app-container">
      <div className="preview-wrapper" onClick={toggleControls}>
        <CameraPreview config={config} onCaptureReady={onCaptureReady} facingMode={facingMode} importedImage={importedImage} />
        {config.grid && config.grid !== 'none' && (
          <div style={getGridStyle()}>
            {(config.grid === 'thirds' || config.grid === true) && (
              <><div className="grid-hline" style={{ top: '33.33%' }} /><div className="grid-hline" style={{ top: '66.66%' }} /><div className="grid-vline" style={{ left: '33.33%' }} /><div className="grid-vline" style={{ left: '66.66%' }} /></>
            )}
            {config.grid === 'golden' && (
              <><div className="grid-hline" style={{ top: '38.2%' }} /><div className="grid-hline" style={{ top: '61.8%' }} /><div className="grid-vline" style={{ left: '38.2%' }} /><div className="grid-vline" style={{ left: '61.8%' }} /></>
            )}
            {config.grid === 'crosshair' && (
              <><div className="grid-hline" style={{ top: '50%' }} /><div className="grid-vline" style={{ left: '50%' }} /></>
            )}
            {config.grid === 'spiral' && (
              <svg viewBox={spiralProps.vb} preserveAspectRatio="none" style={{ width: '100%', height: '100%', opacity: 0.8 }}>
                <g transform={spiralProps.m}>
                  <path vectorEffect="nonScalingStroke" d="M 1618 1000 A 1000 1000 0 0 0 618 0 A 618 618 0 0 0 0 618 A 382 382 0 0 0 382 1000 A 236 236 0 0 0 618 764 A 146 146 0 0 0 472 618 A 90 90 0 0 0 382 708 A 56 56 0 0 0 438 764 A 34 34 0 0 0 472 730" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
                </g>
              </svg>
            )}
          </div>
        )}
        {timerCount !== null && <div className="timer-display">{timerCount}</div>}
      </div>

      <div className="capture-bar">
        {importedImage ? (
          <div style={{ width: 48, height: 48 }} />
        ) : (
          <button className={`icon-btn ${config.flashlight ? 'active' : ''}`} onClick={() => setConfig(p => ({ ...p, flashlight: !p.flashlight }))} title="Toggle Flash">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </button>
        )}

        <button
          className="capture-circle-btn"
          onClick={handleCapture}
          disabled={!captureFunc && !importedImage}
        >
          <div className="capture-inner" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg viewBox="0 0 24 24" width="22" height="28" stroke="rgba(0, 0, 0, 0.9)" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
        </button>

        {!importedImage ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className={`icon-btn ${config.mirror ? 'active' : ''}`} onClick={() => setConfig(p => ({ ...p, mirror: !p.mirror }))} title="Mirror Camera">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20"></path>
                <path d="M5 6l-3 6 3 6"></path>
                <path d="M19 6l3 6-3 6"></path>
              </svg>
            </button>
            <button className="icon-btn" onClick={toggleCamera} title="Switch Camera">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"></path>
                <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="m18 22-3-3 3-3"></path>
                <path d="m6 2 3 3-3 3"></path>
              </svg>
            </button>
          </div>
        ) : (
          <div style={{ width: 106, height: 48 }} />
        )}
      </div>

      <div
        className={`controls-panel tab-theme-${activeTab} ${showControls ? 'open' : 'closed'} ${activeSlider ? 'interacting' : ''}`}
        style={panelStyle}
        onPointerDown={handlePanelPointerDown}
        onPointerMove={handlePanelPointerMove}
        onPointerUp={handlePanelPointerUp}
        onPointerCancel={handlePanelPointerUp}
      >
        <div className="panel-handle"></div>
        <div className="control-header" style={{ cursor: 'grab', touchAction: 'none' }}>
          <h1>HyprPixel</h1>
        </div>

        <div className={`control-group tabs-container ${activeSlider ? 'hidden-group' : ''}`}>
          <div className="tabs-header">
            <button className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')} style={{ color: activeTab === 'camera' ? '#000' : 'var(--text-secondary)' }}>Cam</button>
            <button className={`tab-btn ${activeTab === 'color' ? 'active' : ''}`} onClick={() => setActiveTab('color')} style={{ color: activeTab === 'color' ? '#000' : 'var(--text-secondary)' }}>Color</button>
            <button className={`tab-btn ${activeTab === 'light' ? 'active' : ''}`} onClick={() => setActiveTab('light')} style={{ color: activeTab === 'light' ? '#000' : 'var(--text-secondary)' }}>Light</button>
            <button className={`tab-btn ${activeTab === 'pixel' ? 'active' : ''}`} onClick={() => setActiveTab('pixel')} style={{ color: activeTab === 'pixel' ? '#000' : 'var(--text-secondary)' }}>Pixel</button>
            <button className={`tab-btn ${activeTab === 'fx' ? 'active' : ''}`} onClick={() => setActiveTab('fx')} style={{ color: activeTab === 'fx' ? '#000' : 'var(--text-secondary)' }}>FX</button>
          </div>
        </div>

        {activeTab === 'camera' && (
          <>
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Ratio</label>
              <div className="ratio-selector">
                {['fullscreen', '9:16', '16:9', '3:4', '4:3', '1:1'].map((r) => (
                  <button
                    key={r}
                    className={`ratio-btn ${config.ratio === r ? 'active' : ''}`}
                    onClick={() => setConfig(prev => ({ ...prev, ratio: r }))}
                  >
                    {r === 'fullscreen' ? 'Full' : r}
                  </button>
                ))}
              </div>
            </div>
            {renderSlider('zoom', 'Zoom', 1, 5, 0.1, v => `${v.toFixed(1)}x`)}
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>

              <div style={{ display: 'flex', gap: '8px', marginTop: '5px', marginBottom: '15px' }}>
                {importedImage ? (
                  <button className="ratio-btn" onClick={clearImportedImage} style={{ flex: 1, borderColor: '#f85149', color: '#f85149' }}>
                    Close Image
                  </button>
                ) : (
                  <label className="ratio-btn" style={{ flex: 1, margin: 0, textAlign: 'center' }}>
                    <input type="file" accept="image/*" onChange={handleImportImage} style={{ display: 'none' }} />
                    Import Image
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <select value={typeof config.grid === 'boolean' ? (config.grid ? 'thirds' : 'none') : config.grid} onChange={(e) => setConfig(p => ({ ...p, grid: e.target.value }))} className="preset-select" style={{ flex: 1 }}>
                  <option value="none">Grid: Off</option>
                  <option value="thirds">Rule of Thirds</option>
                  <option value="golden">Golden Ratio</option>
                  <option value="crosshair">Crosshair</option>
                  <option value="spiral">Golden Spiral</option>
                </select>
                {config.grid !== 'none' && (
                  <button className="icon-btn" style={{ width: '38px', height: '38px', alignSelf: 'center', margin: 0, borderRadius: '8px' }} onClick={() => setConfig(p => ({ ...p, gridFlip: (p.gridFlip + 1) % 8 }))} title="Rotate/Flip Grid">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path></svg>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.shutterSound} onChange={(e) => setConfig(p => ({ ...p, shutterSound: e.target.checked }))} />
                  <span className="chk-box"></span> Audio Effect
                </label>
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.timestamp} onChange={(e) => setConfig(p => ({ ...p, timestamp: e.target.checked }))} />
                  <span className="chk-box"></span> Retro Timestamp
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                <label style={{ minWidth: '80px' }}>Export As:</label>
                <div className="ratio-selector" style={{ flex: 1 }}>
                  {['png', 'jpeg', 'webp'].map(fmt => (
                    <button key={fmt} className={`ratio-btn ${config.exportFormat === fmt ? 'active' : ''}`} onClick={() => setConfig(p => ({ ...p, exportFormat: fmt }))} style={{ textTransform: 'uppercase' }}>{fmt}</button>
                  ))}
                </div>
              </div>
            </div>

            {renderSlider('fpsLimit', 'FPS Limiter', 0, 30, 1, v => v === 0 ? 'Max' : `${v} fps`)}

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ marginTop: '5px' }}>
                <label>Timer: {config.timer}s</label>
                <div className="ratio-selector">
                  {[0, 3, 10].map(t => (
                    <button key={t} className={`ratio-btn ${config.timer === t ? 'active' : ''}`} onClick={() => setConfig(p => ({ ...p, timer: t }))}>{t}s</button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'color' && (
          <>
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Palette</label>
              <select value={config.palette} onChange={(e) => setConfig(p => ({ ...p, palette: e.target.value }))} className="preset-select">
                <option value="none">None</option>
                <option value="catppuccin">Catppuccin (Mocha)</option>
                <option value="dracula">Dracula</option>
                <option value="onedark">One Dark (Atom)</option>
                <option value="nord">Nord</option>
                <option value="gruvbox">Gruvbox</option>
                <option value="tokyonight">Tokyo Night</option>
                <option value="rosepine">Rosé Pine</option>
                <option value="everforest">Everforest</option>
                <option value="solarized">Solarized</option>
                <option value="synthwave">Synthwave '84</option>
                <option value="sweetpastel">Sweet Pastel</option>
                <option value="candycotton">Cotton Candy</option>
                <option value="matcha">Matcha Green</option>
                <option value="sunset">Retro Sunset</option>
                <option value="monokai">Monokai</option>
                <option value="horizon">Horizon</option>
                <option value="palenight">Palenight</option>
                <option value="kanagawa">Kanagawa</option>
                <option value="vaporwave">Vaporwave</option>
                <option value="cyberpunk">Cyberpunk 2077</option>
                <option value="gameboy">GameBoy Classic</option>
                <option value="cga">CGA Graphics</option>
              </select>
            </div>

            <div className={`control-group ${activeSlider && !activeSlider.startsWith('tintIntensity') ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Dominant Colors (Tints)</label>
                <button
                  onClick={addTint}
                  style={{ background: 'var(--accent)', border: 'none', color: '#000', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  title="Add Color Layer"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>

              {(config.tints || [{ color: config.tintColor || '#ffffff', intensity: config.tintIntensity || 0 }]).map((tint, index) => (
                <div key={index} className={`control-group ${activeSlider === `tintIntensity_${index}` ? 'active-group' : ''}`} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)' }}>
                      <input type="color" value={tint.color} onChange={(e) => handleTintChange(index, 'color', e.target.value)} style={{ width: '150%', height: '150%', padding: 0, margin: 0, border: 'none', cursor: 'pointer', background: 'transparent' }} title="Color Wheel" />
                    </div>
                    <input type="range" min="0" max="100" step="1" value={tint.intensity} onChange={(e) => handleTintChange(index, 'intensity', parseInt(e.target.value))} onPointerDown={() => startDragSlider(`tintIntensity_${index}`)} onPointerUp={stopDragSlider} onTouchStart={() => startDragSlider(`tintIntensity_${index}`)} onTouchEnd={stopDragSlider} style={{ flex: 1 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>{tint.intensity}%</span>
                    {(config.tints && config.tints.length > 1) && (
                      <button onClick={() => removeTint(index)} style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px', display: 'flex' }} title="Remove Color Layer">
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {renderSlider('red', 'Red Channel', -100, 100, 1)}
            {renderSlider('green', 'Green Channel', -100, 100, 1)}
            {renderSlider('blue', 'Blue Channel', -100, 100, 1)}
            {renderSlider('hueShift', 'Hue Shift', 0, 360, 1, v => `${v}°`)}

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Color Blind Sim.</label>
              <select value={config.colorBlind} onChange={(e) => setConfig(p => ({ ...p, colorBlind: e.target.value }))} className="preset-select">
                <option value="none">Normal Vision</option>
                <option value="protanopia">Protanopia (Red-blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                <option value="tritanopia">Tritanopia (Blue-blind)</option>
              </select>
            </div>

            {/* --- NEW PASTEL & COLOR FX --- */}
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Pastel Overlay</label>
              <select value={config.pastelOverlay} onChange={(e) => setConfig(p => ({ ...p, pastelOverlay: e.target.value }))} className="preset-select">
                <option value="none">None</option>
                <option value="pink">Blush Pink</option>
                <option value="blue">Baby Blue</option>
                <option value="yellow">Soft Lemon</option>
                <option value="mint">Mint Green</option>
                <option value="lavender">Lavender</option>
              </select>
            </div>
            {config.pastelOverlay !== 'none' && renderSlider('pastelOverlayIntensity', 'Overlay Intensity', 0, 1, 0.05, v => v.toFixed(2))}

            {renderSlider('colorWash', 'Pastel Wash', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('paletteShift', 'Palette Hue Shift', 0, 4, 1)}
            {renderSlider('hueQuantization', 'Hue Quantization', 0, 360, 5, v => v === 0 ? 'Off' : `${v}°`)}

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.neonPastel} onChange={(e) => setConfig(p => ({ ...p, neonPastel: e.target.checked }))} />
                  <span className="chk-box"></span> Neon Pastel
                </label>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.holographic} onChange={(e) => setConfig(p => ({ ...p, holographic: e.target.checked }))} />
                  <span className="chk-box"></span> Holographic
                </label>
              </div>
            </div>

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label>Shadow Tint</label>
                  <input type="color" value={config.shadowTint} onChange={(e) => setConfig(p => ({ ...p, shadowTint: e.target.value }))} style={{ width: '100%', height: '30px', border: 'none', cursor: 'pointer' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Highlight Tint</label>
                  <input type="color" value={config.highlightTint} onChange={(e) => setConfig(p => ({ ...p, highlightTint: e.target.value }))} style={{ width: '100%', height: '30px', border: 'none', cursor: 'pointer' }} />
                </div>
              </div>
            </div>

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Chroma Key (Green Screen)</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="color" value={config.chromaKeyColor} onChange={(e) => setConfig(p => ({ ...p, chromaKeyColor: e.target.value }))} title="Key Color" style={{ height: '30px', flex: 1 }} />
                <span style={{ fontSize: '12px' }}>➔</span>
                <input type="color" value={config.chromaKeyReplacement} onChange={(e) => setConfig(p => ({ ...p, chromaKeyReplacement: e.target.value }))} title="Replacement Color" style={{ height: '30px', flex: 1 }} />
              </div>
            </div>
            {renderSlider('chromaKeyThreshold', 'Chroma Tolerance', 0, 1, 0.05, v => v.toFixed(2))}
          </>
        )}

        {activeTab === 'light' && (
          <>
            {renderSlider('brightness', 'Brightness', 0.5, 2, 0.1, v => v.toFixed(1))}
            {renderSlider('contrast', 'Contrast', 0.5, 2, 0.1, v => v.toFixed(1))}
            {renderSlider('saturation', 'Saturation', 0, 2, 0.1, v => v.toFixed(1))}
            {renderSlider('temperature', 'Temp', -100, 100, 1)}
            {renderSlider('tint', 'Light Tint', -100, 100, 1)}
            {renderSlider('highlights', 'Highlights', -100, 100, 1)}
            {renderSlider('shadows', 'Shadows', -100, 100, 1)}
            {renderSlider('hdr', 'Dynamic Range', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('doubleExposure', 'Ghosting (Double Exp)', 0, 0.9, 0.1, v => v.toFixed(1))}
            {renderSlider('solarize', 'Solarize Effect', 0, 1, 0.05, v => v === 0 ? 'Off' : v.toFixed(2))}
          </>
        )}

        {activeTab === 'pixel' && (
          <>
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Pixel Block Shape</label>
              <select value={config.pixelShape} onChange={(e) => setConfig(p => ({ ...p, pixelShape: e.target.value }))} className="preset-select">
                <option value="square">Square</option>
                <option value="circle">Circle</option>
                <option value="diamond">Diamond</option>
              </select>
            </div>
            {renderSlider('pixelSize', 'Pixel Size', 1, 32, 0.5, v => v.toFixed(1))}
            {renderSlider('softFocus', 'Soft Focus (Pre-blur)', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('colorColors', 'Color Depth (Banding)', 2, 64, 1)}
            {renderSlider('posterizeLevels', 'Posterize Levels', 2, 255, 1, v => v === 255 ? 'Off' : v)}
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Dither Strategy</label>
              <select value={config.ditherMode} onChange={(e) => setConfig(p => ({ ...p, ditherMode: e.target.value }))} className="preset-select">
                <option value="none">None (Posterize)</option>
                <option value="bayer2x2">Bayer 2x2</option>
                <option value="bayer4x4">Bayer 4x4</option>
                <option value="bayer8x8">Bayer 8x8</option>
              </select>
            </div>
            {config.ditherMode !== 'none' && renderSlider('bayerLevel', 'Dither Influence', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('sharpen', 'Sharpen Output', 0, 1, 0.05, v => v.toFixed(2))}

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label>Pixel Grid Overlay</label>
                  <input type="color" value={config.gridColor} onChange={(e) => setConfig(p => ({ ...p, gridColor: e.target.value }))} style={{ width: '100%', height: '30px', border: 'none', cursor: 'pointer' }} />
                </div>
              </div>
            </div>
            {renderSlider('gridOpacity', 'Grid Opacity', 0, 1, 0.05, v => v.toFixed(2))}

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px', marginBottom: '10px' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.lcdEffect} onChange={(e) => setConfig(p => ({ ...p, lcdEffect: e.target.checked }))} />
                  <span className="chk-box"></span> LCD Subpixels
                </label>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.lightnessQuantization} onChange={(e) => setConfig(p => ({ ...p, lightnessQuantization: e.target.checked }))} />
                  <span className="chk-box"></span> Lightness Quant.
                </label>
              </div>
            </div>
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.edgeDetection} onChange={(e) => setConfig(p => ({ ...p, edgeDetection: e.target.checked }))} />
                  <span className="chk-box"></span> Edge Lines
                </label>
                {config.edgeDetection && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input type="color" value={config.customEdgeColor || '#000000'} onChange={(e) => setConfig(p => ({ ...p, customEdgeColor: e.target.value }))} title="Edge Color" />
                  </div>
                )}
              </div>
              {config.edgeDetection && renderSlider('edgeThickness', 'Edge Thickness', 1, 5, 0.5, v => v.toFixed(1))}
              {config.edgeDetection && renderSlider('edgeOpacity', 'Edge Opacity', 0, 1, 0.05, v => v.toFixed(2))}
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.invert} onChange={(e) => setConfig(p => ({ ...p, invert: e.target.checked }))} />
                  <span className="chk-box"></span> Invert Colors
                </label>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.monochrome} onChange={(e) => setConfig(p => ({ ...p, monochrome: e.target.checked }))} />
                  <span className="chk-box"></span> Grayscale
                </label>
              </div>
            </div>
          </>
        )}

        {activeTab === 'fx' && (
          <>
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label>Symmetry Mode</label>
              <select value={config.symmetry} onChange={(e) => setConfig(p => ({ ...p, symmetry: e.target.value }))} className="preset-select">
                <option value="none">None</option>
                <option value="horizontal">Horizontal Mirror</option>
                <option value="vertical">Vertical Mirror</option>
                <option value="quad">Kaleidoscope (Quad)</option>
              </select>
            </div>

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.nightVision} onChange={(e) => setConfig(p => ({ ...p, nightVision: e.target.checked }))} />
                  <span className="chk-box"></span> Night Vision
                </label>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.thermal} onChange={(e) => setConfig(p => ({ ...p, thermal: e.target.checked }))} />
                  <span className="chk-box"></span> Thermal Vision
                </label>
              </div>
            </div>

            {renderSlider('sepia', 'Sepia Tone', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('chromaticAberration', 'RGB Glitch', 0, 10, 0.5, v => v.toFixed(1))}

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <label className="checkbox-label" style={{ alignSelf: 'flex-start' }}>
                <input type="checkbox" checked={config.glitchMode} onChange={(e) => setConfig(p => ({ ...p, glitchMode: e.target.checked }))} /> Data Bending (Intense Glitch)
              </label>
            </div>

            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.crt} onChange={(e) => setConfig(p => ({ ...p, crt: e.target.checked }))} />
                  <span className="chk-box"></span> CRT Monitor
                </label>
                <label className="checkbox-label monochrome" style={{ flex: 1 }}>
                  <input type="checkbox" checked={config.asciiMode} onChange={(e) => setConfig(p => ({ ...p, asciiMode: e.target.checked }))} />
                  <span className="chk-box"></span> ASCII Render
                </label>
              </div>
            </div>

            {renderSlider('scanlines', 'Scanlines', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('filmGrain', 'Film Grain', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('vignette', 'Vignette', 0, 1, 0.05, v => v.toFixed(2))}
            {renderSlider('bloom', 'Bloom (Glow)', 0, 1, 0.05, v => v.toFixed(2))}

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 0', paddingTop: '10px' }}>
              {renderSlider('vhsDistortion', 'VHS Tracking Distortion', 0, 1, 0.05, v => v.toFixed(2))}
              {renderSlider('dreamyGlow', 'Dreamy Pastel Glow', 0, 1, 0.05, v => v.toFixed(2))}
              {renderSlider('colorBleed', 'Color Bleed', 0, 1, 0.05, v => v.toFixed(2))}

              <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
                <label>Noise Overlay Type</label>
                <select value={config.noiseType} onChange={(e) => setConfig(p => ({ ...p, noiseType: e.target.value }))} className="preset-select">
                  <option value="white">Static White Noise</option>
                  <option value="pastel">Pastel Rainbow Noise</option>
                  <option value="dark">Dark Grime Noise</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`} style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button className="reset-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => {
            localStorage.setItem('hyprpixel_preset', JSON.stringify(config));
            alert('Preset Saved to Storage!');
          }}>Save Preset</button>
          <button className="reset-btn" style={{ flex: 1, marginTop: 0 }} onClick={() => {
            const saved = localStorage.getItem('hyprpixel_preset');
            if (saved) setConfig(JSON.parse(saved));
          }}>Load Preset</button>
        </div>

        <button className={`reset-btn ${activeSlider ? 'hidden-group' : ''}`} onClick={handleReset}>
          Reset Settings
        </button>
      </div>
    </div>
  );
}

export default App;
