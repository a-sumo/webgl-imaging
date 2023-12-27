import DataArray from './dataArray';

export default class Data3DTexture {
    isData3DTexture: boolean;
    textureData: { data: any, width: number, height: number, depth: number, type?: string };
    magFilter: number;
    minFilter: number;
    wrapR: number;
    generateMipmaps: boolean;
    flipY: boolean;
    unpackAlignment: number;
    premultiplyAlpha: boolean;

    constructor(dataArray: DataArray, width: number, height: number, depth: number) {
        this.isData3DTexture = true;
        // const { min, max } = dataArray.computeMinMax();

        // this.textureData = { data: this.normalizeData(dataArray.data, min, max), width, height, depth, type: dataArray.dataType };
        this.textureData = { data: dataArray.data, width, height, depth, type: dataArray.dataType };

        this.magFilter = 9728; // NearestFilter
        this.minFilter = 9728; // NearestFilter
        this.wrapR = 33071; // ClampToEdgeWrapping
        this.generateMipmaps = false;
        this.flipY = false;
        this.unpackAlignment = 1;
        this.premultiplyAlpha = false;
    }

    public normalizeData(min: number, max: number): void {
        let normalizedData;
        if (this.textureData.type === 'Float32Array') {
            normalizedData = new Float32Array(this.textureData.data.length);
        } else {
            normalizedData = new Uint8Array(this.textureData.data.length);
        }
        for (let i = 0; i < this.textureData.data.length; i++) {
            normalizedData[i] = ((this.textureData.data[i] - min) / (max - min)) * 255;
        }
        this.textureData.data = normalizedData;
    }

    public getValue(x: number, y: number, z: number): number {
        const index = x + y * this.textureData.width + z * this.textureData.width * this.textureData.height;
        return this.textureData.data[index];
    }

    public static fromDataArrayAtTime(dataArray: DataArray, t: number): Data3DTexture {
        const dataArray3DSlice = dataArray.get3DSliceAtTime(t);
        const dataTexture = new Data3DTexture(dataArray3DSlice, dataArray3DSlice.xLength, dataArray3DSlice.yLength, dataArray3DSlice.zLength);
        return dataTexture;
    }

    public uploadTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
        let { data, width, height, depth, type } = this.textureData;

        const texture = gl.createTexture();
        if (!texture) {
            throw new Error('Failed to create texture');
        }
        gl.bindTexture(gl.TEXTURE_3D, texture);

        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this.flipY);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, this.unpackAlignment);

        // Convert data to Uint8Array regardless of the original type
        if (!(data instanceof Uint8Array)) {
            data = new Uint8Array(data.buffer);
        }

        let internalFormat: number;
        let glType: number;
        // switch (type) {
        //     case 'Uint8Array':
                internalFormat = gl.R8;
                glType = gl.UNSIGNED_BYTE;
        //         break;
        //     case 'Float32Array':
        //         internalFormat = gl.R32F;
        //         glType = gl.FLOAT;
        //         break;
        //     default:
        //         throw new Error('Unsupported data type');
        // }

        gl.texImage3D(
            gl.TEXTURE_3D,
            0, // level
            internalFormat,
            width, // width
            height, // height
            depth, // depth
            0, // border
            gl.RED, // format
            glType,
            data // data
        );

        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);

        return texture;
    }
}