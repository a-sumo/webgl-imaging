import DataArray from './dataArray';
import { Texture } from './Texture';

export class Texture2D extends Texture {
    textureData: { data: any, width: number, height: number, type?: string };

    constructor(dataArray: DataArray, width: number, height: number) {
        super();
        this.textureData = { data: dataArray.data, width, height, type: dataArray.dataType };
    }

    public static fromDataArray(dataArray: DataArray): Texture2D {
        const dataTexture = new Texture2D(dataArray, dataArray.xLength, dataArray.yLength);
        return dataTexture;
    }
    public static fromData(data: any, width: number, height: number): Texture2D {
        const dataTexture = new Texture2D(new DataArray(data, width, height, 1, 1, 'Uint8Array'), width, height);
        return dataTexture;
    }
    
}