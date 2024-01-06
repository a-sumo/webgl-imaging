import { mat4, mat3, vec3 } from 'gl-matrix';

export default class DataArray {
    public data: any;
    public xLength: number;
    public yLength: number;
    public zLength: number;
    public tLength: number;
    public dataType: string;
    public header: any;
    public segmentation: any;
    public windowLow: number;
    public windowHigh: number;
    public dimensions: number[];
    public axisOrder: string[];
    public spacing: number[];
    public matrix: any;
    public inverseMatrix: any;
    public RASDimensions: number[];
    public lowerThreshold: number;
    public upperThreshold: number;

    constructor(data: any, xLength: number, yLength: number, zLength: number, tLength: number, dataType: string) {
        this.data = data;
        this.xLength = xLength;
        this.yLength = yLength;
        this.zLength = zLength;
        this.tLength = tLength;
        this.dataType = dataType;
        this.lowerThreshold = -Infinity;
        this.upperThreshold = Infinity;
        this.windowLow = -Infinity;
        this.windowHigh = Infinity;
        this.dimensions = [xLength, yLength, zLength, tLength];
        this.axisOrder = ['x', 'y', 'z', 't'];
        this.spacing = [1, 1, 1, 1];
        this.matrix = mat4.create();
        this.inverseMatrix = mat4.create();
        this.RASDimensions = [xLength, yLength, zLength];

    }
    public getValue(x: number, y: number, z: number, t: number): number {
        const index = x + y * this.xLength + z * this.xLength * this.yLength + t * this.xLength * this.yLength * this.zLength;
        return this.data[index];
    }
    public computeMinMax() {
        var arr = this.data;
        let len = arr.length;
        let max = -Infinity;
        let min = +Infinity;
        while (len--) {
            max = arr[len] > max ? arr[len] : max;
            min = arr[len] < min ? arr[len] : min;

        }
        return { 'min': min, 'max': max };
    }
    public get3DSliceAtTime(t: number): DataArray {
        const sliceSize = this.xLength * this.yLength * this.zLength;
        const sliceData = new (this.data.constructor as any)(sliceSize);
        let index = 0;
        for (let z = 0; z < this.zLength; z++) {
            for (let y = 0; y < this.yLength; y++) {
                for (let x = 0; x < this.xLength; x++) {
                    sliceData[index++] = this.getValue(x, y, z, t);
                }
            }
        }
        return new DataArray(sliceData, this.xLength, this.yLength, this.zLength, 1, this.dataType);
    }
    static createZeroFilled(xLength: number, yLength: number, zLength: number, tLength: number, dataType: string): DataArray {
        const size = xLength * yLength * zLength * tLength;
        let data;
        switch (dataType) {
            case 'float32':
                data = new Float32Array(size);
                break;
            case 'int32':
                data = new Int32Array(size);
                break;
            // Add more cases here if you have other data types
            default:
                throw new Error(`Unsupported data type: ${dataType}`);
        }
        return new DataArray(data, xLength, yLength, zLength, tLength, dataType);
    }
}

