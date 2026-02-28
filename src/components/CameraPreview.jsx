import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera';
import { processPixelArt } from '../utils/pixelProcessor';

export const CameraPreview = ({ config, onCaptureReady, facingMode }) => {
    const { stream, error, videoRef } = useCamera(facingMode);
    const canvasRef = useRef(null);
    const animationFrameId = useRef(null);
    const [isVideoReady, setIsVideoReady] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            // Reset ready state when stream changes
            setIsVideoReady(false);
            video.onloadedmetadata = () => {
                video.play().catch(e => console.error("Playback failed", e));
                setIsVideoReady(true);
            };
        }
    }, [videoRef, stream]);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !isVideoReady) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        const renderLoop = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                let canvasW = video.videoWidth;
                let canvasH = video.videoHeight;
                const activeRatio = config.ratio || 'fullscreen';

                if (activeRatio !== 'fullscreen') {
                    const [targetW, targetH] = activeRatio.split(':').map(Number);
                    const targetRatio = targetW / targetH;

                    if (canvasW / canvasH > targetRatio) {
                        canvasW = Math.round(canvasH * targetRatio);
                    } else {
                        canvasH = Math.round(canvasW / targetRatio);
                    }
                }

                if (canvas.width !== canvasW || canvas.height !== canvasH) {
                    canvas.width = canvasW;
                    canvas.height = canvasH;
                }

                processPixelArt(video, ctx, canvas.width, canvas.height, config);
            }
            animationFrameId.current = requestAnimationFrame(renderLoop);
        };

        renderLoop();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isVideoReady, config, videoRef]);

    useEffect(() => {
        if (onCaptureReady && canvasRef.current) {
            onCaptureReady(() => {
                return canvasRef.current.toDataURL('image/png');
            });
        }
    }, [onCaptureReady]);

    if (error) {
        return <div className="error-message">Error: {error}</div>;
    }

    return (
        <div className="camera-container" data-ratio={config.ratio}>
            <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
            <canvas ref={canvasRef} className="pixel-canvas" />
        </div>
    );
};
