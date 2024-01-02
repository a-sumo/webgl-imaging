export class Texture {
    magFilter: number;
    minFilter: number;
    wrapR: number;
    generateMipmaps: boolean;
    flipY: boolean;
    unpackAlignment: number;
    premultiplyAlpha: boolean;
    internalFormat: number;
    format: number;
    glType: number;

    constructor() {
        this.magFilter = 9728; // NearestFilter
        this.minFilter = 9728; // NearestFilter
        this.wrapR = 33071; // ClampToEdgeWrapping
        this.generateMipmaps = false;
        this.flipY = false;
        this.unpackAlignment = 1;
        this.premultiplyAlpha = false;
        this.internalFormat = 6408; // RGBA
        this.format = 6408; // RGBA
        this.glType = 5121; // UNSIGNED_BYTE
    }

}