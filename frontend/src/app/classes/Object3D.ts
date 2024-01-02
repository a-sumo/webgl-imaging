import { mat4, vec3 } from 'gl-matrix';
import { Geometry } from './Geometry';

export class Object3D {
	public modelMatrix: mat4;
	private orientation: vec3 = vec3.create();
	private scale: vec3 = vec3.fromValues(1, 1, 1);
	private boundingBox: { min: vec3, max: vec3 } =
		{
			min: vec3.fromValues(0, 0, 0),
			max: vec3.fromValues(1, 1, 1)
		};
	private geometry: Geometry;
	private shaderProgram: WebGLProgram;
	private uniforms: { [name: string]: { type: string, value: any } } = {};
	private attributes: { [name: string]: { type: string, value: any } } = {};
	private vao: WebGLVertexArrayObject | null;

	constructor(gl: WebGL2RenderingContext, geometry: Geometry, shaderProgram: WebGLProgram) {
		this.modelMatrix = mat4.create();
		this.geometry = geometry;
		this.shaderProgram = shaderProgram;
		this.computeBoundingBox(geometry);
		this.vao = null; // Initialize vao

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

	setVAO(vao: WebGLVertexArrayObject | null): void {
		this.vao = vao;
	}

	getVAO(): WebGLVertexArrayObject | null {
		return this.vao;
	}
	// Reset the model matrix to the identity matrix
	resetTransform(): void {
		mat4.identity(this.modelMatrix);
		this.computeBoundingBox(this.geometry);
	}
	public getGeometry(): Geometry {
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

	getShaderProgram() {
		return this.shaderProgram;
	}
	declareUniforms(uniforms: { name: string, type: string }[]) {
		for (const uniform of uniforms) {
			this.uniforms[uniform.name] = { type: uniform.type, value: null };
		}
	}
	declareAttributes(attributes: { name: string, type: string }[]) {
		for( const attribute of attributes){
			this.attributes[attribute.name] = { type: attribute.type, value: null };
		}
	}
	// Set the initial value of a uniform
	setUniformData(name: string, value: any) {
		if (this.uniforms[name] === undefined) {
			throw new Error(`Uniform ${name} does not exist.`);
		}
		this.uniforms[name].value = value;
	}
	// Set the initial value of an attribute
	setAttributeData(name: string, value: any) {
		if (this.attributes[name] === undefined) {
			throw new Error(`Attribute ${name} does not exist.`);
		}
		this.attributes[name].value = value;
	}
	// Update the value of a uniform
	updateUniform(name: string, value: any) {
		if (this.uniforms[name] === undefined) {
			throw new Error(`Uniform ${name} does not exist.`);
		}

		this.uniforms[name].value = value;
	}

	getUniforms() {
		return this.uniforms;
	}
	getAttributes(){
		return this.attributes;
	}

}
