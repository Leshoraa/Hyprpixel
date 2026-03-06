import { useState, useRef } from 'react';

export const usePanelDrag = (setShowControls) => {
    const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
    const [isDraggingPanel, setIsDraggingPanel] = useState(false);

    const dragStartPos = useRef({ x: 0, y: 0 });
    const dragStartMousePos = useRef({ x: 0, y: 0 });
    const isMoved = useRef(false);

    const handlePointerDown = (e) => {
        if (e.target.closest('.panel-handle') || e.target.closest('.control-header')) {
            setIsDraggingPanel(true);
            isMoved.current = false;
            dragStartPos.current = { ...panelPos };
            dragStartMousePos.current = { x: e.clientX, y: e.clientY };
            e.target.setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e) => {
        if (isDraggingPanel) {
            const dx = e.clientX - dragStartMousePos.current.x;
            const dy = e.clientY - dragStartMousePos.current.y;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                isMoved.current = true;
            }

            let newX = dragStartPos.current.x + dx;
            let newY = dragStartPos.current.y + dy;

            const maxX = window.innerWidth / 2 - 20;
            const maxY = window.innerHeight - 100;

            newX = Math.max(-maxX, Math.min(maxX, newX));
            newY = Math.max(-maxY, Math.min(200, newY));

            setPanelPos({ x: newX, y: newY });
        }
    };

    const handlePointerUp = (e) => {
        if (isDraggingPanel) {
            setIsDraggingPanel(false);
            e.target.releasePointerCapture(e.pointerId);
            if (!isMoved.current && e.target.closest('.panel-handle')) {
                setShowControls(false);
                setPanelPos({ x: 0, y: 0 });
            }
        }
    };

    const resetPosition = () => {
        setPanelPos({ x: 0, y: 0 });
    };

    return {
        panelPos,
        isDraggingPanel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        resetPosition
    };
};
