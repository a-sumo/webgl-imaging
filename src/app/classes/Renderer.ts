import { Scene } from './Scene';
import { Camera } from './Camera';
import { Geometry } from './Geometry';
import { Object3D } from './Object3D';
import { Texture2D } from './Texture2D';
import { Texture3D } from './Texture3D';
import { mat4, vec3 } from 'gl-matrix';
import { AxisHelper2 } from './AxisHelper2';
export interface RendererConfig {
    faceCulling?: boolean;
    alphaBlending?: boolean;
    cullFace?: number;
    blendFuncSrc?: number;
    blendFuncDst?: number;
    clearColor?: [number, number, number, number];
}

export class Renderer {
    private gl: WebGL2RenderingContext;
    private mode: number;
    locations: Map<WebGLProgram, {
        uniforms: { [name: string]: WebGLUniformLocation },
        attributes: { [name: string]: number }
    }> = new Map();
    private currentProgram: WebGLProgram | null = null;

    private shaderPrograms: { [key: string]: WebGLProgram } = {};
    private config: RendererConfig;

    constructor(gl: WebGL2RenderingContext, config: RendererConfig = {}) {
        this.gl = gl;
        this.mode = this.gl.TRIANGLES;
        this.config = {
            faceCulling: true,
            alphaBlending: true,
            cullFace: this.gl.FRONT,
            blendFuncSrc: this.gl.SRC_ALPHA,
            blendFuncDst: this.gl.ONE_MINUS_SRC_ALPHA,
            clearColor: [0, 0, 0, 0],
            ...config
        };
        if (this.config.faceCulling) {
            this.gl.enable(this.gl.CULL_FACE);
            this.gl.cullFace(this.config.cullFace as number);
        }
        if (this.config.alphaBlending) {
            this.gl.enable(this.gl.BLEND);
            this.gl.blendFunc(this.config.blendFuncSrc as number, this.config.blendFuncDst as number);
        }
    }
    setMode(mode: 'LINE' | 'TRIANGLE' | 'POINT'): void {
        switch (mode) {
            case 'LINE':
                this.mode = this.gl.LINES;
                break;
            case 'TRIANGLE':
                this.mode = this.gl.TRIANGLES;
                break;
            case 'POINT':
                this.mode = this.gl.POINTS;
                break;
            default:
                throw new Error(`Unsupported mode: ${mode}`);
        }
    }
    addUniformLocation(name: string, program: WebGLProgram) {
        if (!this.locations.has(program)) {
            this.locations.set(program, { uniforms: {}, attributes: {} });
        }
        const programLocations = this.locations.get(program)!;
        programLocations.uniforms[name] = this.gl.getUniformLocation(program, name) as WebGLUniformLocation;
    }

    addAttributeLocation(name: string, program: WebGLProgram) {
        if (!this.locations.has(program)) {
            this.locations.set(program, { uniforms: {}, attributes: {} });
        }
        const programLocations = this.locations.get(program)!;
        programLocations.attributes[name] = this.gl.getAttribLocation(program, name) as number;
    }

    getSceneUniformLocations(scene: Scene) {
        this.traverseSceneAndGetProperties(scene, 'uniforms');
    }
    getSceneAttributeLocations(scene: Scene) {
        this.traverseSceneAndGetProperties(scene, 'attributes');
    }
    private traverseSceneAndGetProperties(scene: Scene, propertyType: 'uniforms' | 'attributes') {
        for (const object of scene.getObjects()) {
            let shaderProgram = object.getShaderProgram();
            this.gl.useProgram(shaderProgram);
            for (const [name, value] of Object.entries(object[propertyType])) {
                if (propertyType === 'uniforms') {
                    this.addUniformLocation(name, shaderProgram);
                } else {
                    this.addAttributeLocation(name, shaderProgram);
                }
            }
        }
    }

