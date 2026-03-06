import React from 'react';

export const CameraTab = ({
    config,
    setConfig,
    activeSlider,
    renderSlider,
    importedImage,
    clearImportedImage,
    handleImportImage
}) => {
    return (
        <>
            <div className={`control-group ${activeSlider ? 'hidden-group' : ''}`}>
                <label>Ratio</label>
                <div className="ratio-selector">
                    {['fullscreen', 'original', '9:16', '16:9', '3:4', '4:3', '1:1'].map((r) => (
                        <button
                            key={r}
                            className={`ratio-btn ${config.ratio === r ? 'active' : ''}`}
                            onClick={() => setConfig(prev => ({ ...prev, ratio: r }))}
                        >
                            {r === 'fullscreen' ? 'Full' : (r === 'original' ? 'Asli' : r)}
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
    );
};
