import { useState, useEffect, useRef } from 'react';

export const useCamera = (facingMode = 'environment', flashlight = false) => {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);
    const trackRef = useRef(null);

    useEffect(() => {
        let currentStream = null;

        const startCamera = async () => {
            try {
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }

                currentStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode }
                });

                setStream(currentStream);

                const track = currentStream.getVideoTracks()[0];
                trackRef.current = track;

                if (videoRef.current) {
                    videoRef.current.srcObject = currentStream;
                }

                if (flashlight && track && track.getCapabilities && track.getCapabilities().torch) {
                    await track.applyConstraints({
                        advanced: [{ torch: true }]
                    });
                }
            } catch (err) {
                setError(err.message || 'Error accessing camera');
            }
        };

        startCamera();

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    useEffect(() => {
        const toggleTorch = async () => {
            const track = trackRef.current;
            if (track && track.getCapabilities && track.getCapabilities().torch) {
                try {
                    await track.applyConstraints({
                        advanced: [{ torch: flashlight }]
                    });
                } catch (e) {
                    console.log('Torch error:', e);
                }
            }
        };
        toggleTorch();
    }, [flashlight]);

    return { stream, error, videoRef };
};