    setUniform(name: string, type: string, value: any) {
        const location = this.locations.get(this.currentProgram as WebGLProgram)?.uniforms[name];
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
    printUniformLocations(program: WebGLProgram) {
        // return all locations from this.locations.uniforms
        return this.locations;
    }

    private buildShaders(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram | false {

        let vertexShader = this.compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
        let fragmentShader = this.compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
        if (!vertexShader || !fragmentShader) {
            console.error('Failed to compile shaders');
            return false;
        }
        let shaderProgram = gl.createProgram();
        if (!shaderProgram) {
            console.error('Unable to create shader program');
            return false;
        }
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
            console.error('Unable to link shader program:', gl.getProgramInfoLog(shaderProgram));
            gl.deleteProgram(shaderProgram);
            return false;
        }
        gl.useProgram(shaderProgram);
        return shaderProgram;
    }

    private compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader | null {
        let shader = gl.createShader(type);
        if (!shader) {
            console.error('Unable to create shader');
            return null;
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            console.error('Failed to compile shader:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }


    private setupAttribute(program: WebGLProgram, name: string, data: number[], size: number): void {
        this.gl.useProgram(program);
        const buffer = this.createBuffer(this.gl, data);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        const location = this.gl.getAttribLocation(program, name);
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(location, size, this.gl.FLOAT, false, 0, 0);
    }

    createShaderProgram(vertexShaderSource: string, fragmentShaderSource: string, name: string): boolean {
        const program = this.buildShaders(this.gl, vertexShaderSource, fragmentShaderSource);
        if (program !== false) {
            this.shaderPrograms[name] = program;
        }
        return program !== false;
    }
    addShaderProgram(program: WebGLProgram, name: string): void {
        this.shaderPrograms[name] = program;
    }
    getShaderProgram(name: string): WebGLProgram | undefined {
        return this.shaderPrograms[name];
    }
    render(scene: Scene, camera: Camera) {
        // Clear the canvas
        if (this.config.clearColor) {
            this.gl.clearColor(...this.config.clearColor);
        }
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

            // Set the uniforms for the object
            const modelViewMatrix = mat4.create();
            const modelMatrix = mat4.create();
            mat4.multiply(modelViewMatrix, camera.viewMatrix, modelMatrix);
            for (const [name, uniform] of Object.entries(object.getUniforms())) {
                this.setUniform(name, uniform.type, uniform.value);
            }

            // Bind the VAO
            this.gl.bindVertexArray(object.getVAO());

            // Draw the object
            this.draw(object.getGeometry(), object.getDrawType(), object.getDrawMode());

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
    draw(geometry: Geometry, drawType: string, drawMode: string): void {
        this.gl.useProgram(this.currentProgram);
        switch (drawType) {
            case 'ARRAYS':
                // console.log("drawing arrays in mode", this.mode);
                this.gl.drawArrays(this.getGLDrawMode(drawMode), 0, geometry.vertexCount);
                break;
            case 'ELEMENTS':
                // console.log("drawing elements in mode", this.mode); 
                this.gl.drawElements(this.getGLDrawMode(drawMode), geometry.getIndexCount(), this.gl.UNSIGNED_SHORT, 0);
                break;
            default:
                throw new Error(`Unsupported draw type: ${drawType}`);
        }
        this.gl.useProgram(null);
    }

    setupVAO(object: Object3D): WebGLVertexArrayObject | null {
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        const geometry = object.getGeometry();
        const program = object.getShaderProgram();

        for (const [name, attribute] of Object.entries(object.getAttributes())) {
            switch (attribute.type) {
                case '1f':
                    this.setupAttribute(program, name, attribute.value, 1);
                    break;
                case '1i':
                    this.setupAttribute(program, name, attribute.value, 1);
                    break;
                case '2fv':
                    this.setupAttribute(program, name, attribute.value, 2);
                    break;
                case '3fv':
                    this.setupAttribute(program, name, attribute.value, 3);
                    break;
                case '4fv':
                    this.setupAttribute(program, name, attribute.value, 4);
                    break;
                case '1iv':
                    this.setupAttribute(program, name, attribute.value, 1);
                    break;
                case '2iv':
                    this.setupAttribute(program, name, attribute.value, 2);
                    break;
                case '3iv':
                    this.setupAttribute(program, name, attribute.value, 3);
                    break;
                case '4iv':
                    this.setupAttribute(program, name, attribute.value, 4);
                    break;
                case '1fv':
                    this.setupAttribute(program, name, attribute.value, 1);
                    break;
                case 'Matrix2fv':
                    this.setupAttribute(program, name, attribute.value, 4); // 2x2 matrix
                    break;
                case 'Matrix3fv':
                    this.setupAttribute(program, name, attribute.value, 9); // 3x3 matrix
                    break;
                case 'Matrix4fv':
                    this.setupAttribute(program, name, attribute.value, 16); // 4x4 matrix
                    break;
                default:
                    throw new Error(`Unsupported attribute type: ${attribute.type}`);
            }
        }
        // Set up the index attribute
        const indexBuffer = this.createBuffer(this.gl, geometry.indices, this.gl.ELEMENT_ARRAY_BUFFER);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        // Store the VAO in the object
        object.setVAO(vao);

        this.gl.bindVertexArray(null);

        return vao;
    }
    init() {
        // TODO: find a more streamlined way to set up the shaders
    }
    uploadTexture2D(texture: Texture2D, textureUnit: number): WebGLTexture | null {
        let { data, width, height, type } = texture.textureData;
        const previousTextureUnit = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);
        const glTexture = this.gl.createTexture();
        if (!glTexture) {
            throw new Error('Failed to create texture');
        }
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, glTexture);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, texture.unpackAlignment);

        // Convert data to Uint8Array regardless of the original type
        if (!(data instanceof Uint8Array)) {
            data = new Uint8Array(data.buffer);
        }

        let glType: number;
        switch (type) {
            case 'Uint8Array':
                glType = this.gl.UNSIGNED_BYTE;
                break;
            case 'Float32Array':
                glType = this.gl.FLOAT;
                break;
            default:
                throw new Error('Unsupported data type');
        }

        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            texture.internalFormat,
            width,
            height,
            0,
            texture.format,
            glType,
            data
        );

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, texture.minFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, texture.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, texture.wrapR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, texture.wrapR);

        this.gl.activeTexture(previousTextureUnit);
        return glTexture;
    }

