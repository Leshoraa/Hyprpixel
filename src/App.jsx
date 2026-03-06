import React, { useState, useCallback } from 'react';
import { CameraPreview } from './components/CameraPreview';
import { CaptureBar } from './components/CaptureBar';
import { ControlPanel } from './components/ControlPanel';
import { GridOverlay } from './components/GridOverlay';
import { DEFAULT_CONFIG } from './config/defaultConfig';
import { useShutterSound } from './hooks/useShutterSound';
import './App.css';

function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [facingMode, setFacingMode] = useState('environment');
  const [captureFunc, setCaptureFunc] = useState(null);
  const [importedImage, setImportedImage] = useState(null);

  const [showControls, setShowControls] = useState(true);
  const [activeSlider, setActiveSlider] = useState(null);
  const [activeTab, setActiveTab] = useState('camera');
  const [timerCount, setTimerCount] = useState(null);

  const { playShutterSound } = useShutterSound();

  const toggleCamera = () => {
    setFacingMode((prev) => {
      const newMode = prev === 'environment' ? 'user' : 'environment';
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
      playShutterSound(config.shutterSound);
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

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleReset = () => {
    setConfig(prev => {
      const resetConfig = { ...prev };

      const resetKeys = {
        camera: ['ratio', 'zoom', 'grid', 'gridFlip', 'timer', 'flashlight', 'exportFormat', 'shutterSound', 'timestamp', 'fpsLimit'],
        color: ['palette', 'tints', 'red', 'green', 'blue', 'hueShift', 'colorBlind', 'pastelOverlay', 'pastelOverlayIntensity', 'colorWash', 'paletteShift', 'neonPastel', 'holographic', 'shadowTint', 'highlightTint', 'hueQuantization', 'chromaKeyColor', 'chromaKeyThreshold', 'chromaKeyReplacement'],
        light: ['brightness', 'contrast', 'saturation', 'temperature', 'tint', 'highlights', 'shadows', 'hdr', 'doubleExposure', 'solarize'],
        pixel: ['pixelSize', 'colorColors', 'ditherMode', 'sharpen', 'edgeDetection', 'customEdgeColor', 'invert', 'monochrome', 'pixelShape', 'gridOpacity', 'gridColor', 'lcdEffect', 'bayerLevel', 'posterizeLevels', 'lightnessQuantization', 'edgeThickness', 'edgeOpacity', 'softFocus'],
        fx: ['symmetry', 'nightVision', 'thermal', 'sepia', 'chromaticAberration', 'glitchMode', 'crt', 'scanlines', 'filmGrain', 'vignette', 'bloom', 'asciiMode', 'vhsDistortion', 'dreamyGlow', 'colorBleed', 'noiseType']
      };

      if (resetKeys[activeTab]) {
        resetKeys[activeTab].forEach(key => {
          resetConfig[key] = DEFAULT_CONFIG[key];
        });
      }

      return resetConfig;
    });
  };

  return (
    <div className="app-container">
      <div className="preview-wrapper" onClick={toggleControls}>
        <CameraPreview
          config={config}
          onCaptureReady={onCaptureReady}
          facingMode={facingMode}
          importedImage={importedImage}
        />
        <GridOverlay config={config} />
        {timerCount !== null && <div className="timer-display">{timerCount}</div>}
      </div>

      <CaptureBar
        config={config}
        setConfig={setConfig}
        importedImage={importedImage}
        captureReady={!!captureFunc}
        onCapture={handleCapture}
        toggleCamera={toggleCamera}
      />

      <ControlPanel
        config={config}
        setConfig={setConfig}
        showControls={showControls}
        setShowControls={setShowControls}
        activeSlider={activeSlider}
        setActiveSlider={setActiveSlider}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        importedImage={importedImage}
        clearImportedImage={clearImportedImage}
        handleImportImage={handleImportImage}
        handleReset={handleReset}
      />
    </div>
  );
}

export default App;
