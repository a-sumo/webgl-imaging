import { mat4, vec3 } from 'gl-matrix';
import { Geometry } from './Geometry';

export class Object3D {
	// Transformation matrices
	public modelMatrix: mat4;

	// New properties for orientation, scale, and bounding box
	private orientation: vec3 = vec3.create();
	private scale: vec3 = vec3.fromValues(1, 1, 1);
	private boundingBox: { min: vec3, max: vec3 } =
		{
			min: vec3.fromValues(0, 0, 0),
			max: vec3.fromValues(1, 1, 1)
		};
	private geometry: Geometry;

	constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
		this.modelMatrix = mat4.create();
		this.geometry = geometry;
		this.computeBoundingBox(geometry);
	}

	private computeBoundingBox(geometry: Geometry): void {
		if (geometry.vertices.length % 3 !== 0) {
			throw new Error('Vertices array length must be a multiple of 3.');
		}

		const min = vec3.create();
		const max = vec3.create();

		for (let i = 0; i < geometry.vertices.length; i += 3) {
			const vertex = vec3.fromValues(geometry.vertices[i], geometry.vertices[i + 1], geometry.vertices[i + 2]);
			const transformedVertex = vec3.transformMat4(vec3.create(), vertex, this.modelMatrix);

			for (let j = 0; j < 3; j++) {
				min[j] = Math.min(min[j], transformedVertex[j]);
				max[j] = Math.max(max[j], transformedVertex[j]);
			}
		}

		this.boundingBox = { min, max };
	}


	// Translate the object by a given vector
	translate(translation: vec3): void {
		mat4.translate(this.modelMatrix, this.modelMatrix, translation);
		vec3.add(this.orientation, this.orientation, translation);
		this.computeBoundingBox(this.geometry);
	}

	// Rotate the object around a given axis by an angle in radians
	rotate(angleInRadians: number, axis: vec3): void {
		mat4.rotate(this.modelMatrix, this.modelMatrix, angleInRadians, axis);
		this.computeBoundingBox(this.geometry);
	}

	// Scale the object by a given vector
	setScale(scaling: vec3): void {
		mat4.scale(this.modelMatrix, this.modelMatrix, scaling);
		vec3.mul(this.scale, this.scale, scaling);
		this.computeBoundingBox(this.geometry);
	}

	// Reset the model matrix to the identity matrix
	resetTransform(): void {
		mat4.identity(this.modelMatrix);
		this.computeBoundingBox(this.geometry);
	}
	getGeometry() {
		return this.geometry;
	}
	// New getter methods
	getOrientation() {
		return this.orientation;
	}

	getScale() {
		return this.scale;
	}

	getBoundingBox() {
		return this.boundingBox;
	}

}
