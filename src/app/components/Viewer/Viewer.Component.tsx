'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Viewer } from '../../classes/viewer';
import DataArray from '../../classes/dataArray';
import NRRDLoader from '../../classes/nrrdLoader';
import { Keypoint } from '../KeypointEditor/keypoint.interface';
import KeypointEditorComponent from '../KeypointEditor/KeypointEditor.Component'
import styles from './Viewer.Component.module.css';

const ViewerComponent = () => {

  const [keypoints, setKeypoints] = useState<Keypoint[]>([
    { id: 0, x: 0, color: "#000000", alpha: 0 },
    { id: 1, x: 1, color: "#ffffff", alpha: 1 },
  ]);
  const [isKeypointsLoaded, setIsKeypointsLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [view, setView] = useState<Viewer | null>(null);

  const [isViewInit, setIsViewInit] = useState(false);

  const handleKeypointUpdate = (updatedKeypoints: Keypoint[]) => {
    if (isViewInit && view) {
      setKeypoints(updatedKeypoints);
      view.updateTransferFunction(updatedKeypoints);
    }
  };
  // Load keypoints from local storage when the component mounts
  useEffect(() => {
    const storedKeypoints = localStorage.getItem('keypoints');
    if (storedKeypoints) {
      setKeypoints(JSON.parse(storedKeypoints));
      setIsKeypointsLoaded(true);
    }
  }, []);
  // Save keypoints to localStorage whenever they change
  useEffect(() => {
    if (isKeypointsLoaded) {
      localStorage.setItem('keypoints', JSON.stringify(keypoints));
    }
  }, [keypoints, isKeypointsLoaded]);

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
    const handleBlur = () => {
      view?.stopAnimationLoop();
    }

    const handleFocus = () => {
      view?.startAnimationLoop();
    }

    window.addEventListener('blur', handleBlur, { passive: true });
    window.addEventListener('focus', handleFocus, { passive: true });

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus)
    }
  }, [view]);

  useEffect(() => {
    const canvas2Element = canvasRef.current;

    if (canvas2Element) {
      // Get the WebGL context, with no premultiplied alpha
      const gl = canvasRef.current?.getContext('webgl2', {
        alpha: false,
        premultipliedAlpha: false,
        anliasing: true
      }) as WebGL2RenderingContext;

      const storedKeypoints = localStorage.getItem('keypoints');
      const initialKeypoints = storedKeypoints ? JSON.parse(storedKeypoints) : keypoints;

      const viewer = new Viewer(gl, canvas2Element, keypoints, { useAxisHelper: true });
      setView(viewer);
      // Prevent scrolling when mouse wheel is used inside the viewer
      canvas2Element.addEventListener('wheel', function (event) {
        event.preventDefault();
      }, { passive: false });

      // Load the NRRD data
      getNrrdData().then(arrayBuffer => {
        const nrrdLoader = new NRRDLoader();
        const dataArray = nrrdLoader.parse(arrayBuffer);
        viewer.init(dataArray, initialKeypoints);
        setIsViewInit(true);
        viewer.updateTransferFunction(initialKeypoints);
        viewer.startAnimationLoop();

      }).catch(error => {
        console.error('Failed to fetch NRRD data:', error);
      });
    }

    return () => {
    };
  }, []);

  return <div className={styles.viewerContainer}>
    <canvas className={styles.viewerCanvas} ref={canvasRef} width="1200" height="800" />
    <KeypointEditorComponent keypoints={keypoints} setKeypoints={setKeypoints} onKeypointChange={handleKeypointUpdate} />
  </div>;
};

export default ViewerComponent;