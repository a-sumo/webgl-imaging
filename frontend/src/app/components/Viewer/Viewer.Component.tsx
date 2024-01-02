'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Viewer } from '../../classes/viewer';
import DataArray from '../../classes/dataArray';
import NRRDLoader from '../../classes/nrrdLoader';
import { Keypoint } from '../KeypointEditor/keypoint.interface';
import KeypointEditorComponent from '../KeypointEditor/KeypointEditor.Component'
import styles from './Viewer.Component.module.css';
import { Viewer2 } from '../../classes/viewer2';
const ViewerComponent = () => {

  const [keypoints, setKeypoints] = useState<Keypoint[]>([
    { id: 0, x: 0, color: "#000000", alpha: 0 },
    { id: 1, x: 1, color: "#ffffff", alpha: 1 },
  ])
  const [keypoints2, setKeypoints2] = useState<Keypoint[]>([
    { id: 0, x: 0, color: "#000000", alpha: 0 },
    { id: 1, x: 1, color: "#ffffff", alpha: 1 },
  ])
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvas2Ref = useRef<HTMLCanvasElement | null>(null);

  const [view, setView] = useState<Viewer | null>(null);
  const [view2, setView2] = useState<Viewer2 | null>(null);

  const [isViewInit, setIsViewInit] = useState(false);
  const [isView2Init, setIsView2Init] = useState(false);

  const handleKeypointUpdate = (updatedKeypoints: Keypoint[]) => {
    if (isViewInit && view) {
      setKeypoints(updatedKeypoints);
      view.updateTransferFunction(updatedKeypoints);
    }
  };

  const getNrrdData = (): Promise<ArrayBuffer> => {
    const filePath = '/MR-head.nrrd';
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
      // Get the WebGL context, with no premultiplied alpha
      const gl = canvasRef.current?.getContext('webgl2', {
        alpha: false,
        premultipliedAlpha: false,
        anliasing: true
      }) as WebGL2RenderingContext;

      const viewer = new Viewer(gl, canvasElement, keypoints2, { useAxisHelper: true });

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
        // viewer.updateTransferFunction(keypoints);

      }).catch(error => {
        console.error('Failed to fetch NRRD data:', error);
      });
    }

    return () => {
    };
  }, []);
  
  useEffect(() => {
    const canvas2Element = canvas2Ref.current;

    if (canvas2Element) {
      // Get the WebGL context, with no premultiplied alpha
      const gl = canvas2Ref.current?.getContext('webgl2', {
        alpha: false,
        premultipliedAlpha: false,
        anliasing: true
      }) as WebGL2RenderingContext;

      const viewer2 = new Viewer2(gl, canvas2Element, keypoints, { useAxisHelper: true });

      setView2(viewer2);
      // Prevent scrolling when mouse wheel is used inside the viewer
      canvas2Element.addEventListener('wheel', function (event) {
        event.preventDefault();
      }, { passive: false });

      // Load the NRRD data
      getNrrdData().then(arrayBuffer => {
        const nrrdLoader = new NRRDLoader();
        const dataArray = nrrdLoader.parse(arrayBuffer);
        viewer2.init(dataArray, keypoints);
        setIsView2Init(true);
        // viewer.updateTransferFunction(keypoints);

      }).catch(error => {
        console.error('Failed to fetch NRRD data:', error);
      });
    }

    return () => {
    };
  }, []);

  return <div className="viewerContainer">
    <canvas ref={canvasRef} width="400" height="400" />
    <canvas ref={canvas2Ref} width="400" height="400" />
    <KeypointEditorComponent keypoints={keypoints} setKeypoints={setKeypoints} onKeypointChange={handleKeypointUpdate} />
  </div>;
};

export default ViewerComponent;