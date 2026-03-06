import React from 'react';

export const ColorTab = ({
    config,
    setConfig,
    activeSlider,
    renderSlider,
    addTint,
    removeTint,
    handleTintChange,
    startDragSlider,
    stopDragSlider
}) => {
    return (
        <>
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
                <label>Palette</label>
                <select value={config.palette} onChange={(e) => setConfig(p => ({ ...p, palette: e.target.value }))} className="preset-select">
                    <option value="default_cam">DEFAULT</option>
                    <option value="midnight7">7MDNIGHT</option>
                    <option value="ammo8">8AMMO</option>
                    <option value="autumn8">8AUTUMN</option>
                    <option value="brkfst8">8BRKFST</option>
                    <option value="dream8">8DREAM</option>
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
    );
};
