'use client';

import React, { useRef, useEffect, useState } from 'react';
import chroma from 'chroma-js';
import { SketchPicker, ColorResult } from 'react-color';
import styles from './KeypointEditorComponent.module.css';
import { Keypoint } from './keypoint.interface';

interface KeypointEditorProps {
    keypoints: Keypoint[];
    setKeypoints: React.Dispatch<React.SetStateAction<Keypoint[]>>;
    onKeypointChange: (updatedKeypoints: Keypoint[]) => void;
}

const KeypointEditorComponent: React.FC<KeypointEditorProps> = ({ keypoints, setKeypoints, onKeypointChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [activeKeypointId, setActiveKeypointId] = useState(keypoints[0].id);
    const keypointEditorContainerRef = useRef<HTMLDivElement | null>(null);
    const gradientSvgRef = useRef<SVGSVGElement>(null);
    const keypointSvgWidth = gradientSvgRef.current?.getBoundingClientRect().width ? gradientSvgRef.current?.getBoundingClientRect().width : 400;
    const keypointSvgHeight = gradientSvgRef.current?.getBoundingClientRect().height ? gradientSvgRef.current?.getBoundingClientRect().height : 50;

    useEffect(() => {
        draw();
        if (keypointEditorContainerRef.current) {
            keypointEditorContainerRef.current.addEventListener('mousemove', onMouseMove);
            keypointEditorContainerRef.current.addEventListener('mouseup', onMouseUp);
        }
        return () => {
            if (keypointEditorContainerRef.current) {
                keypointEditorContainerRef.current.removeEventListener('mousemove', onMouseMove);
                keypointEditorContainerRef.current.removeEventListener('mouseup', onMouseUp);
            }
        };
    }, [keypoints]);

    const validateColor = (color: string, alpha: number) => {
        if (color === 'transparent') {
            return 'rgba(0,0,0,0)';
        } else {
            return `rgba(${chroma(color).alpha(alpha).rgba().join(',')})`;
        }
    };

    const draw = () => {
        if (!gradientSvgRef.current) {
            return;
        }
        gradientSvgRef.current.innerHTML = '';

        // Draw the left edge point to the first keypoint
        const leftEdgePoint = { id: Date.now(), x: 0, color: validateColor(keypoints[0].color, keypoints[0].alpha), alpha: keypoints[0].alpha };
        drawConstantColor(leftEdgePoint, keypoints[0]);

        // Draw the gradients for the middle keypoints
        for (let i = 0; i < keypoints.length - 1; i++) {
            drawGradient(keypoints[i], keypoints[i + 1]);
        }

        // Draw the last keypoint to the right edge point
        const rightEdgePoint = { id: Date.now(), x: 1, color: validateColor(keypoints[keypoints.length - 1].color, keypoints[keypoints.length - 1].alpha), alpha: keypoints[keypoints.length - 1].alpha };
        drawConstantColor(keypoints[keypoints.length - 1], rightEdgePoint);
    };

    const drawConstantColor = (keypoint: Keypoint, nextKeypoint: Keypoint) => {
        const color = validateColor(keypoint.color, keypoint.alpha);
        const svg = `
            <rect x="${keypoint.x * keypointSvgWidth}" y="0" width="${(nextKeypoint.x - keypoint.x) * keypointSvgWidth}" height="100%" fill="${color}" />
        `;

        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.innerHTML = svg;
        gradientSvgRef.current!.appendChild(svgElement);
    };

    const drawGradient = (keypoint: Keypoint, nextKeypoint: Keypoint) => {
        // console.log("alpha", keypoint.alpha);
        const startColor = validateColor(keypoint.color, keypoint.alpha);


        const endColor = validateColor(nextKeypoint.color, keypoint.alpha);
        console.log("startColor, endColor", startColor, endColor);
        const svg = `
          <defs>
              <linearGradient id="Gradient${keypoint.id}" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stop-color="${startColor}" />
                  <stop offset="100%" stop-color="${endColor}" />
              </linearGradient>
          </defs>
          <rect x="${keypoint.x * keypointSvgWidth}" y="0" width="${(nextKeypoint.x - keypoint.x) * keypointSvgWidth}" height="100%" fill="url(#Gradient${keypoint.id})" />
        `;

        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.innerHTML = svg;
        gradientSvgRef.current!.appendChild(svgElement);

    };

    const onKeypointMouseDown = (event: React.MouseEvent, keypoint: Keypoint) => {
        event.stopPropagation();
        setIsDragging(true);
        setActiveKeypointId(keypoint.id);
        window.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (event: MouseEvent) => {
        if (isDragging && activeKeypointId !== null && keypointEditorContainerRef.current) {
            const rect = gradientSvgRef.current!.getBoundingClientRect();
            let x = event.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const activeKeypoint = keypoints.find(keypoint => keypoint.id === activeKeypointId);
            if (activeKeypoint) {
                requestAnimationFrame(() => {
                    activeKeypoint.x = x / rect.width;
                    keypoints.sort((a, b) => a.x - b.x);
                    draw();
                    setKeypoints([...keypoints]);
                });
            }
        }
    };

    const onMouseUp = (event: MouseEvent) => {
        setIsDragging(false);
        onKeypointChange(keypoints);
        window.removeEventListener('mouseup', onMouseUp);
    };

    const onGradientClick = (event: React.MouseEvent) => {
        if (keypointEditorContainerRef.current) {
            const rect = keypointEditorContainerRef.current.getBoundingClientRect();
            let x = event.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width)) / keypointSvgWidth;
            const newKeypoint: Keypoint = { id: Date.now(), x, color: "#000000", alpha: 1 };
            setKeypoints([...keypoints, newKeypoint].sort((a, b) => a.x - b.x));
            setActiveKeypointId(newKeypoint.id);
        }
    };
    const onKeypointDelete = () => {
        setKeypoints(keypoints.filter(keypoint => keypoint.id !== activeKeypointId).sort((a, b) => a.x - b.x));
    }

    const getKeypointIcon = (keypoint: any) => {
        const strokeColor = keypoint.id === activeKeypointId ? '#0C8CE9' : '#B3B3B3';
        const fillColor = keypoint.color;
        const svg = `
            <svg width="40" height="40" viewBox="0 0 96 113" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M44.0521 107.297C46.7853 110.028 51.2147 110.028 53.9479 107.297L66.8027 94.4516C71.2149 90.0426 68.0923 82.5 61.8547 82.5L36.1452 82.5C29.9077 82.5 26.7851 90.0426 31.1973 94.4516L44.0521 107.297Z" fill="white" stroke="${strokeColor}" stroke-width="6"/>
            <rect x="9.5" y="9.5" width="77" height="77" rx="13.5" stroke="white" stroke-width="17" fill="${fillColor}" />
            <rect x="3.5" y="3.5" width="89" height="89" rx="9.5" stroke="${strokeColor}"  stroke-width="7"/>
            <path d="M50.4137 106.587C49.6328 107.368 48.3672 107.368 47.5863 106.587L29.9006 88.9147C28.64 87.655 29.5321 85.5 31.3143 85.5H66.6857C68.4679 85.5 69.36 87.655 68.0994 88.9147L50.4137 106.587Z" fill="#FFFCFC"/>
            </svg>
        `;
        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    }
    function generatePathD(keypoints: Keypoint[], width: number, height: number): string {
        // Start at the left edge with the alpha value of the first keypoint
        let d = `M 0 ${(1 - keypoints[0].alpha) * height}`;

        // Draw a line to the first keypoint
        d += ` L ${keypoints[0].x * width} ${(1 - keypoints[0].alpha) * height}`;

        // Draw lines for the middle keypoints
        for (let i = 1; i < keypoints.length; i++) {
            d += ` L ${keypoints[i].x * width} ${(1 - keypoints[i].alpha) * height}`;
        }

        // Draw a line to the right edge with the alpha value of the last keypoint
        d += ` L ${width} ${(1 - keypoints[keypoints.length - 1].alpha) * height}`;

        return d;
    }
    const onColorChange = (color: ColorResult) => {
        const activeKeypoint = keypoints.find(keypoint => keypoint.id === activeKeypointId);
        if (activeKeypoint) {
            activeKeypoint.color = color.hex;
            activeKeypoint.alpha = color.rgb.a as number;
            setKeypoints([...keypoints]);
            draw();
        }
    };

    return (
        <div ref={keypointEditorContainerRef} className={styles.keypointEditorContainer}>
            <div className={styles.keypointIconsContainer}>
                {keypoints.map(keypoint => (
                    <img
                        key={keypoint.id}
                        style={{ position: 'absolute', left: `${keypoint.x * keypointSvgWidth - 20}px` }}
                        src={getKeypointIcon(keypoint)}
                        onMouseDown={event => onKeypointMouseDown(event, keypoint)}
                        onDragStart={event => event.preventDefault()}
                        onMouseMove={event => onMouseMove(event.nativeEvent)}
                        onMouseUp={event => onMouseUp(event.nativeEvent)}
                    />
                ))}
            </div>
            <svg ref={gradientSvgRef} className={styles.keypointGradient}
                onClick={onGradientClick} onMouseDown={onGradientClick}
            ></svg>
            <svg className={styles.keypointAlphaCurve}>
                <path d={generatePathD(keypoints, keypointSvgWidth, keypointSvgHeight)} stroke="white" strokeWidth={1} fill="transparent" />
            </svg>

            <div className={styles.keypointColorPicker}>
                <button className={styles.deleteButton} onClick={onKeypointDelete}>
                    Delete
                </button>
                <SketchPicker
                    color={keypoints.find(keypoint => keypoint.id === activeKeypointId)?.color !== 'transparent'
                        ? {
                            r: chroma(keypoints.find(keypoint => keypoint.id === activeKeypointId)?.color || '#000').get('rgb.r'),
                            g: chroma(keypoints.find(keypoint => keypoint.id === activeKeypointId)?.color || '#000').get('rgb.g'),
                            b: chroma(keypoints.find(keypoint => keypoint.id === activeKeypointId)?.color || '#000').get('rgb.b'),
                            a: keypoints.find(keypoint => keypoint.id === activeKeypointId)?.alpha || 0
                        }
                        : {
                            r: 0,
                            g: 0,
                            b: 0,
                            a: 0
                        }
                    }
                    onChange={onColorChange}
                />

            </div>
        </div>

    );
}

export default KeypointEditorComponent;