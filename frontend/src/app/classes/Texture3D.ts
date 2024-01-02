import DataArray from './dataArray';
import { Texture } from './Texture';

export class Texture3D extends Texture {
    textureData: { data: any, width: number, height: number, depth: number, type?: string };

    constructor(dataArray: DataArray, width: number, height: number, depth: number) {
        super();
        this.textureData = { data: dataArray.data, width, height, depth, type: dataArray.dataType };
    }

    public getValue(x: number, y: number, z: number): number {
        const index = x + y * this.textureData.width + z * this.textureData.width * this.textureData.height;
        return this.textureData.data[index];
    }

    public static fromDataArrayAtTime(dataArray: DataArray, t: number): Texture3D {
        const dataArray3DSlice = dataArray.get3DSliceAtTime(t);
        const dataTexture = new Texture3D(dataArray3DSlice, dataArray3DSlice.xLength, dataArray3DSlice.yLength, dataArray3DSlice.zLength);
        return dataTexture;
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


}