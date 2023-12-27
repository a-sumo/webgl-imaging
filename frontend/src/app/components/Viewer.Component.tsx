'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Viewer } from '../classes/viewer';
import DataArray from '../classes/dataArray';
import NRRDLoader from '../classes/nrrdLoader';

interface Keypoint {
  id: number;
  x: number;
  color: string;
  alpha: number;
}

const ViewerComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [view, setView] = useState<Viewer | null>(null);
  const [isViewInit, setIsViewInit] = useState(false);
  const [keypoints, setKeypoints] = useState<Keypoint[]>([
    { id: 0, x: 0, color: "#000000", alpha: 0 },
    { id: 1, x: 20, color: "#ffffff", alpha: 1 },
  ]);

  const getNrrdData = (): Promise<ArrayBuffer> => {
    const filePath = '/PDA_CT.nrrd';
    return fetch(filePath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.arrayBuffer();
      });
  };

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      const viewer = new Viewer(canvasElement, keypoints);
      setView(viewer);

      // Prevent scrolling when mouse wheel is used inside the viewer
      canvasElement.addEventListener('wheel', function (event) {
        event.preventDefault();
      }, { passive: false });

      // Load the NRRD data
      getNrrdData().then(arrayBuffer => {
        const nrrdLoader = new NRRDLoader();
        const dataArray = nrrdLoader.parse(arrayBuffer);
        viewer.init(dataArray);
        setIsViewInit(true);
        viewer.updateTransferFunction(keypoints);

      }).catch(error => {
        console.error('Failed to fetch NRRD data:', error);
      });
    }

    return () => {
      // Cleanup code here if needed
    };
  }, []);

  const updateKeypoints = (newKeypoints: Keypoint[]) => {
    setKeypoints(newKeypoints);
    if (isViewInit && view) {
      view.updateTransferFunction(newKeypoints);
    }
  };

  return <canvas ref={canvasRef} width="400" height="400" />;
};

export default ViewerComponent;