    uploadTexture3D(texture: Texture3D, textureUnit: number): WebGLTexture | null {
        let { data, width, height, depth, type } = texture.textureData;
        const previousTextureUnit = this.gl.getParameter(this.gl.ACTIVE_TEXTURE);
        const glTexture = this.gl.createTexture();
        if (!glTexture) {
            throw new Error('Failed to create texture');
        }
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(this.gl.TEXTURE_3D, glTexture);

        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, texture.flipY);
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, texture.premultiplyAlpha);
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, texture.unpackAlignment);

        // Convert data to Uint8Array regardless of the original type
        if (!(data instanceof Uint8Array)) {
            data = new Uint8Array(data.buffer);
        }
        let glType: number;
        switch (type) {
            case 'Uint8Array':
            case 'Int16Array':
                glType = this.gl.UNSIGNED_BYTE;
                break;
            case 'Float32Array':
                glType = this.gl.FLOAT;
                break;
            default:
                throw new Error('Unsupported data type');
        }

        this.gl.texImage3D(
            this.gl.TEXTURE_3D,
            0,
            texture.internalFormat,
            width,
            height,
            depth,
            0,
            texture.format,
            glType,
            data
        );

        this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MIN_FILTER, texture.minFilter);
        this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_MAG_FILTER, texture.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_S, texture.wrapR);
        this.gl.texParameteri(this.gl.TEXTURE_3D, this.gl.TEXTURE_WRAP_T, texture.wrapR);

        this.gl.activeTexture(previousTextureUnit);
        return glTexture;
    }
    private getGLDrawType(drawType: 'ARRAYS' | 'ELEMENTS'): number {
        // console.log("drawtype", drawType);
        switch (drawType) {
            case 'ARRAYS':
                return this.gl.ARRAY_BUFFER;
            case 'ELEMENTS':
                return this.gl.ELEMENT_ARRAY_BUFFER;
            default:
                throw new Error(`Unsupported draw type: ${drawType}`);
        }
    }

    private getGLDrawMode(drawMode: string): number {
        // console.log("drawmode", drawMode);
        switch (drawMode) {
            case 'POINTS':
                return this.gl.POINTS;
            case 'LINE_STRIP':
                return this.gl.LINE_STRIP;
            case 'LINE_LOOP':
                return this.gl.LINE_LOOP;
            case 'LINES':
                return this.gl.LINES;
            case 'TRIANGLE_STRIP':
                return this.gl.TRIANGLE_STRIP;
            case 'TRIANGLE_FAN':
                return this.gl.TRIANGLE_FAN;
            case 'TRIANGLES':
                return this.gl.TRIANGLES;
            default:
                throw new Error(`Unsupported draw mode: ${drawMode}`);
        }
    }

}