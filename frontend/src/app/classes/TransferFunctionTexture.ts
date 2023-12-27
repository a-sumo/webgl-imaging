export default class TransferFunctionTexture {
    isTransferFunctionTexture: boolean;
    image: { data: Uint8Array, width: number };
    magFilter: number;
    minFilter: number;
    wrapR: number;
    generateMipmaps: boolean;
    flipY: boolean;
    unpackAlignment: number;
    premultiplyAlpha: boolean;

    constructor(data: Uint8Array, width: number) {
        this.isTransferFunctionTexture = true;
        this.image = { data, width };
        this.magFilter = 9728; // NearestFilter
        this.minFilter = 9728; // NearestFilter
        this.wrapR = 33071; // ClampToEdgeWrapping
        this.generateMipmaps = false;
        this.flipY = false;
        this.unpackAlignment = 1;
        this.premultiplyAlpha = false;
    }

    public getValue(x: number): number | undefined {
        const idx = x * 4;
        if (idx < this.image.data.length) {
            return this.image.data[idx];
        }
        return undefined;
    }
}