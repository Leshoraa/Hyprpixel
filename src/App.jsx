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
  tints: [{ color: '#ffffff', intensity: 0 }]
};

function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [facingMode, setFacingMode] = useState('environment');
  const [captureFunc, setCaptureFunc] = useState(null);

  const [showControls, setShowControls] = useState(true);
  const [activeSlider, setActiveSlider] = useState(null);
  const [activeTab, setActiveTab] = useState('camera');

  // Dragging state
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartMousePos = useRef({ x: 0, y: 0 });
  const isMoved = useRef(false);

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
    if (captureFunc) {
      const dataUrl = captureFunc();
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `hyprpixel-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const startDragSlider = (name) => setActiveSlider(name);
  const stopDragSlider = () => setActiveSlider(null);

  const handleReset = () => {
    setConfig(prev => {
      const resetConfig = { ...prev };

      switch (activeTab) {
        case 'camera':
          resetConfig.ratio = DEFAULT_CONFIG.ratio;
          resetConfig.zoom = DEFAULT_CONFIG.zoom;
          resetConfig.pixelSize = DEFAULT_CONFIG.pixelSize;
          break;
        case 'tuning':
          resetConfig.temperature = DEFAULT_CONFIG.temperature;
          resetConfig.tint = DEFAULT_CONFIG.tint;
          resetConfig.saturation = DEFAULT_CONFIG.saturation;
          resetConfig.highlights = DEFAULT_CONFIG.highlights;
          resetConfig.shadows = DEFAULT_CONFIG.shadows;
          break;
        case 'color':
          resetConfig.red = DEFAULT_CONFIG.red;
          resetConfig.green = DEFAULT_CONFIG.green;
          resetConfig.blue = DEFAULT_CONFIG.blue;
          resetConfig.tints = [...DEFAULT_CONFIG.tints];
          break;
        case 'effect':
          resetConfig.colorColors = DEFAULT_CONFIG.colorColors;
          resetConfig.brightness = DEFAULT_CONFIG.brightness;
          resetConfig.contrast = DEFAULT_CONFIG.contrast;
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

  const panelStyle = showControls ? {
    transform: `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px)`,
    transition: isDraggingPanel || activeSlider ? 'none' : undefined
  } : {};

  return (
    <div className="app-container">
      <div className="preview-wrapper" onClick={toggleControls}>
        <CameraPreview config={config} onCaptureReady={onCaptureReady} facingMode={facingMode} />
      </div>

      <div className="capture-bar">
        <button className={`icon-btn ${config.mirror ? 'active' : ''}`} onClick={toggleMirror}>
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 4 2 12 8 20"></polyline>
            <polyline points="16 4 22 12 16 20"></polyline>
            <line x1="12" y1="2" x2="12" y2="22"></line>
          </svg>
        </button>

        <button className="capture-circle-btn" onClick={handleCapture}>
          <div className="capture-inner"></div>
        </button>

        <button className="icon-btn" onClick={toggleCamera}>
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"></path>
            <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"></path>
            <circle cx="12" cy="12" r="3"></circle>
            <path d="m18 22-3-3 3-3"></path>
            <path d="m6 2 3 3-3 3"></path>
          </svg>
        </button>
      </div>

      <div
        className={`controls-panel ${showControls ? 'open' : 'closed'} ${activeSlider ? 'interacting' : ''}`}
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
            <button className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>Camera</button>
            <button className={`tab-btn ${activeTab === 'tuning' ? 'active' : ''}`} onClick={() => setActiveTab('tuning')}>Tuning</button>
            <button className={`tab-btn ${activeTab === 'color' ? 'active' : ''}`} onClick={() => setActiveTab('color')}>Color</button>
            <button className={`tab-btn ${activeTab === 'effect' ? 'active' : ''}`} onClick={() => setActiveTab('effect')}>Effect</button>
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
            {renderSlider('pixelSize', 'Pixel Size', 1, 32, 0.5, v => v.toFixed(1))}
          </>
        )}

        {activeTab === 'tuning' && (
          <>
            {renderSlider('temperature', 'Temp', -100, 100, 1)}
            {renderSlider('tint', 'Tint', -100, 100, 1)}
            {renderSlider('saturation', 'Saturation', 0, 2, 0.1, v => v.toFixed(1))}
            {renderSlider('highlights', 'Highlights', -100, 100, 1)}
            {renderSlider('shadows', 'Shadows', -100, 100, 1)}
          </>
        )}

        {activeTab === 'color' && (
          <>
            {renderSlider('red', 'Red Channel', -100, 100, 1)}
            {renderSlider('green', 'Green Channel', -100, 100, 1)}
            {renderSlider('blue', 'Blue Channel', -100, 100, 1)}

            <div className={`control-group ${activeSlider && !activeSlider.startsWith('tintIntensity') ? 'hidden-group' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Dominant Colors</label>
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
                      <input
                        type="color"
                        value={tint.color}
                        onChange={(e) => handleTintChange(index, 'color', e.target.value)}
                        style={{ width: '150%', height: '150%', padding: 0, margin: 0, border: 'none', cursor: 'pointer', background: 'transparent' }}
                        title="Color Wheel"
                      />
                    </div>
                    <input
                      type="range"
                      min="0" max="100" step="1"
                      value={tint.intensity}
                      onChange={(e) => handleTintChange(index, 'intensity', parseInt(e.target.value))}
                      onPointerDown={() => startDragSlider(`tintIntensity_${index}`)}
                      onPointerUp={stopDragSlider}
                      onTouchStart={() => startDragSlider(`tintIntensity_${index}`)}
                      onTouchEnd={stopDragSlider}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>{tint.intensity}%</span>
                    {(config.tints && config.tints.length > 1) && (
                      <button
                        onClick={() => removeTint(index)}
                        style={{ background: 'transparent', border: 'none', color: '#f85149', cursor: 'pointer', padding: '4px', display: 'flex' }}
                        title="Remove Color Layer"
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'effect' && (
          <>
            {renderSlider('colorColors', 'Color Depth', 2, 64, 1)}
            {renderSlider('brightness', 'Brightness', 0.5, 2, 0.1, v => v.toFixed(1))}
            {renderSlider('contrast', 'Contrast', 0.5, 2, 0.1, v => v.toFixed(1))}
          </>
        )}

        <button className={`reset-btn ${activeSlider ? 'hidden-group' : ''}`} onClick={handleReset}>
          Reset Settings
        </button>
      </div>
    </div>
  );
}

export default App;
