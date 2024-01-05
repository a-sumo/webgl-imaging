import { mat4, vec3 } from 'gl-matrix';
import { Geometry } from './Geometry';
import { buildShaders } from './utils';
import { Object3D } from './Object3D';

export class AxisHelper2 extends Object3D {
    private vertexBuffer: WebGLBuffer | null;
    private colorBuffer: WebGLBuffer | null;
    constructor(geometry: Geometry, shaderProgram: WebGLProgram) {
        super(geometry, shaderProgram);
        // set the drawmode and drawtype
        this.drawMode = 'LINES';
        this.drawType = 'ARRAYS';
        // Assign the buffers
        this.vertexBuffer = geometry.getVertexBuffer();
        this.colorBuffer = geometry.getColorBuffer();

    }
    // get vertex buffer 
    getVertexBuffer(): WebGLBuffer | null {
        return this.vertexBuffer;
    }
    // get color buffer
    getColorBuffer(): WebGLBuffer | null {
        return this.colorBuffer;
    }

}