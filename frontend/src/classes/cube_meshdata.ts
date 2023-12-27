export class CubeMeshData {
    normals: number[][];
    vertices: number[][];
    faces: number[][];
    uvs: number[][];
    constructor() {
        this.vertices = [
            [-0.5, -0.5, -0.5], // 0
            [0.5, -0.5, -0.5], // 1
            [0.5, 0.5, -0.5], // 2
            [-0.5, 0.5, -0.5], // 3
            [-0.5, -0.5, 0.5], // 4
            [0.5, -0.5, 0.5], // 5
            [0.5, 0.5, 0.5],  // 6
            [-0.5, 0.5, 0.5]  // 7
        ];
        
        this.faces = [
            // Each quad face is split into two triangle faces
            [0, 1, 2], [0, 2, 3], // Front face
            [4, 6, 5], [4, 7, 6], // Back face
            [1, 5, 6], [1, 6, 2], // Right face
            [0, 3, 7], [0, 7, 4], // Left face
            [3, 2, 6], [3, 6, 7], // Top face
            [0, 4, 5], [0, 5, 1]  // Bottom face
        ];
        this.normals = [
            [0, 0, -1], // Front face
            [0, 0, -1], // Front face
            [0, 0, 1], // Back face,
            [0, 0, 1], // Back face
            [1, 0, 0], // Right face,
            [1, 0, 0], // Right face
            [0, 1, 0], // Top face,
            [0, 1, 0], // Top face
            [-1, 0, 0], // Left face,
            [-1, 0, 0], // Left face
            [0, -1, 0], // Bottom face,
            [0, -1, 0] // Bottom face
        ];
        this.uvs = [
            // Front face
            [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
            // Back face
            [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
            // Right face
            [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
            // Left face
            [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
            // Top face
            [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0],
            // Bottom face
            [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]
        ];
    }
}
