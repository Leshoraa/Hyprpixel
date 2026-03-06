import React from 'react';

export const FxTab = ({ config, setConfig, activeSlider, renderSlider }) => {
    return (
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
    );
};
