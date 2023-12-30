import { mat4, vec2, vec3, quat } from 'gl-matrix';

export class Camera {
    public viewMatrix: mat4;
    public projectionMatrix: mat4;
    public position: vec3;
    public target: vec3;
    public up: vec3;
    public rotation: quat;
    public fov: number;
    public aspectRatio: number;
    public near: number;
    public far: number;
    public zoom: number;
    public quaternion: quat;
    // Mouse control properties
    private rotateStart: vec2;
    private rotateEnd: vec2;
    private rotateDelta: vec2;

    // For panning
    private panStart: vec2;
    private panEnd: vec2;
    private panDelta: vec2;

    // Constants
    private static readonly ROTATE_SPEED = 1.0;
    private static readonly ZOOM_SPEED = 1.0;
    private static readonly PAN_SPEED = 1.0;

    private lastPosition: vec3;
    private lastTarget: vec3;
    private lastUp: vec3;

    constructor(fov: number, aspectRatio: number, near: number, far: number) {
        this.fov = fov;
        this.aspectRatio = aspectRatio;
        this.near = near;
        this.far = far;

        this.position = vec3.fromValues(1, 1, 1);
        this.target = vec3.fromValues(0, 0, 0);
        this.up = vec3.fromValues(0, 1, 0);

        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.perspective(mat4.create(), this.fov, this.aspectRatio, this.near, this.far);
        this.rotation = quat.create();

        this.zoom = 1.0;

        this.rotateStart = vec2.create();
        this.rotateEnd = vec2.create();
        this.rotateDelta = vec2.create();

        this.panStart = vec2.create();
        this.panEnd = vec2.create();
        this.panDelta = vec2.create();

        this.lastPosition = vec3.clone(this.position);
        this.lastTarget = vec3.clone(this.target);
        this.lastUp = vec3.clone(this.up);
        this.quaternion = quat.create();

        this.updateViewMatrix();
        this.updateProjectionMatrix();

    }
    setPosition(position: vec3): void {
        this.position = position;
        this.updateViewMatrix();
    }

    setTarget(target: vec3): void {
        this.target = target;
        this.updateViewMatrix();
        // this.updateProjectionMatrix();
    }

    setUp(up: vec3): void {
        this.up = up;
        this.updateViewMatrix();
    }
    updateViewMatrix() {
        const rotationMatrix = mat4.create();
        mat4.fromQuat(rotationMatrix, this.quaternion);
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        mat4.multiply(this.viewMatrix, this.viewMatrix, rotationMatrix);
    }
    updateProjectionMatrix() {
        this.projectionMatrix = mat4.perspective(mat4.create(), this.fov, this.aspectRatio, this.near, this.far);
    }
    getQuaternion(): quat {
        return this.quaternion;
    }
    setQuaternion(quaternion: quat): void {
        this.quaternion = quaternion;
        this.updateViewMatrix();
    }


}

