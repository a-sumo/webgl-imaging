import { mat4, vec3 } from 'gl-matrix';
import { Geometry } from './Geometry';
import { buildShaders } from './utils';
import { Object3D } from './Object3D';

export class AxisHelper2 extends Object3D {
    private vertexBuffer: WebGLBuffer | null;
    private colorBuffer: WebGLBuffer | null;

    constructor(gl: WebGL2RenderingContext, geometry: Geometry) {
        super(gl, geometry);

        // Assign the buffers
        this.vertexBuffer = geometry.getVertexBuffer();
        this.colorBuffer = geometry.getColorBuffer();

        // Override the shader program
        this.shaderProgram = this.createAxisHelper2ShaderProgram(gl);
    }
    // get vertex buffer 
    getVertexBuffer(): WebGLBuffer | null {
        return this.vertexBuffer;
    }
    // get color buffer
    getColorBuffer(): WebGLBuffer | null {
        return this.colorBuffer;
    }
    private createAxisHelper2ShaderProgram(gl: WebGL2RenderingContext): WebGLProgram {
        // Create the AxisHelper2-specific shader program here
        // This is just a placeholder, replace it with your actual shader program creation code
        const vertexShaderSource = `#version 300 es
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

        const fragmentShaderSource = `#version 300 es
        precision mediump float;

        in vec3 v_Color;
        out vec4 outColor;

        void main() {
            outColor = vec4(v_Color, 1.0);
        }
    `;
        const program = buildShaders(gl, vertexShaderSource, fragmentShaderSource);
        if (!program) {
            throw new Error('Failed to create AxisHelper2 shaders/program.');
        }
        return program;
    }


}