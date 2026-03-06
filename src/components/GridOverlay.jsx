import React from 'react';

export const GridOverlay = ({ config }) => {
    if (!config.grid || config.grid === 'none') return null;

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
            default: break;
        }
        return { vb, m };
    })();

    return (
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
    );
};
