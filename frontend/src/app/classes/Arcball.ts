import { vec3, mat4, quat } from 'gl-matrix';
import { Camera } from './Camera';

export class Arcball {
    private camera: Camera;
    private canvas: HTMLCanvasElement;
    cameraPosition: vec3;
    cameraUp: vec3;
    target: vec3;
    spherical: { radius: number, phi: number, theta: number };
    arcballRadius: number;
    isMouseDown: boolean = false;

    constructor(camera: Camera, canvas: HTMLCanvasElement) {
        this.camera = camera;
        this.canvas = canvas;
        this.cameraPosition = vec3.clone(camera.position);
        this.cameraUp = vec3.clone(camera.up);
        this.target = vec3.clone(camera.target);
        this.spherical = { radius: vec3.distance(this.cameraPosition, this.target), phi: 0, theta: 0 };
        this.arcballRadius = vec3.distance(this.cameraPosition, this.target);

        this.init();
    }

    init() {
        // Initialize event listeners for mouse controls
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this));
    }

    onMouseDown(event: MouseEvent) {
        this.isMouseDown = true;
    }

    onMouseUp(event: MouseEvent) {
        this.isMouseDown = false;
    }

    onMouseLeave(event: MouseEvent) {
        this.isMouseDown = false;
    }

    onMouseMove(event: MouseEvent) {
        if (!this.isMouseDown) return;
        // Check if mouse movement is zero
        if (event.movementX === 0 && event.movementY === 0) {
            return;
        }

        // Convert mouse movement to spherical coordinates
        const dx = event.movementX * 0.005;
        const dy = event.movementY * 0.005;
        const dtheta = dx / this.arcballRadius;
        const dphi = dy / this.arcballRadius;

        // Update spherical coordinates
        this.spherical.theta += dtheta;
        this.spherical.phi -= dphi;

        // Normalize the spherical coordinates
        this.spherical.theta = this.spherical.theta % (2 * Math.PI);
        this.spherical.phi = Math.max(Math.min(this.spherical.phi, Math.PI), -Math.PI);

        this.update();
    }


    onMouseWheel(event: WheelEvent) {
        this.spherical.radius -= event.deltaY * 0.01;
        this.spherical.radius = Math.max(1.0, Math.min(100.0, this.spherical.radius)); // Limit zoom
        this.update();
    }

    update() {
        // Calculate new camera position, target, and up vector
        const newPosition = vec3.create();
        const offset = vec3.create();
        vec3.subtract(offset, this.target, this.cameraPosition);
        vec3.rotateY(offset, offset, this.target, this.spherical.theta);
        vec3.rotateX(offset, offset, this.target, this.spherical.phi);
        vec3.normalize(offset, offset); // Normalize the offset vector
        vec3.scale(offset, offset, this.spherical.radius); // Scale the offset vector by the radius
        vec3.add(newPosition, this.target, offset); // Add the offset vector to the target to get the new camera position

        // Update camera
        this.camera.setPosition(newPosition);
        this.camera.setTarget(this.target);
        this.camera.setUp(this.cameraUp);
    }


}