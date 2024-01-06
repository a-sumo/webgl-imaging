import DataArray from './dataArray';
import { gunzipSync } from 'fflate';
import { vec3, mat4 } from 'gl-matrix';

export default class NRRDLoader {
    headerObject: any;
    dataPointer: number;
    data_start: number;
    data: any;
    nativeLittleEndian: boolean;
    littleEndian: boolean;
    segmentation: any;

    constructor() {
        this.headerObject = {};
        this.dataPointer = 0;
        this.data_start = 0;
        this.data = null;
        this.nativeLittleEndian =  new Int8Array( new Int16Array( [ 1 ] ).buffer )[ 0 ] > 0;
        this.littleEndian = true;

    }
    public load(url: string, callback: (dataArray: DataArray) => void): void {
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                const dataArray = this.parse(arrayBuffer);
                callback(dataArray);
            })
            .catch(error => console.error('NRRD Loader Error:', error));
    }

    public parse(dataBuffer: ArrayBuffer): DataArray {
        this.data = dataBuffer;
        const bytes = this.scan('uchar', this.data.byteLength);
        const length = bytes.length;
        let header = '';

        for (let i = 1; i < length; i++) {
            if (bytes[i - 1] == 10 && bytes[i] == 10) {
                // we found two line breaks in a row
                // now we know what the header is
                header = this.parseChars(bytes, 0, i - 2);
                // this is where the data starts
                this.data_start = i + 1;
                break;
            }
        }

        // parse the header
        this.parseHeader(header);
        // extract the data

        let data = bytes.subarray(this.data_start); // the data without header
        if (this.headerObject.encoding.substring(0, 2) === 'gz') {
            data = gunzipSync(new Uint8Array(data));
        } else if (['ascii', 'text', 'txt', 'hex'].includes(this.headerObject.encoding)) {
            data = this.parseDataAsText(data);
        } else if (this.headerObject.encoding === 'raw') {
            const copy = new Uint8Array(data.length);
            for (let i = 0; i < data.length; i++) {
                copy[i] = data[i];
            }
            data = copy;
        }

        data = data.buffer;
        const fieldFunctionData = new this.headerObject.__array(data);
        const dataArray = new DataArray(fieldFunctionData, this.headerObject.sizes[0], this.headerObject.sizes[1], this.headerObject.sizes[2],  this.headerObject.sizes[3], fieldFunctionData.constructor.name);
        dataArray.header = this.headerObject;
        dataArray.segmentation = this.segmentation;

        // get the min and max intensities
        const { min, max } = dataArray.computeMinMax();

        // attach the scalar range to the volume
        dataArray.windowLow = min;
        dataArray.windowHigh = max;

        // get the image dimensions
        dataArray.dimensions =  [this.headerObject.sizes[0], this.headerObject.sizes[1], this.headerObject.sizes[2], this.headerObject.sizes[3]];

        // Identify axis order in the space-directions matrix from the header if possible.
        if (this.headerObject.vectors) {
            const xIndex = this.headerObject.vectors.findIndex((vector: number[]) => vector[0] !== 0);
            const yIndex = this.headerObject.vectors.findIndex((vector: number[]) => vector[1] !== 0);
            const zIndex = this.headerObject.vectors.findIndex((vector: number[]) => vector[2] !== 0);

            const axisOrder = [];

            if (xIndex !== yIndex && xIndex !== zIndex && yIndex !== zIndex) {
                axisOrder[xIndex] = 'x';
                axisOrder[yIndex] = 'y';
                axisOrder[zIndex] = 'z';
            } else {
                axisOrder[0] = 'x';
                axisOrder[1] = 'y';
                axisOrder[2] = 'z';
            }

            dataArray.axisOrder = axisOrder;
        } else {
            dataArray.axisOrder = ['x', 'y', 'z'];
        }

        // spacing
        const spacingX = vec3.length(vec3.fromValues(this.headerObject.vectors[0][0], this.headerObject.vectors[0][1], this.headerObject.vectors[0][2]));
        const spacingY = vec3.length(vec3.fromValues(this.headerObject.vectors[1][0], this.headerObject.vectors[1][1], this.headerObject.vectors[1][2]));
        const spacingZ = vec3.length(vec3.fromValues(this.headerObject.vectors[2][0], this.headerObject.vectors[2][1], this.headerObject.vectors[2][2]));
        dataArray.spacing = [spacingX, spacingY, spacingZ];
        
        // Create IJKtoRAS matrix
        dataArray.matrix = mat4.create();
        
        let transitionMatrix = mat4.create();
        
        if (this.headerObject.space === 'left-posterior-superior') {
            transitionMatrix = mat4.fromValues(
                -1, 0, 0, 0,
                0, -1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
        } else if (this.headerObject.space === 'left-anterior-superior') {
            transitionMatrix = mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, -1, 0,
                0, 0, 0, 1
            );
        }
        
        if (!this.headerObject.vectors) {
            dataArray.matrix = mat4.fromValues(
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1
            );
        } else {
            const v = this.headerObject.vectors;
        
            const ijk_to_transition = mat4.fromValues(
                v[0][0], v[1][0], v[2][0], 0,
                v[0][1], v[1][1], v[2][1], 0,
                v[0][2], v[1][2], v[2][2], 0,
                0, 0, 0, 1
            );
        
            const transition_to_ras = mat4.create();
            mat4.multiply(transition_to_ras, ijk_to_transition, transitionMatrix);
        
            dataArray.matrix = transition_to_ras;
        }
        
        dataArray.inverseMatrix = mat4.create();
        mat4.invert(dataArray.inverseMatrix, dataArray.matrix);
        
        dataArray.RASDimensions = [
            Math.floor(dataArray.xLength * spacingX),
            Math.floor(dataArray.yLength * spacingY),
            Math.floor(dataArray.zLength * spacingZ)
        ];
        
        // .. and set the default threshold
        // only if the threshold was not already set
        if (dataArray.lowerThreshold === -Infinity) {
            dataArray.lowerThreshold = min;
        }
        
        if (dataArray.upperThreshold === Infinity) {
            dataArray.upperThreshold = max;
        }
        return dataArray;
    }
    private parseDataAsText(data: Uint8Array, start?: number, end?: number): any {
        let number = '';
        start = start || 0;
        end = end || data.length;
        let value;

        // length of the result is the product of the sizes
        const lengthOfTheResult = this.headerObject.sizes.reduce((previous: any, current: any) => previous * current, 1);

        let base = 10;
        if (this.headerObject.encoding === 'hex') {
            base = 16;
        }

        const result = new (this.headerObject as any).__array(lengthOfTheResult);
        let resultIndex = 0;
        let parsingFunction = parseInt;
        if ((this.headerObject as any).__array === Float32Array || (this.headerObject as any).__array === Float64Array) {
            parsingFunction = parseFloat;
        }

        for (let i = start; i < end; i++) {
            value = data[i];
            // if value is not a space
            if ((value < 9 || value > 13) && value !== 32) {
                number += String.fromCharCode(value);
            } else {
                if (number !== '') {
                    result[resultIndex] = parsingFunction(number, base);
                    resultIndex++;
                }
                number = '';
            }
        }

        if (number !== '') {
            result[resultIndex] = parsingFunction(number, base);
            resultIndex++;
        }

        return result;
    }
    private parseHeader(in_header: string) {
        let data: string, field: string, fn: Function, m: RegExpMatchArray | null;
        const lines = in_header.split(/\r?\n/);

        for (let i = 0, len = lines.length; i < len; i++) {
            const line = lines[i];
            if (line.match(/NRRD\d+/)) {
                this.headerObject.isNrrd = true;
            } else if (!line.match(/^#/) && (m = line.match(/(.*):(.*)/))) {
                field = m[1].trim();
                data = m[2].trim();
                fn = this.fieldFunctions[field as keyof typeof this.fieldFunctions];
                if (fn) {
                    fn.call(this.headerObject, data);
                } else {
                    this.headerObject[field] = data;
                }
            }
        }
        if (!this.headerObject.isNrrd) {
            throw new Error('Not an NRRD file');
        }

        if (this.headerObject.encoding === 'bz2' || this.headerObject.encoding === 'bzip2') {
            throw new Error('Bzip is not supported');
        }

        if (!this.headerObject.vectors) {
            // if no space direction is set, let's use the identity
            this.headerObject.vectors = [];
            this.headerObject.vectors.push([1, 0, 0]);
            this.headerObject.vectors.push([0, 1, 0]);
            this.headerObject.vectors.push([0, 0, 1]);

            // apply spacing if defined
            if (this.headerObject.spacings) {
                for (let i = 0; i <= 2; i++) {
                    if (!isNaN(this.headerObject.spacings[i])) {
                        for (let j = 0; j <= 2; j++) {
                            this.headerObject.vectors[i][j] *= this.headerObject.spacings[i];
                        }
                    }
                }
            }
        }
    }

    private parseChars(array: any, start: any, end: any) {

        // without borders, use the whole array
        if (start === undefined) {

            start = 0;

        }

        if (end === undefined) {

            end = array.length;

        }

        let output = '';
        // create and append the chars
        let i = 0;
        for (i = start; i < end; ++i) {

            output += String.fromCharCode(array[i]);

        }

        return output;

    }

    private scan(type: string, chunks: number): any {
        let chunkSize = 1;
        let arrayType: any = Uint8Array;

        switch (type) {
            case 'uchar':
                break;
            case 'schar':
                arrayType = Int8Array;
                break;
            case 'ushort':
                arrayType = Uint16Array;
                chunkSize = 2;
                break;
            case 'sshort':
                arrayType = Int16Array;
                chunkSize = 2;
                break;
            case 'uint':
                arrayType = Uint32Array;
                chunkSize = 4;
                break;
            case 'sint':
                arrayType = Int32Array;
                chunkSize = 4;
                break;
            case 'float':
                arrayType = Float32Array;
                chunkSize = 4;
                break;
            case 'complex':
            case 'double':
                arrayType = Float64Array;
                chunkSize = 8;
                break;
            default:
                throw new Error(`Unsupported data type: ${type}`);
        }
        // increase the data pointer in-place
        var bytes = new arrayType(this.data.slice(this.dataPointer, this.dataPointer += chunks * chunkSize));

        // if required, flip the endianness of the bytes
        if (this.nativeLittleEndian != this.littleEndian) {
            // we need to flip here since the format doesn't match the native endianness
            bytes = this.flipEndianness(bytes, chunkSize);
        }

        // return the byte array
        return bytes;
    } 
    private flipEndianness(array: any, chunkSize: any) {

        const u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (let i = 0; i < array.byteLength; i += chunkSize) {

            for (let j = i + chunkSize - 1, k = i; j > k; j--, k++) {

                const tmp = u8[k];
                u8[k] = u8[j];
                u8[j] = tmp;

            }

        }

        return array;

    }
    private fieldFunctions = {
        type: (data: string) => {
            switch (data) {
                case 'uchar':
                case 'unsigned char':
                case 'uint8':
                case 'uint8_t':
                    this.headerObject.__array = Uint8Array;
                    break;
                case 'signed char':
                case 'int8':
                case 'int8_t':
                    this.headerObject.__array = Int8Array;
                    break;
                case 'short':
                case 'short int':
                case 'signed short':
                case 'signed short int':
                case 'int16':
                case 'int16_t':
                    this.headerObject.__array = Int16Array;
                    break;
                case 'ushort':
                case 'unsigned short':
                case 'unsigned short int':
                case 'uint16':
                case 'uint16_t':
                    this.headerObject.__array = Uint16Array;
                    break;
                case 'int':
                case 'signed int':
                case 'int32':
                case 'int32_t':
                    this.headerObject.__array = Int32Array;
                    break;
                case 'uint':
                case 'unsigned int':
                case 'uint32':
                case 'uint32_t':
                    this.headerObject.__array = Uint32Array;
                    break;
                case 'float':
                    this.headerObject.__array = Float32Array;
                    break;
                case 'double':
                    this.headerObject.__array = Float64Array;
                    break;
                default:
                    throw new Error('Unsupported NRRD data type: ' + data);

            }
            this.headerObject.type = data;
        },
        endian: (data: string) => {
            this.headerObject.endian = data;
        },
        encoding: (data: string) => {
            this.headerObject.encoding = data;
        },
        dimension: (data: string) => {
            this.headerObject.dim = parseInt(data, 10);
        },
        sizes: (data: string) => {
            this.headerObject.sizes = data.split(/\s+/).map(i => parseInt(i, 10));
        },
        space: (data: string) => {
            this.headerObject.space = data;
        },
        'space origin': (data: string) => {
            this.headerObject.space_origin = data.split('(')[1].split(')')[0].split(',');
        },
        'space directions': (data: string) => {
            const parts = data.match(/\(.*?\)/g);
            this.headerObject.vectors = parts?.map(v => v.slice(1, -1).split(',').map(f => parseFloat(f)));
        },
        spacings: (data: string) => {
            this.headerObject.spacings = data.split(/\s+/).map(f => parseFloat(f));
        },
    };
}
