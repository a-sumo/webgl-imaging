import { Scene } from './Scene';
import { Camera } from './Camera';
import { Geometry } from './Geometry';
import { Object3D } from './Object3D';

export class Renderer {
    private gl: WebGL2RenderingContext;
    private locations: { [name: string]: WebGLUniformLocation } = {};
    private currentProgram: WebGLProgram | null = null;
    private shaderPrograms: { [key: string]: WebGLProgram } = {};

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.setupWebGLContext();

    }

    addUniform(name: string, program: WebGLProgram) {
        this.locations[name] = this.gl.getUniformLocation(program, name) as WebGLUniformLocation;
    }

    setUniform(name: string, type: string, value: any) {
        const location = this.locations[name];
        if (location === undefined) {
            console.warn(`Uniform "${name}" is not defined.`);
            return;
        }

        switch (type) {
            case '1f':
                this.gl.uniform1f(location, value);
                break;
            case '1i':
                this.gl.uniform1i(location, value);
                break;
            case '2fv':
                this.gl.uniform2fv(location, value);
                break;
            case '3fv':
                this.gl.uniform3fv(location, value);
                break;
            case '4fv':
                this.gl.uniform4fv(location, value);
                break;
            case '1iv':
                this.gl.uniform1iv(location, value);
                break;
            case '2iv':
                this.gl.uniform2iv(location, value);
                break;
            case '3iv':
                this.gl.uniform3iv(location, value);
                break;
            case '4iv':
                this.gl.uniform4iv(location, value);
                break;
            case '1fv':
                this.gl.uniform1fv(location, value);
                break;
            case 'Matrix2fv':
                this.gl.uniformMatrix2fv(location, false, value);
                break;
            case 'Matrix3fv':
                this.gl.uniformMatrix3fv(location, false, value);
                break;
            case 'Matrix4fv':
                this.gl.uniformMatrix4fv(location, false, value);
                break;
            default:
                console.warn(`Uniform type "${type}" is not supported.`);
                break;
        }
    }
    private buildShaders(vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram | false {
        let vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        let fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {
            return false;
        }
        let shaderProgram = this.gl.createProgram();
        if (!shaderProgram) {
            return false;
        }
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        if (!this.gl.getProgramParameter(shaderProgram, this.gl.LINK_STATUS) && !this.gl.isContextLost()) {
            console.error("Unable to link shader program:", this.gl.getProgramInfoLog(shaderProgram));
            return false;
        }
        this.gl.useProgram(shaderProgram);
        return shaderProgram;
    }

    private compileShader(source: string, type: number): WebGLShader {
        const shader = this.gl.createShader(type);
        if (!shader) {
            throw new Error("Unable to create shader");
        }
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        return shader;
    }

    private setupAttribute(program: WebGLProgram, name: string, data: number[], size: number): void {
        const buffer = this.createBuffer(this.gl, data);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        const location = this.gl.getAttribLocation(program, name);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
    }

    createShaderProgram(vertexShaderSource: string, fragmentShaderSource: string, name: string): boolean {
        const program = this.buildShaders(vertexShaderSource, fragmentShaderSource);
        if (program !== false) {
            this.shaderPrograms[name] = program;
        }
        return program !== false;
    }

    getShaderProgram(name: string): WebGLProgram | undefined {
        return this.shaderPrograms[name];
    }
    private setupWebGLContext(): void {
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(this.gl.FRONT);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
    render(scene: Scene, camera: Camera) {
        // Clear the canvas
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        // Traverse the scene's objects
        for (const object of scene.getObjects()) {
            // Use the object's shader program if it's different from the current one
            const program = object.getShaderProgram();
            if (program !== this.currentProgram) {
                this.gl.useProgram(program);
                this.currentProgram = program;
            }

            // Set the uniforms for the object
            for (const [name, value] of Object.entries(object.getUniforms())) {
                this.setUniform(name, value.type, value.value);
            }

            // Bind the VAO
            this.gl.bindVertexArray(object.getVAO());

            // Draw the object
            if (object.getGeometry().indices.length > 0) {
                this.gl.drawElements(this.gl.TRIANGLES, object.getGeometry().indices.length, this.gl.UNSIGNED_SHORT, 0);
            } else {
                this.gl.drawArrays(this.gl.TRIANGLES, 0, object.getGeometry().vertexCount);
            }

            // Unbind the VAO
            this.gl.bindVertexArray(null);
        }
    }

    createBuffer(gl: WebGL2RenderingContext, data: number[], target: WebGL2RenderingContext["ARRAY_BUFFER"] | WebGL2RenderingContext["ELEMENT_ARRAY_BUFFER"] = gl.ARRAY_BUFFER): WebGLBuffer | null {
        const buffer = gl.createBuffer();
        if (target !== null) {
            gl.bindBuffer(target, buffer);
            if (target === gl.ELEMENT_ARRAY_BUFFER) {
                gl.bufferData(target, new Uint16Array(data), gl.STATIC_DRAW);
            } else {
                gl.bufferData(target, new Float32Array(data), gl.STATIC_DRAW);
            }
        }
        return buffer;
    }

    setupVAO(object: Object3D): WebGLVertexArrayObject | null {
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        const geometry = object.getGeometry();
        const program = object.getShaderProgram();

        // Set up the attributes
        this.setupAttribute(program, 'position', geometry.vertices, 3);
        this.setupAttribute(program, 'normal', geometry.normals, 3);
        this.setupAttribute(program, 'uv', geometry.uvs, 2);

        // Set up the index attribute
        const indexBuffer = this.createBuffer(this.gl, geometry.indices, this.gl.ELEMENT_ARRAY_BUFFER);
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

        // Unbind the VAO
        this.gl.bindVertexArray(null);

        // Store the VAO in the object
        object.setVAO(vao);
        return vao;
    }

}