import { Object3D } from './Object3D';
import { Scene } from './Scene';
import { Camera } from './Camera';
import { Renderer } from './Renderer';
import { vec3, mat4 } from 'gl-matrix';
import DataArray from './dataArray';
import { BoxBufferGeometry } from './BoxBufferGeometry';


export interface ViewerConfig {
    useAxisHelper?: boolean;
}
interface Keypoint {
    id: number; 
    x: number; 
    color: string; 
    alpha: number;
}
export class Viewer2 {
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;

    private scene: Scene;
    private camera: Camera;
    private renderer: Renderer;
    private animationId: number | null = null;
    private controls: any;

    constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, keypoints: Keypoint[], config: ViewerConfig) {

        this.canvas = canvas;
        this.gl = gl;
        this.renderer = new Renderer(gl);
        this.scene = new Scene();
        const fieldOfView = Math.PI / 2.;
        const aspect = this.canvas.width / this.canvas.height;
        const zNear = 0.1;
        const zFar = 100.0;

        this.camera = new Camera(fieldOfView, aspect, zNear, zFar);
        this.camera.setPosition(vec3.fromValues(2.0, 2.0, 0.0));
        this.camera.setTarget(vec3.fromValues(0., 0., 0.));
        this.camera.setUp(vec3.fromValues(0, 1, 0));
        this.camera = new Camera(fieldOfView, aspect, zNear, zFar);
        if (!this.camera) {
            console.error("[viewer.ts] Unable to initialize the Camera");
            throw new Error("Unable to initialize the Camera");
        }
    }
    init(dataArray: DataArray) {
        // define cube geometry
        const cubeGeometry =  new BoxBufferGeometry(this.gl);
        // define shader program
        const isShaderProgramValid = this.renderer.createShaderProgram(vertexShaderSource, fragmentShaderSource, 'volumeRenderer');
        if (!isShaderProgramValid) {
            console.error("[viewer.ts] Unable to create the shader program");
            throw new Error("Unable to create the shader program");
        }
        const volumeShaderProgram = this.renderer.getShaderProgram('volumeRenderer');
        if (!volumeShaderProgram) {
            console.error("[viewer.ts] Unable to get the shader program");
            throw new Error("Unable to get the shader program");
        }
        const volumeObject = new Object3D(this.gl, cubeGeometry, volumeShaderProgram);
        // add uniforms
        // Initialize modelViewMatrix
        const modelViewMatrix = mat4.create();
        mat4.multiply(modelViewMatrix, this.camera.viewMatrix, volumeObject.modelMatrix);
        volumeObject.addUniform('u_modelViewMatrix', 'Matrix4fv', modelViewMatrix);
    }
    addObjectToScene(object: Object3D) {
        this.scene.addObject(object);
        this.renderer.setupVAO(object);
    }

    removeObjectFromScene(object: Object3D) {
        this.scene.removeObject(object);
    }

    startAnimationLoop() {
        const renderFrame = () => {
            this.renderer.render(this.scene, this.camera);
            this.animationId = requestAnimationFrame(renderFrame);
        };
        this.animationId = requestAnimationFrame(renderFrame);
    }

    stopAnimationLoop() {
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

const vertexShaderSource = `#version 300 es

precision lowp float;
precision lowp sampler3D;

layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec3 a_Normal;
layout(location = 2) in vec2 a_UV;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

out vec4 v_Position;
out vec4 v_vertexLocal;
out vec2 v_UV;
out vec3 v_Normal;
void main() {
  // vertex position in clip space
  v_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_Position, 1.0);
  gl_Position = v_Position;
  // vertex position in object space
  v_vertexLocal = vec4(a_Position, 1.0);
  // vertex UV coordinates
  v_UV = a_UV;
}
`;


const fragmentShaderSource = `#version 300 es

precision lowp float;
precision lowp sampler3D;
#define MAX_NUM_STEPS 512.0
#define JITTER_FACTOR 10.0
#define OPACITY_THRESHOLD (1.0 - 1.0 / 255.0)
struct RayInfo
{
    vec3 startPos;
    vec3 endPos;
    vec3 direction;
    vec2 aabbInters;
};

struct RaymarchInfo
{
    RayInfo ray;
    int numSteps;
    float numStepsRecip;
    float stepSize;
};

in vec4 v_Position;
in vec4 v_vertexLocal;
in vec2 v_UV;
in vec3 v_Normal;
out vec4 fragColor;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_modelViewInverse;
uniform mat4 u_modelMatrix;
uniform mat4 u_modelInverse;
uniform mat4 u_viewInverse;
uniform mat4 u_projectionMatrix;
uniform mat4 u_projectionInverse;
uniform vec3 u_viewDirWorldSpace;
uniform vec3 u_cameraPosWorldSpace;
uniform vec2 u_minMaxVal;
uniform highp sampler3D u_DataTex;
uniform int u_isOrtho;
uniform highp sampler2D u_NoiseTex;
uniform highp sampler2D u_TFTex;
uniform vec3 u_boxMin;
uniform vec3 u_boxMax;
uniform vec3 u_TextureSize;

// Computes object space view direction
vec3 ObjSpaceViewDir(vec4 v) {
    vec3 objSpaceCameraPos = (u_modelInverse * vec4(u_cameraPosWorldSpace.xyz, 1.0)).xyz;
    return objSpaceCameraPos - v.xyz;
}
float getNoise(vec2 uv) {
    // if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
    //     return 0.0;
    // } else {
        return texture(u_NoiseTex, vec2(uv.x, uv.y)).r;
    // }
}

vec4 getTF1DGrayscale(float density) {
    float gray = pow(density, 1.0) * 1.0;
    return vec4(gray, gray, 0.0, gray*1.0);
}
// Sample the red channel of the texture to get the density value
float getDensity(vec3 pos) {
    vec4 encodedDensity = texture(u_DataTex, pos + vec3(0.5));
    return encodedDensity.r / 255.0; 
}
vec4 getTF1D(float density) {
    // vec4 tf = texture(u_TFTex, vec2(density, 0.0));
    vec2 uv = vec2(density * 1000.0, 0.0);
    vec4 tf = texture(u_TFTex, uv);
    tf.a *= 0.005;
    return tf;

}
// Tricubic Interpolation
vec4 interpolateTricubicFast(sampler3D tex, vec3 texCoord, vec3 texSize)
{
	// shift the coordinate from [0,1] to [-0.5, texSize-0.5]
	vec3 coord_grid = texCoord * texSize - 0.5;
	vec3 index = floor(coord_grid);
	vec3 fraction = coord_grid - index;
	vec3 one_frac = 1.0 - fraction;

	vec3 w0 = 1.0/6.0 * one_frac*one_frac*one_frac;
	vec3 w1 = 2.0/3.0 - 0.5 * fraction*fraction*(2.0-fraction);
	vec3 w2 = 2.0/3.0 - 0.5 * one_frac*one_frac*(2.0-one_frac);
	vec3 w3 = 1.0/6.0 * fraction*fraction*fraction;

	vec3 g0 = w0 + w1;
	vec3 g1 = w2 + w3;
	vec3 mult = 1.0 / texSize;
	vec3 h0 = mult * ((w1 / g0) - 0.5 + index);  //h0 = w1/g0 - 1, move from [-0.5, texSize-0.5] to [0,1]
	vec3 h1 = mult * ((w3 / g1) + 1.5 + index);  //h1 = w3/g1 + 1, move from [-0.5, texSize-0.5] to [0,1]

	// fetch the eight linear interpolations
	// weighting and fetching is interleaved for performance and stability reasons
	vec4 tex000 = texture(tex, h0);
	vec4 tex100 = texture(tex, vec3(h1.x, h0.y, h0.z));
	tex000 = mix(tex100, tex000, g0.x);  //weigh along the x-direction
	vec4 tex010 = texture(tex, vec3(h0.x, h1.y, h0.z));
	vec4 tex110 = texture(tex, vec3(h1.x, h1.y, h0.z));
	tex010 = mix(tex110, tex010, g0.x);  //weigh along the x-direction
	tex000 = mix(tex010, tex000, g0.y);  //weigh along the y-direction
	vec4 tex001 = texture(tex, vec3(h0.x, h0.y, h1.z));
	vec4 tex101 = texture(tex, vec3(h1.x, h0.y, h1.z));
	tex001 = mix(tex101, tex001, g0.x);  //weigh along the x-direction
	vec4 tex011 = texture(tex, vec3(h0.x, h1.y, h1.z));
	vec4 tex111 = texture(tex, h1);
	tex011 = mix(tex111, tex011, g0.x);  //weigh along the x-direction
	tex001 = mix(tex011, tex001, g0.y);  //weigh along the y-direction

	return mix(tex001, tex000, g0.z);  //weigh along the z-direction
}

// Find ray intersection points with axis aligned bounding box
// tNear and tFar are respectively the distances from the ray origin 
// to the near intersection point
// and the  far intersection point.
vec2 intersectAABB(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax)
{
   vec3 invRayDir = 1.0 / rayDir;
   vec3 t1 = (boxMin - rayOrigin) * invRayDir;
   vec3 t2 = (boxMax - rayOrigin) * invRayDir;

   vec3 tmin = min(t1, t2);
   vec3 tmax = max(t1, t2);

   float tNear = max(max(tmin.x, tmin.y), tmin.z);
   float tFar = min(min(tmax.x, tmax.y), tmax.z);

   return vec2(tNear, tFar);
}
vec3 getViewRayDir(vec3 vertexLocal)
{
    // Computes view direction in object space
    return normalize(ObjSpaceViewDir(vec4(vertexLocal, 0.0f)));
}
// Get a ray for the specified fragment (back-to-front)
RayInfo getRayBack2Front(vec3 vertexLocal)
{
   RayInfo ray;
   ray.direction = getViewRayDir(vertexLocal);
   // get ray direction in object space
   ray.startPos = vertexLocal + vec3(0.5f);
   // Find intersections with axis aligned bounding box
   ray.aabbInters = intersectAABB(ray.startPos, ray.direction, vec3(0.0), vec3(1.0));

   // Check if camera is inside AABB
   vec3 farPos = ray.startPos + ray.direction * ray.aabbInters.y - vec3(0.5f, 0.5f, 0.5f);
   vec4 clipPos = u_projectionMatrix * u_modelViewMatrix * vec4(farPos, 1.0f);
   ray.aabbInters += min(clipPos.w, 0.0);

   ray.endPos = ray.startPos + ray.direction * ray.aabbInters.y;
   return ray;
}

// Get a ray for the specified fragment (front-to-back)
RayInfo getRayFront2Back(vec3 vertexLocal)
{
    RayInfo ray = getRayBack2Front(vertexLocal);
    ray.direction = -ray.direction;
    vec3 tmp = ray.startPos;
    ray.startPos = ray.endPos;
    ray.endPos = tmp;
    return ray;
}

RaymarchInfo initRaymarch(RayInfo ray, int maxNumSteps)
{
    RaymarchInfo raymarchInfo;
    vec3 volumeSize = u_boxMax - u_boxMin;
    // raymarchInfo.stepSize = 10.0 / float(maxNumSteps);
    raymarchInfo.stepSize = 1.732f  / float(maxNumSteps);
    raymarchInfo.numSteps = int(clamp(abs(ray.aabbInters.x - ray.aabbInters.y) / float(raymarchInfo.stepSize), 1.0, float(maxNumSteps)));
    raymarchInfo.numStepsRecip = 1.0 / float(raymarchInfo.numSteps);
    return raymarchInfo;
}

void main() {
    RayInfo ray = getRayFront2Back(v_vertexLocal.xyz);
    // RayInfo ray = getRayBack2Front(v_vertexLocal.xyz);
    RaymarchInfo raymarchInfo = initRaymarch(ray, int(MAX_NUM_STEPS));
 
    // vec3 lightDir = normalize(u_viewDirWorldSpace);
 
    // Create a small random offset in order to remove artifacts
    // Change the position from clipspace coordinates [-1 ; 1] to normalized device coordinates [0 ; 1]
    ray.startPos += (JITTER_FACTOR * ray.direction * raymarchInfo.stepSize) * getNoise(v_UV);

    vec4 col = vec4(0.0f, 0.0f, 0.0f, 0.0f);
    for (int iStep = 0; iStep < raymarchInfo.numSteps; iStep++)
    {
        float t = float(iStep) * raymarchInfo.numStepsRecip;
        vec3 currPos = mix(ray.startPos, ray.endPos, t);
 
        // Get the density/sample value of the current position
        float density = getDensity((currPos - vec3(0.5f, 0.5f, 0.5f)));
        vec3 worldPos = (u_modelMatrix * v_vertexLocal).xyz + vec3(0.5f, 0.5f, 0.5f);
        // float density = length((currPos - vec3(0.5f, 0.5f, 0.5f)) * 4.5);
        // Apply visibility window
        if (density < u_minMaxVal.x || density > u_minMaxVal.y) continue;
 
        // Apply 1D transfer function
        vec4 src = getTF1D(density);
        if (src.a == 0.0)
           continue;
        src.rgb *= src.a;
        col = (1.0f - col.a) * src + col;
        
        // Early ray termination
        if (col.a > OPACITY_THRESHOLD) {
            break;
        }
    }
    // Write fragment output
    fragColor = vec4(col.rgb, col.a);
    // fragColor = vec4( vec3(texture(u_NoiseTex, vec2(v_UV.x, v_UV.y)).r ), 1.0);
    // fragColor = vec4( vec3(v_UV.x, 1.0, 1.0), 1.0);

 }
`;
