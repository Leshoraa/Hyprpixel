import React from 'react';

export const CaptureBar = ({
    config,
    setConfig,
    importedImage,
    captureReady,
    onCapture,
    toggleCamera
}) => {
    return (
        <div className="capture-bar">
            {importedImage ? (
                <div style={{ width: 48, height: 48 }} />
            ) : (
                <button
                    className={`icon-btn ${config.flashlight ? 'active' : ''}`}
                    onClick={() => setConfig(p => ({ ...p, flashlight: !p.flashlight }))}
                    title="Toggle Flash"
                >
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                </button>
            )}

            <button
                className="capture-circle-btn"
                onClick={onCapture}
                disabled={!captureReady && !importedImage}
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
                    <button
                        className={`icon-btn ${config.mirror ? 'active' : ''}`}
                        onClick={() => setConfig(p => ({ ...p, mirror: !p.mirror }))}
                        title="Mirror Camera"
                    >
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
    );
};
