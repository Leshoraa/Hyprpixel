import { useState, useEffect, useRef } from 'react';

export const useCamera = (facingMode = 'environment') => {
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const videoRef = useRef(null);

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

                if (videoRef.current) {
                    videoRef.current.srcObject = currentStream;
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

    return { stream, error, videoRef };
};
