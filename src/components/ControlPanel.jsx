import React from 'react';
import { CameraTab } from './tabs/CameraTab';
import { ColorTab } from './tabs/ColorTab';
import { LightTab } from './tabs/LightTab';
import { PixelTab } from './tabs/PixelTab';
import { FxTab } from './tabs/FxTab';
import { usePanelDrag } from '../hooks/usePanelDrag';

export const ControlPanel = ({
    config,
    setConfig,
    showControls,
    setShowControls,
    activeSlider,
    setActiveSlider,
    activeTab,
    setActiveTab,
    importedImage,
    clearImportedImage,
    handleImportImage,
    handleReset
}) => {
    const { panelPos, isDraggingPanel, handlePointerDown, handlePointerMove, handlePointerUp } = usePanelDrag(setShowControls);

    const startDragSlider = (name) => setActiveSlider(name);
    const stopDragSlider = () => setActiveSlider(null);

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig((prev) => ({
            ...prev,
            [name]: isNaN(value) ? value : parseFloat(value)
        }));
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
        <div
            className={`controls-panel tab-theme-${activeTab} ${showControls ? 'open' : 'closed'} ${activeSlider ? 'interacting' : ''}`}
            style={panelStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
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
                <CameraTab
                    config={config} setConfig={setConfig} activeSlider={activeSlider}
                    renderSlider={renderSlider} importedImage={importedImage}
                    clearImportedImage={clearImportedImage} handleImportImage={handleImportImage}
                />
            )}

            {activeTab === 'color' && (
                <ColorTab
                    config={config} setConfig={setConfig} activeSlider={activeSlider} renderSlider={renderSlider}
                    addTint={addTint} removeTint={removeTint} handleTintChange={handleTintChange}
                    startDragSlider={startDragSlider} stopDragSlider={stopDragSlider}
                />
            )}

            {activeTab === 'light' && <LightTab config={config} setConfig={setConfig} activeSlider={activeSlider} renderSlider={renderSlider} />}
            {activeTab === 'pixel' && <PixelTab config={config} setConfig={setConfig} activeSlider={activeSlider} renderSlider={renderSlider} />}
            {activeTab === 'fx' && <FxTab config={config} setConfig={setConfig} activeSlider={activeSlider} renderSlider={renderSlider} />}

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
    );
};
