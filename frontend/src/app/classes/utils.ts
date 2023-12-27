import DataArray from './dataArray';
import Data3DTexture from './data3DTexture';
import { vec3 } from 'gl-matrix';

interface Keypoint {
    id: number; // Unique id of the keypoint
    x: number; // x-coordinate of the keypoint on the curve
    color: string; // Color in hexadecimal format
    alpha: number;// Alpha value 
}
export function createTextureFromSlice(gl: WebGL2RenderingContext, dataArray: DataArray, t: number): WebGLTexture {
    const slice = extractSlice(dataArray, t);
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texImage3D(
        gl.TEXTURE_3D,
        0, // level
        gl.R8, // internalformat
        slice.xLength, // width
        slice.yLength, // height
        slice.zLength, // depth
        0, // border
        gl.RED, // format
        gl.UNSIGNED_BYTE, // type
        slice.data // data
    );
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    return texture;
}


export function extractSlice(data: any, t: number): any {
    const slice = {
        data: new Uint8Array(data.xLength * data.yLength * data.zLength),
        xLength: data.xLength,
        yLength: data.yLength,
        zLength: data.zLength,
    };

    for (let z = 0; z < data.zLength; z++) {
        for (let y = 0; y < data.yLength; y++) {
            for (let x = 0; x < data.xLength; x++) {
                const index = x + y * data.xLength + z * data.xLength * data.yLength + t * data.xLength * data.yLength * data.zLength;
                slice.data[x + y * data.xLength + z * data.xLength * data.yLength] = data.data[index];
            }
        }
    }

    return slice;
}

export function initializeDataTexture(gl: WebGL2RenderingContext, xLength: number, yLength: number, zLength: number, defaultValue: number): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_3D, texture);
    gl.texImage3D(
        gl.TEXTURE_3D,
        0, // level
        gl.R8, // internalformat
        xLength, // width
        yLength, // height
        zLength, // depth
        0, // border
        gl.RED, // format
        gl.UNSIGNED_BYTE, // type
        new Uint8Array(xLength * yLength * zLength).fill(defaultValue) // data
    );
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    return texture;
}

export function initializePositionTexture(gl: WebGL2RenderingContext, xLength: number, yLength: number, zLength: number): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_3D, texture);

    // Create a 3D array to hold the color data
    const colorData = new Uint8Array(xLength * yLength * zLength * 4); // Allocate space for RGBA

    // Fill the array with RGBA colors
    for (let i = 0; i < xLength; i++) {
        for (let j = 0; j < yLength; j++) {
            for (let k = 0; k < zLength; k++) {
                const index = (i * yLength * zLength + j * zLength + k) * 4; // Multiply by 4 for RGBA
                colorData[index] = i / (xLength - 1) * 255; // Red
                colorData[index + 1] = j / (yLength - 1) * 255; // Green
                colorData[index + 2] = k / (zLength - 1) * 255; // Blue
                colorData[index + 3] = 255; // Alpha
            }
        }
    }

    gl.texImage3D(
        gl.TEXTURE_3D,
        0, // level
        gl.RGBA, // internalformat
        xLength, // width
        yLength, // height
        zLength, // depth
        0, // border
        gl.RGBA, // format
        gl.UNSIGNED_BYTE, // type
        colorData // data
    );
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    return texture;
}

export function initializeSphereTexture(gl: WebGL2RenderingContext, width: number, height: number, depth: number, radius: number): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_3D, texture);

    const data = new Uint8Array(width * height * depth * 4); // 4 for RGBA channels

    for (let z = 0; z < depth; z++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (z * width * height + y * width + x) * 4;

                const pos = vec3.fromValues(x / width, y / height, z / depth);
                const center = vec3.fromValues(0.5, 0.5, 0.5);
                const dist = vec3.distance(pos, center);

                const normalizedDist = 1.0 - Math.min(dist / radius, 1.0);

                data[idx] = data[idx + 1] = data[idx + 2] = data[idx + 3] = normalizedDist * 255;
            }
        }
    }

    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, width, height, depth, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
}

