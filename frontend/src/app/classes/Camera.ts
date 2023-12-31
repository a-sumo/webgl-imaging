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
        this.quaternion = quat.create();

        // this.updateViewMatrix();
        // this.updateProjectionMatrix();

    }
    setPosition(position: vec3): void {
        this.position = position;
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    setTarget(target: vec3): void {
        this.target = target;
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    setUp(up: vec3): void {
        this.up = up;
        this.updateViewMatrix();
        this.updateProjectionMatrix();
    }

    updateViewMatrix() {
        const direction = vec3.create();
        vec3.subtract(direction, this.position, this.target);
        vec3.normalize(direction, direction);

        const right = vec3.create();
        vec3.cross(right, this.up, direction);
        vec3.normalize(right, right);

        const up = vec3.create();
        vec3.cross(up, direction, right);

        const rotationMatrix = mat4.create();
        mat4.fromQuat(rotationMatrix, this.quaternion);
        mat4.lookAt(this.viewMatrix, this.position, this.target, up);
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
    setZoom(zoom: number): void {
        this.zoom = zoom;
        this.updateProjectionMatrix();
    }
}

