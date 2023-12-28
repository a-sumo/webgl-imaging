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
    useEffect(() => {
        draw();
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [keypoints]);

    const draw = () => {
        if (!gradientSvgRef.current) {
            return;
        }
        gradientSvgRef.current.innerHTML = '';
        keypoints.sort((a, b) => a.x - b.x);
        const leftEdgePoint = { id: 999, x: 0, color: keypoints[0].color, alpha: keypoints[0].alpha };
        const rightEdgePoint = {
            id: 1000,
            x: gradientSvgRef.current.getBoundingClientRect().width,
            color: keypoints[keypoints.length - 1].color,
            alpha: keypoints[keypoints.length - 1].alpha
        };
        drawGradient(leftEdgePoint, keypoints[0]);
        keypoints.forEach((keypoint, index) => {

            if (index < keypoints.length - 1) {
                drawGradient(keypoint, keypoints[index + 1]);
            } else {
                drawGradient(keypoint, rightEdgePoint);
            }
        });
    };

    const drawGradient = (keypoint: Keypoint, nextKeypoint: Keypoint) => {
        const startColor = `rgba(${chroma(keypoint.color).alpha(keypoint.alpha).rgba().join(',')})`;
        const endColor = `rgba(${chroma(nextKeypoint.color).alpha(nextKeypoint.alpha).rgba().join(',')})`;
        const svg = `
          <defs>
              <linearGradient id="Gradient${keypoint.id}" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stop-color="${startColor}" />
                  <stop offset="100%" stop-color="${endColor}" />
              </linearGradient>
          </defs>
          <rect x="${keypoint.x * keypointSvgWidth}" y="0" width="${(nextKeypoint.x - keypoint.x) * keypointSvgWidth}" height="100%" fill="url(#Gradient${keypoint.id})" />
        `;
        gradientSvgRef.current!.innerHTML += svg;
    };

    const onKeypointMouseDown = (event: React.MouseEvent, keypoint: Keypoint) => {
        setActiveKeypointId(keypoint.id);
        setIsDragging(true);
    };

    const onMouseMove = (event: MouseEvent) => {
        if (isDragging && activeKeypointId !== null && keypointEditorContainerRef.current) {
            const rect = gradientSvgRef.current!.getBoundingClientRect();
            let x = event.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            const activeKeypoint = keypoints.find(keypoint => keypoint.id === activeKeypointId);
            if (activeKeypoint) {
                activeKeypoint.x = x / rect.width;
                keypoints.sort((a, b) => a.x - b.x);
                requestAnimationFrame(() => draw());
                setKeypoints([...keypoints]);
            }
        }
    };

    const onMouseUp = (event: MouseEvent) => {
        setIsDragging(false);
        onKeypointChange(keypoints);
    };


    const onGradientClick = (event: React.MouseEvent) => {
        if (keypointEditorContainerRef.current) {
            const rect = keypointEditorContainerRef.current.getBoundingClientRect();
            let x = event.clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width)) / keypointSvgWidth;
            const newKeypoint: Keypoint = { id: Date.now(), x, color: "#000000", alpha: 1 };
            setKeypoints([...keypoints, newKeypoint]);
            setActiveKeypointId(newKeypoint.id);
        }
    };
    const onKeypointDelete = () => {
        setKeypoints(keypoints.filter(keypoint => keypoint.id !== activeKeypointId));
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
    function generatePathD(keypoints: Keypoint[]): string {
        keypoints.sort((a, b) => a.x - b.x);
        let d = `M ${keypoints[0].x * keypointSvgWidth} ${keypoints[0].alpha * 50}`;
        for (let i = 1; i < keypoints.length; i++) {
            let cp1x = keypoints[i - 1].x * keypointSvgWidth + (keypoints[i].x - keypoints[i - 1].x) * keypointSvgWidth / 3;
            let cp1y = keypoints[i - 1].alpha * 50 + (keypoints[i].alpha - keypoints[i - 1].alpha) * 50 / 3;
            let cp2x = keypoints[i - 1].x * keypointSvgWidth + 2 * (keypoints[i].x - keypoints[i - 1].x) * keypointSvgWidth / 3;
            let cp2y = keypoints[i - 1].alpha * 50 + 2 * (keypoints[i].alpha - keypoints[i - 1].alpha) * 50 / 3;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${keypoints[i].x * keypointSvgWidth} ${keypoints[i].alpha * 50}`;
        }
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
            <div className={styles.keypointAlphaCurve}>
                <svg>
                    <path d={generatePathD(keypoints)} stroke="white" strokeWidth={1} fill="transparent" />
                </svg>
            </div>
            <div className={styles.keypointColorPicker}>
                <button className={styles.deleteButton} onClick={onKeypointDelete}>
                    Delete
                </button>
                <SketchPicker color={keypoints.find(keypoint => keypoint.id === activeKeypointId)?.color}
                    onChange={(color) => {
                        const alpha = color.rgb.a;
                        onColorChange(color);
                    }} />
            </div>
        </div>

    );
}

export default KeypointEditorComponent;