export function generateNoiseTexture(gl: WebGL2RenderingContext, width: number, height: number) {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const noiseData = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
        noiseData[i] = Math.random() * 255; // Random value between 0 and 255
    }

    gl.texImage2D(
        gl.TEXTURE_2D,
        0, // level
        gl.R8, // internalformat (Red channel only)
        width, // width
        height, // height
        0, // border
        gl.RED, // format (Red channel only)
        gl.UNSIGNED_BYTE, // type
        noiseData // data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}
type GradientEntry = [number, [number, number, number]];

function generateColor(intensity: number): [number, number, number] {
    // Define the color gradient
    const gradient: GradientEntry[] = [
        [0, [0, 0, 0]],    // Black at 0 intensity
        [0.25, [255, 0, 0]], // Red at 0.25 intensity
        [0.5, [255, 255, 0]], // Yellow at 0.5 intensity
        [0.75, [0, 255, 0]], // Green at 0.75 intensity
        [1, [0, 0, 255]]   // Blue at 1 intensity
    ];

    // Find the two colors that the intensity falls between
    let color1: [number, number, number] | undefined;
    let color2: [number, number, number] | undefined;
    let i: number;

    for (i = 0; i < gradient.length - 1; i++) {
        if (intensity >= gradient[i][0] && intensity < gradient[i + 1][0]) {
            color1 = gradient[i][1];
            color2 = gradient[i + 1][1];
            break;
        }
    }

    // Return a default color if no match is found
    if (color1 === undefined || color2 === undefined) {
        return [0, 0, 0]; // Default to black if out of range
    }

    // Interpolate between the two colors based on the intensity
    const weight = (intensity - gradient[i][0]) / (gradient[i + 1][0] - gradient[i][0]);
    const color: [number, number, number] = [
        Math.round(color1[0] * (1 - weight) + color2[0] * weight),
        Math.round(color1[1] * (1 - weight) + color2[1] * weight),
        Math.round(color1[2] * (1 - weight) + color2[2] * weight)
    ];

    return color;
}
function hexToRGBA(hex: string): number[] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) : 255;
    return [r, g, b, a];
}
export function generateTFData(width: number, keypoints: Keypoint[]): Uint8Array {
    const data = new Uint8Array(width * 4); // 4 for RGBA channels

    keypoints.sort((a, b) => a.x - b.x); // Ensure keypoints are in ascending order

    for (let i = 0; i < width; i++) {
        const position = i / width;

        // Find the two keypoints this position is between
        let k1 = keypoints[0];
        let k2 = keypoints[keypoints.length - 1];
        for (let j = 0; j < keypoints.length - 1; j++) {
            if (keypoints[j].x <= position && keypoints[j + 1].x >= position) {
                k1 = keypoints[j];
                k2 = keypoints[j + 1];
                break;
            }
        }

        // Interpolate color values
        const t = (position - k1.x) / (k2.x - k1.x);
        const color1 = hexToRGBA(k1.color);
        const color2 = hexToRGBA(k2.color);
        const color = color1.map((c, idx) => c + t * (color2[idx] - c));

        // Interpolate alpha values
        const alpha = k1.alpha + t * (k2.alpha - k1.alpha);
        // Set color and alpha data
        const idx = i * 4;
        data[idx] = color[0];
        data[idx + 1] = color[1];
        data[idx + 2] = color[2];
        data[idx + 3] = Math.round(alpha * 255); // Convert alpha from 0-1 range to 0-255 range
    }

    // Add colors at the beginning and the end of the gradient
    const firstColor = hexToRGBA(keypoints[0].color);
    const lastColor = hexToRGBA(keypoints[keypoints.length - 1].color);
    data.set(firstColor, 0);
    data.set(lastColor, data.length - 4);

    return data;
}

export function initializeTFTexture(gl: WebGL2RenderingContext, width: number, height: number, data: Uint8Array): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texture;
}
export function generateTransferFunctionTexture(gl: WebGL2RenderingContext, width: number, height: number, data: Uint8Array) {
    const texture = gl.createTexture();
    if (!texture) {
        throw new Error('Failed to create texture');
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(
        gl.TEXTURE_2D,
        0, // level
        gl.RGBA, // internalformat (Red, Green, Blue, Alpha)
        width, // width
        height, // height
        0, // border
        gl.RGBA, // format (Red, Green, Blue, Alpha)
        gl.UNSIGNED_BYTE, // type
        data // data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

export function buildShaders(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string, shaderProgram: any): boolean {
    let vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER) as WebGLShader;
    let fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER) as WebGLShader;
    if (!vertexShader || !fragmentShader) {
        return false;
    }
    shaderProgram = gl.createProgram();
    if (!shaderProgram) {
        return false;
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) && !gl.isContextLost()) {
        console.error("Unable to link shader program:", gl.getProgramInfoLog(shaderProgram));
        return false;
    }
    gl.useProgram(shaderProgram);
    return shaderProgram;
}

function compileShader(gl: WebGL2RenderingContext, source: any, type: any): WebGLShader {
    const shader = gl.createShader(type) as WebGLShader;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

