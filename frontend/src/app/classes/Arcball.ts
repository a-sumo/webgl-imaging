import { vec2, vec3, mat4, quat } from 'gl-matrix';
import { Camera } from './Camera';

export class Arcball {
    private camera: Camera;
    private canvas: HTMLCanvasElement;
    cameraPosition: vec3;
    cameraUp: vec3;
    target: vec3;
    rotation: quat;
    arcballRadius: number;
    isMouseDown: boolean = false;

    // Constants
    private static readonly ROTATE_SPEED = 1.0;
    private static readonly ZOOM_SPEED = 1.0;
    private static readonly PAN_SPEED = 1.0;

    constructor(camera: Camera, canvas: HTMLCanvasElement) {
        this.camera = camera;
        this.canvas = canvas;
        this.cameraPosition = vec3.clone(camera.position);
        this.cameraUp = vec3.clone(camera.up);
        this.target = vec3.clone(camera.target);
        this.rotation = quat.create();
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
        const dx = event.movementX * 0.01 * Arcball.ROTATE_SPEED;
        const dy = event.movementY * 0.01 * Arcball.ROTATE_SPEED;

        // Create a quaternion from the mouse movement
        const dQuat = quat.create();
        quat.rotateY(dQuat, dQuat, dx);
        quat.rotateX(dQuat, dQuat, dy);

        // Multiply the current rotation by the delta quaternion
        quat.multiply(this.rotation, this.rotation, dQuat);

        this.update();
    }

    onMouseWheel(event: WheelEvent) {
        const zoomAmount = event.deltaY * 0.01 * Arcball.ZOOM_SPEED;
        this.arcballRadius = Math.max(1.0, Math.min(100.0, this.arcballRadius - zoomAmount));
        this.update();
    }

    update() {
        // Calculate new camera position
        const offset = vec3.fromValues(0, 0, this.arcballRadius);
        vec3.transformQuat(offset, offset, this.rotation);
        vec3.add(this.cameraPosition, this.target, offset);

        // Update camera
        this.camera.setPosition(this.cameraPosition);
        this.camera.setTarget(this.target);
        this.camera.setUp(this.cameraUp);
    }
}