import React from 'react';

export const LightTab = ({ renderSlider }) => {
    return (
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
    );
};
