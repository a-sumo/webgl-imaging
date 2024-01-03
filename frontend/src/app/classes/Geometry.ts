import { mat4, vec3 } from 'gl-matrix';

export class Geometry {
    // Geometry data
    public vertices: number[];
    public indices: number[];
    public normals: number[];
    public uvs: number[];
    public colors: number[]; // New color data
    private vertexBuffer: WebGLBuffer | null;
    private indexBuffer: WebGLBuffer | null;
    private normalBuffer: WebGLBuffer | null;
    private uvBuffer: WebGLBuffer | null;
    private colorBuffer: WebGLBuffer | null; // New color buffer
    private indexCount: number;
    private vao: WebGLVertexArrayObject | null;

    constructor(gl: WebGL2RenderingContext, { vertices= [], indices = [], normals = [], uvs = [], colors = [] }: { vertices: number[], indices?: number[], normals?: number[], uvs?: number[], colors?: number[] }) {
        this.vertices = vertices;
        this.indices = indices;
        this.normals = normals;
        this.uvs = uvs;
        this.colors = colors;
        this.indexCount = indices.length;
    
        // Create and initialize the buffers
        this.vertexBuffer = this.createBuffer(gl, vertices);
        this.indexBuffer = indices.length > 0 ? this.createBuffer(gl, indices, gl.ELEMENT_ARRAY_BUFFER as WebGL2RenderingContext["ARRAY_BUFFER"]) : null;
        this.normalBuffer = normals.length > 0 ? this.createBuffer(gl, normals) : null;
        this.uvBuffer = uvs.length > 0 ? this.createBuffer(gl, uvs) : null;
        this.colorBuffer = colors.length > 0 ? this.createBuffer(gl, colors) : null;
    
        // Create the VAO
        this.vao = gl.createVertexArray();
        this.setupVAO(gl);
    }

    // Helper method to create a buffer
    private createBuffer(gl: WebGL2RenderingContext, data: number[], target: WebGL2RenderingContext["ARRAY_BUFFER"] | WebGL2RenderingContext["ELEMENT_ARRAY_BUFFER"] = gl.ARRAY_BUFFER): WebGLBuffer | null {
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

    // Helper method to set up the VAO
    private setupVAO(gl: WebGL2RenderingContext) {
        gl.bindVertexArray(this.vao);

        // Set up the vertex attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        // Set up the index attribute
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

        // Set up the normal attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

        // Set up the UV attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        // Set up the UV attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);

        // Set up the color attribute
        if (this.colors.length > 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 0, 0);
        }

        // Unbind the VAO
        gl.bindVertexArray(null);
    }

    // Getters for the buffers
    getVertexBuffer() {
        return this.vertexBuffer;
    }

    getIndexBuffer() {
        return this.indexBuffer;
    }

    getNormalBuffer() {
        return this.normalBuffer;
    }

    getUVBuffer() {
        return this.uvBuffer;
    }

    // New getter for the color buffer
    getColorBuffer() {
        return this.colorBuffer;
    }

    // Getter for the index count
    getIndexCount() {
        return this.indexCount;
    }

    get vertexCount(): number {
        return this.vertices.length / 3;
    }

    getVao() {
        return this.vao;
    }

    // New getter for the color data
    getColors() {
        return this.colors;
    }
}