// this.gl.enable(this.gl.SCISSOR_TEST);

function drawRect(gl: WebGL2RenderingContext, x: number, y: number, width: number, height: number, color: number[]) {
    gl.scissor(x, y, width, height);
    gl.clearColor(color[0], color[1], color[2], color[3]);
    gl.clear(gl.COLOR_BUFFER_BIT);
}

for (let i = 0; i < 100; ++i) {
    const x = rand(0, 300);
    const y = rand(0, 150);
    const width = rand(0, 300 - x);
    const height = rand(0, 150 - y);
    // drawRect(this.gl, x, y, width, height, [rand(0,1), rand(0,1), rand(0,1), 1]);
}

function rand(min:number, max:number) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    return Math.random() * (max - min) + min;
}