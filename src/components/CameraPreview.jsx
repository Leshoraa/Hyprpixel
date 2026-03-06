import React, { useRef, useEffect, useState } from 'react';
import { useCamera } from '../hooks/useCamera';
import { processPixelArt } from '../utils/pixelProcessor';

export const CameraPreview = ({ config, onCaptureReady, facingMode, importedImage }) => {
    const { stream, error, videoRef } = useCamera(facingMode, config.flashlight);
    const canvasRef = useRef(null);
    const animationFrameId = useRef(null);
    const [isVideoReady, setIsVideoReady] = useState(false);
    const lastFrameTime = useRef(0);

    useEffect(() => {
        const video = videoRef.current;
        if (video && !importedImage) {
            // Reset ready state when stream changes
            setIsVideoReady(false);
            video.onloadedmetadata = () => {
                video.play().catch(e => console.error("Playback failed", e));
                setIsVideoReady(true);
            };
        }
    }, [videoRef, stream, importedImage]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        // Logic for Static Imported Image
        if (importedImage) {
            const img = new Image();
            img.onload = () => {
                let canvasW = img.width;
                let canvasH = img.height;
                const activeRatio = config.ratio || 'fullscreen';
                let targetRatio;

                if (activeRatio === 'fullscreen') {
                    targetRatio = window.innerWidth / window.innerHeight;
                } else if (activeRatio === 'original') {
                    targetRatio = canvasW / canvasH;
                } else {
                    const [targetW, targetH] = activeRatio.split(':').map(Number);
                    targetRatio = targetW / targetH;
                }

                if (activeRatio !== 'original') {
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

                // Process pixel art once for static image
                processPixelArt(img, ctx, canvas.width, canvas.height, config);
            };
            img.src = importedImage;

            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            return;
        }

        const video = videoRef.current;
        if (!video || !isVideoReady) return;

        const renderLoop = () => {
            animationFrameId.current = requestAnimationFrame(renderLoop);

            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // FPS Limiter Logic
                if (config.fpsLimit && config.fpsLimit > 0) {
                    const now = Date.now();
                    const dt = now - lastFrameTime.current;
                    const frameDuration = 1000 / config.fpsLimit;

                    if (dt < frameDuration) return; // Skip frame
                    lastFrameTime.current = now - (dt % frameDuration);
                }

                let canvasW = video.videoWidth;
                let canvasH = video.videoHeight;
                const activeRatio = config.ratio || 'fullscreen';
                let targetRatio;

                if (activeRatio === 'fullscreen') {
                    targetRatio = window.innerWidth / window.innerHeight;
                } else if (activeRatio === 'original') {
                    targetRatio = canvasW / canvasH;
                } else {
                    const [targetW, targetH] = activeRatio.split(':').map(Number);
                    targetRatio = targetW / targetH;
                }

                if (activeRatio !== 'original') {
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
        };

        renderLoop();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isVideoReady, config, videoRef, importedImage]);

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
