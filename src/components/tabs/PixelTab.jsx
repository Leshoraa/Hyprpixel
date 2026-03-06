import React from 'react';

export const PixelTab = ({ config, setConfig, activeSlider, renderSlider }) => {
    return (
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
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <label style={{ flex: 1, margin: 0 }}>Grid Lines Color</label>
                    <input type="color" value={config.gridColor} onChange={(e) => setConfig(p => ({ ...p, gridColor: e.target.value }))} style={{ width: '40px', height: '30px', border: 'none', cursor: 'pointer' }} />
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
    );
};
