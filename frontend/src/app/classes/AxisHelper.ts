import { buildShaders } from './utils';
export class AxisHelper {
    private gl: WebGL2RenderingContext;
    private vertexBuffer: WebGLBuffer | null;
    private colorBuffer: WebGLBuffer | null;
    private shaderProgram: WebGLProgram | null;

    private vertexShaderSource = `#version 300 es
        layout(location = 0) in vec3 a_Position;
        layout(location = 1) in vec3 a_Color;

        uniform mat4 u_ModelView;
        uniform mat4 u_Projection;

        out vec3 v_Color;

        void main() {
            gl_Position = u_Projection * u_ModelView * vec4(a_Position, 1.0);
            v_Color = a_Color;
        }
    `;

    private fragmentShaderSource = `#version 300 es
        precision mediump float;

        in vec3 v_Color;
        out vec4 outColor;

        void main() {
            outColor = vec4(v_Color, 1.0);
        }
    `;
    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;

        const vertices = new Float32Array([
            0, 0, 0, 1, 0, 0, // X axis
            0, 0, 0, 0, 1, 0, // Y axis
            0, 0, 0, 0, 0, 1  // Z axis
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const colors = new Float32Array([
            1, 0, 0, 1, 0, 0, // X axis - red
            0, 1, 0, 0, 1, 0, // Y axis - green
            0, 0, 1, 0, 0, 1  // Z axis - blue
        ]);

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

        this.shaderProgram = buildShaders(this.gl, this.vertexShaderSource, this.fragmentShaderSource);
    }

    render(modelViewMatrix: Float32List, projectionMatrix: Float32List) {
        if (this.shaderProgram === null) {
            console.error('Shader program is null');
            return;
        }

        this.gl.useProgram(this.shaderProgram);
    
        // Set the uniform values
        const u_ModelView = this.gl.getUniformLocation(this.shaderProgram, 'u_ModelView');
        this.gl.uniformMatrix4fv(u_ModelView, false, modelViewMatrix);
        const u_Projection = this.gl.getUniformLocation(this.shaderProgram, 'u_Projection');
        this.gl.uniformMatrix4fv(u_Projection, false, projectionMatrix);
    
        // Render the axis lines
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        this.gl.vertexAttribPointer(0, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);
    
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer);
        this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(1);
    
        this.gl.drawArrays(this.gl.LINES, 0, 6);

        this.gl.useProgram(null);
    }
}